import {
  RunnerModel,
  isHazard,
  INITIAL_STATE,
  type Action,
  type GameState,
} from './core';
import { Renderer } from './renderer';
import { GameAudio } from './audio';
import {
  freshProgress,
  loadProgress,
  saveProgress,
  recordRun,
  type Progress,
  type Mode,
} from './progress';
import { LEVELS } from './levels';
export type GameView = GameState & {
  progress: Progress;
  spinCooldown: number;
  storageAvailable: boolean;
};
export const INITIAL_VIEW: GameView = {
  ...INITIAL_STATE,
  progress: freshProgress(),
  spinCooldown: 0,
  storageAvailable: true,
};
const AUDIO_KEY = 'kosterbros.muted.v1';

type PageTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type ToolDocument = Document & {
  modelContext?: {
    registerTool: (
      tool: PageTool,
      options: { signal: AbortSignal },
    ) => void | Promise<void>;
  };
};
export class Game {
  model = new RunnerModel();
  audio = new GameAudio();
  renderer: Renderer;
  progress = freshProgress();
  storageAvailable = true;
  onState: (state: GameView) => void;
  private raf = 0;
  private last = 0;
  private publishTimer = 0;
  private locked = false;
  private destroyed = false;
  private lifecycle = new AbortController();
  private testTick: (() => void) | null = null;
  private testCleanup: (() => void) | null = null;
  private testing =
    import.meta.env.DEV &&
    new URLSearchParams(location.search).get('test') === 'perfect';
  private orientation = window.matchMedia('(orientation: portrait)');
  get muted() {
    return this.model.state.muted;
  }
  constructor(canvas: HTMLCanvasElement, onState: (state: GameView) => void) {
    this.onState = onState;
    try {
      this.progress = loadProgress(localStorage);
      this.model.state.muted = localStorage.getItem(AUDIO_KEY) === 'true';
    } catch {
      this.storageAvailable = false;
    }
    this.audio.setMuted(this.muted);
    this.renderer = new Renderer(canvas, this.model);
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('blur', this.blur);
    document.addEventListener('visibilitychange', this.visibility);
    this.orientation.addEventListener('change', this.blur);
    if (import.meta.env.DEV && this.testing)
      void import('../tests/browser-fixture').then(
        ({ installBrowserFixture }) => {
          if (this.destroyed) return;
          const fixture = installBrowserFixture(this);
          this.testTick = fixture.tick;
          this.testCleanup = fixture.cleanup;
        },
      );
    this.registerTools();
    this.publish();
    this.raf = requestAnimationFrame(this.frame);
  }
  private publish() {
    this.onState({
      ...this.model.state,
      effects: { ...this.model.state.effects },
      counts: { ...this.model.state.counts },
      progress: this.progress,
      spinCooldown: this.model.spinCooldown,
      storageAvailable: this.storageAvailable,
    });
  }
  private frame = (now: number) => {
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0;
    this.last = now;
    this.testTick?.();
    this.model.step(dt);
    this.audio.update(
      dt,
      this.model.state.status === 'running',
      this.model.state.level,
      this.model.state.discoRemaining > 0,
    );
    this.flushEvents();
    this.renderer.render(dt);
    this.publishTimer += dt;
    if (this.publishTimer > 0.075) {
      this.publishTimer = 0;
      this.publish();
    }
    this.raf = requestAnimationFrame(this.frame);
  };
  private flushEvents() {
    for (const e of this.model.events) {
      this.audio.effect(e.type);
      this.renderer.event(e);
      if (e.type === 'win' || e.type === 'lose') {
        const s = this.model.state;
        this.progress = recordRun(
          this.progress,
          s.level,
          s.mode,
          s.score,
          s.medals,
        );
        if (!this.testing) {
          try {
            this.storageAvailable = saveProgress(localStorage, this.progress);
          } catch {
            this.storageAvailable = false;
          }
        }
        this.publish();
      }
    }
    this.model.events = [];
  }
  select(level: number, mode: Mode = this.model.state.mode) {
    if (
      this.locked ||
      !['menu', 'won', 'lost'].includes(this.model.state.status) ||
      !Number.isInteger(level) ||
      !LEVELS[level] ||
      level > this.progress.modes[mode].unlocked
    )
      return false;
    this.model.state.level = level;
    this.model.state.stage = level;
    this.model.state.mode = mode;
    this.model.state.best = this.progress.modes[mode].records[level];
    this.publish();
    return true;
  }
  start(level = this.model.state.level, mode: Mode = this.model.state.mode) {
    if (!this.select(level, mode)) return false;
    this.audio.unlock();
    this.model.start(
      level,
      mode,
      crypto.getRandomValues(new Uint32Array(1))[0],
      this.progress.modes[mode].records[level],
    );
    this.renderer.reset();
    this.audio.beat = 0;
    this.last = 0;
    this.publish();
    return true;
  }
  pause() {
    this.model.pause();
    this.publish();
  }
  resume() {
    if (this.locked) return;
    this.audio.unlock();
    this.model.resume();
    this.last = 0;
    this.publish();
  }
  menu() {
    this.model.menu();
    this.renderer.reset();
    this.publish();
  }
  action(action: Action) {
    if (this.locked) return false;
    this.audio.unlock();
    const result = this.model.action(action);
    this.flushEvents();
    this.publish();
    return result;
  }
  setMuted(value: boolean) {
    this.model.state.muted = value;
    this.audio.unlock();
    this.audio.setMuted(value);
    try {
      localStorage.setItem(AUDIO_KEY, String(value));
    } catch {}
    this.publish();
  }
  setInputLocked(value: boolean) {
    this.locked = value;
  }
  private keyDown = (e: KeyboardEvent) => {
    if (this.locked || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const s = this.model.state.status;
    if (e.code === 'KeyM') {
      e.preventDefault();
      this.setMuted(!this.muted);
      return;
    }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      if (s === 'paused') this.resume();
      else this.pause();
      return;
    }
    if (
      e.code === 'Enter' &&
      ['menu', 'won', 'lost'].includes(s) &&
      !(e.target instanceof HTMLElement && e.target.closest('button'))
    ) {
      e.preventDefault();
      this.start();
      return;
    }
    if (s !== 'running') return;
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
      e.preventDefault();
      this.action('jump');
    }
    if (['KeyX', 'ArrowDown', 'KeyS'].includes(e.code)) {
      e.preventDefault();
      this.action('spin');
    }
    if (e.code === 'KeyB') {
      e.preventDefault();
      this.action('power');
    }
  };
  private blur = () => this.pause();
  private visibility = () => {
    if (document.hidden) this.pause();
  };
  private snapshot() {
    const m = this.model;
    return {
      ...m.state,
      height: Math.round(m.height),
      spinRemaining: m.spin,
      spinCooldown: m.spinCooldown,
      unlocked: this.progress.modes[m.state.mode].unlocked,
      nextObstacles: m.items
        .filter((i) => !i.resolved && isHazard(i.kind))
        .slice(0, 3)
        .map((i) => ({
          kind: i.kind,
          secondsUntil: i.when - m.state.time,
          distance: Math.round(m.offset(i)),
        })),
    };
  }
  private registerTools() {
    const ctx = (document as ToolDocument).modelContext;
    if (!ctx?.registerTool) return;
    const register = (tool: PageTool) => {
      try {
        void Promise.resolve(
          ctx.registerTool(tool, { signal: this.lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    const annotations = { readOnlyHint: false, untrustedContentHint: false };
    register({
      name: 'read_run_state',
      title: 'Bekijk de run',
      description: 'Read level, moves, energy and approaching obstacles.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { ...annotations, readOnlyHint: true },
      execute: () => this.snapshot(),
    });
    register({
      name: 'start_run',
      title: 'Start een level',
      description:
        'Start an unlocked level with a countdown, from menu or results. Levels are numbered 1 through 6.',
      inputSchema: {
        type: 'object',
        properties: {
          level: { type: 'integer', minimum: 1, maximum: 6 },
          mode: { type: 'string', enum: ['solo', 'coop'] },
        },
        additionalProperties: false,
      },
      annotations,
      execute: (input) => {
        const v = input as { level?: number; mode?: Mode };
        if (v.mode !== undefined && v.mode !== 'solo' && v.mode !== 'coop')
          throw new Error('Invalid mode');
        if (
          !this.start(
            v.level === undefined ? this.model.state.level : v.level - 1,
            v.mode,
          )
        )
          throw new Error('Level locked or a run is active');
        return this.snapshot();
      },
    });
    register({
      name: 'perform_move',
      title: 'Spring, spin of BRO POWER',
      description:
        'Use the same actions as the visible controls. Moves only work while running.',
      inputSchema: {
        type: 'object',
        properties: {
          move: { type: 'string', enum: ['jump', 'spin', 'power'] },
        },
        required: ['move'],
        additionalProperties: false,
      },
      annotations,
      execute: (input) => {
        const move = (input as { move?: unknown })?.move;
        if (move !== 'jump' && move !== 'spin' && move !== 'power')
          throw new Error('Invalid move');
        return { accepted: this.action(move), ...this.snapshot() };
      },
    });
  }
  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.lifecycle.abort();
    this.testCleanup?.();
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('blur', this.blur);
    document.removeEventListener('visibilitychange', this.visibility);
    this.orientation.removeEventListener('change', this.blur);
    this.renderer.destroy();
    this.audio.destroy();
  }
}
