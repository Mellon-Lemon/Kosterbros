import { SETTINGS as S, POWERUPS, type PowerUp } from './settings.ts';
import { LEVELS, type Challenge } from './levels.ts';
import {
  buildCourse,
  distanceAt,
  isHazard,
  type CourseItem,
  type Segment,
} from './course.ts';
import type { Mode, Medals } from './progress.ts';
export { distanceAt, speedAt, isHazard } from './course.ts';
export type { CourseItem } from './course.ts';
export type Status =
  | 'menu'
  | 'countdown'
  | 'running'
  | 'paused'
  | 'won'
  | 'lost';
export type Action = 'jump' | 'spin' | 'power';
export type Effects = {
  shield: number;
  magnet: number;
  double: number;
  boost: number;
  bro: number;
};
export type GameState = {
  status: Status;
  score: number;
  best: number;
  newBest: boolean;
  time: number;
  stage: number;
  level: number;
  mode: Mode;
  seed: number;
  lives: number;
  stars: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  bro: 'epke' | 'tieme';
  countdown: number;
  tip: string;
  muted: boolean;
  charge: boolean;
  energy: number;
  effects: Effects;
  counts: Record<Challenge, number>;
  damage: number;
  medals: Medals;
  ropeRemaining: number;
  discoRemaining: number;
  discos: number;
  discoHits: number;
};
export const INITIAL_STATE: GameState = {
  status: 'menu',
  score: 0,
  best: 0,
  newBest: false,
  time: 0,
  stage: 0,
  level: 0,
  mode: 'solo',
  seed: S.seed,
  lives: S.lives,
  stars: 0,
  combo: 0,
  maxCombo: 0,
  multiplier: 1,
  bro: 'epke',
  countdown: S.countdown,
  tip: '',
  muted: false,
  charge: false,
  energy: 0,
  effects: { shield: 0, magnet: 0, double: 0, boost: 0, bro: 0 },
  counts: { rings: 0, ropes: 0, perfects: 0, lows: 0, combos: 0, powers: 0 },
  damage: 0,
  medals: [false, false, false],
  ropeRemaining: 0,
  discoRemaining: 0,
  discos: 0,
  discoHits: 0,
};
export type GameEvent = {
  type:
    | 'jump'
    | 'doublejump'
    | 'spin'
    | 'star'
    | 'ring'
    | 'rope'
    | 'disco'
    | 'discohit'
    | 'perfect'
    | 'powerup'
    | 'power'
    | 'clear'
    | 'hit'
    | 'shield'
    | 'stage'
    | 'win'
    | 'lose'
    | 'tick';
  text?: string;
  x?: number;
  height?: number;
  color?: string;
};
const initial = (): GameState => ({
  ...INITIAL_STATE,
  effects: { ...INITIAL_STATE.effects },
  counts: { ...INITIAL_STATE.counts },
  medals: [false, false, false],
});
export class RunnerModel {
  state = initial();
  items: CourseItem[] = [];
  segments: Segment[] = [];
  events: GameEvent[] = [];
  height = 0;
  velocity = 0;
  spin = 0;
  spinCooldown = 0;
  immunity = 0;
  distance = 0;
  discoGroup = -1;
  doubleUsed = false;
  lastSpin = -100;
  rope: CourseItem | null = null;
  get level() {
    return LEVELS[this.state.level];
  }
  get shield() {
    return this.state.effects.shield;
  }
  start(
    level = this.state.level,
    mode: Mode = this.state.mode,
    seed = S.seed,
    best = this.state.best,
  ) {
    if (!Number.isInteger(level) || !LEVELS[level]) return false;
    const muted = this.state.muted;
    this.state = {
      ...initial(),
      status: 'countdown',
      level,
      stage: level,
      mode,
      seed,
      best,
      muted,
    };
    const course = buildCourse(level, seed);
    this.items = course.items;
    this.segments = course.segments;
    this.events = [];
    this.height =
      this.velocity =
      this.spin =
      this.spinCooldown =
      this.immunity =
      this.distance =
        0;
    this.doubleUsed = false;
    this.rope = null;
    this.lastSpin = -100;
    this.discoGroup = -1;
    return true;
  }
  pause() {
    if (this.state.status === 'running' || this.state.status === 'countdown')
      this.state.status = 'paused';
  }
  resume() {
    if (this.state.status === 'paused') {
      this.state.status = 'countdown';
      this.state.countdown = S.resumeCountdown;
    }
  }
  menu() {
    this.state.status = 'menu';
    this.events = [];
  }
  combinationWindow() {
    return this.items.some(
      (i) =>
        i.kind === 'combo' &&
        !i.resolved &&
        i.when - this.state.time <= 0.9 &&
        i.when - this.state.time >= -0.15,
    );
  }
  action(action: Action) {
    const s = this.state;
    if (s.status !== 'running') return false;
    if (action === 'power') {
      if (s.level < 2 || s.energy < 100 || s.effects.bro > 0) return false;
      s.energy = 0;
      s.effects.bro = S.broDuration;
      s.counts.powers++;
      this.events.push({ type: 'power', text: 'BRO POWER!' });
      return true;
    }
    if (action === 'jump' && !this.rope) {
      if (s.discoRemaining > 0 || (this.spin > 0 && !this.combinationWindow()))
        return false;
      const grounded = this.height <= 0.01 && this.velocity <= 0;
      if (!grounded && (!s.charge || this.doubleUsed)) return false;
      if (!grounded) {
        s.charge = false;
        this.doubleUsed = true;
      }
      this.velocity = S.jumpVelocity;
      s.bro = 'epke';
      this.events.push({
        type: grounded ? 'jump' : 'doublejump',
        text: grounded ? '' : 'DUBBELJUMP!',
      });
      return true;
    }
    if (action === 'spin' && this.spinCooldown <= 0 && !this.rope) {
      if (
        (this.height > 0.01 || this.velocity > 0) &&
        !this.combinationWindow()
      )
        return false;
      this.spin = s.effects.boost > 0 ? S.boostedSpinDuration : S.spinDuration;
      this.spinCooldown =
        s.effects.boost > 0 ? S.boostedSpinCooldown : S.spinCooldown;
      this.lastSpin = s.time;
      s.bro = 'tieme';
      this.events.push({ type: 'spin' });
      return true;
    }
    return false;
  }
  offset(item: CourseItem) {
    return distanceAt(item.when, this.state.level) - this.distance;
  }
  step(delta: number) {
    if (!Number.isFinite(delta)) return;
    let remaining = Math.min(Math.max(delta, 0), 0.25);
    while (remaining > 0.000001) {
      const dt = Math.min(remaining, 1 / 120);
      this.update(dt);
      remaining -= dt;
    }
  }
  private points(base: number) {
    const s = this.state;
    const value =
      base * s.multiplier * (s.effects.double > 0 || s.effects.bro > 0 ? 2 : 1);
    s.score += value;
    return value;
  }
  private energy(amount: number) {
    const s = this.state;
    if (s.level >= 2 && s.effects.bro <= 0)
      s.energy = Math.min(100, s.energy + amount);
  }
  private pickup(power: PowerUp) {
    const s = this.state;
    if (power === 'charge') {
      if (s.charge) this.points(50);
      else s.charge = true;
    } else if (power === 'heart') {
      if (s.lives < S.lives) s.lives++;
      else this.points(100);
    } else
      s.effects[power] =
        power === 'boost' ? S.beatBoostDuration : S.effectDuration;
    this.events.push({
      type: 'powerup',
      text: POWERUPS[power].name.toUpperCase(),
      color: POWERUPS[power].color,
    });
  }
  private update(dt: number) {
    const s = this.state;
    if (s.status === 'countdown') {
      const before = Math.ceil(s.countdown);
      s.countdown = Math.max(0, s.countdown - dt);
      if (Math.ceil(s.countdown) !== before) this.events.push({ type: 'tick' });
      if (s.countdown <= 0) {
        s.status = 'running';
        this.events.push({
          type: 'stage',
          text: s.time < 1 ? 'LET’S GO, BRO’S!' : 'DAAR GAAN WE WEER!',
        });
      }
      return;
    }
    if (s.status !== 'running') return;
    s.time = Math.min(this.level.duration, s.time + dt);
    this.distance = distanceAt(s.time, s.level);
    for (const key of Object.keys(s.effects) as (keyof Effects)[])
      s.effects[key] = Math.max(0, s.effects[key] - dt);
    this.spin = Math.max(0, this.spin - dt);
    this.spinCooldown = Math.max(0, this.spinCooldown - dt);
    this.immunity = Math.max(0, this.immunity - dt);
    if (s.discoRemaining > 0) {
      s.discoRemaining = Math.max(0, s.discoRemaining - dt);
      if (s.discoRemaining === 0 && s.discoHits === 3) {
        s.discos++;
        this.points(S.discoPoints);
        this.energy(S.energy.rope);
        this.events.push({
          type: 'disco',
          text: 'DISCO KING! +' + S.discoPoints,
        });
      }
    }
    if (this.rope) {
      s.ropeRemaining = Math.max(0, s.ropeRemaining - dt);
      this.height =
        this.rope.height -
        96 +
        Math.sin((1 - s.ropeRemaining / S.ropeDuration) * Math.PI) * 45;
      this.velocity = 0;
      if (s.ropeRemaining <= 0) {
        this.rope = null;
        this.velocity = -150;
        s.counts.ropes++;
        this.energy(S.energy.rope);
        this.points(S.ropePoints);
        this.events.push({ type: 'rope', text: 'TOUWTOPPER!' });
      }
    } else if (this.height > 0 || this.velocity > 0) {
      this.height += this.velocity * dt - 0.5 * S.gravity * dt * dt;
      this.velocity -= S.gravity * dt;
      if (this.height <= 0) {
        this.height = this.velocity = 0;
        this.doubleUsed = false;
      }
    }
    for (const item of this.items) {
      if (item.resolved) continue;
      const dx = this.offset(item);
      if (dx > 270) continue;
      if (item.kind === 'star') {
        const radius = s.effects.magnet > 0 ? 240 : 38;
        if (
          Math.abs(dx) < radius &&
          (s.effects.magnet > 0 ||
            Math.abs(item.height - this.height - 48) < 72)
        ) {
          item.resolved = true;
          s.stars++;
          this.points(S.starPoints);
          this.events.push({ type: 'star', x: dx, height: item.height });
        } else if (dx < -48) item.resolved = true;
        continue;
      }
      if (item.kind === 'pickup') {
        if (
          Math.abs(dx) < 40 &&
          Math.abs(item.height - this.height - 48) < 70
        ) {
          item.resolved = true;
          if (item.power) this.pickup(item.power);
        } else if (dx < -48) item.resolved = true;
        continue;
      }
      if (item.kind === 'ring') {
        if (Math.abs(dx) < 45 && this.height > 65) {
          item.resolved = true;
          s.counts.rings++;
          this.energy(S.energy.ring);
          this.points(S.ringPoints);
          this.events.push({
            type: 'ring',
            height: item.height,
            text: 'RING +' + S.ringPoints,
          });
        } else if (dx < -48) item.resolved = true;
        continue;
      }
      if (item.kind === 'rope') {
        if (
          !this.rope &&
          this.doubleUsed &&
          Math.abs(dx) < 50 &&
          Math.abs(this.height + 96 - item.height) < 55
        ) {
          item.resolved = true;
          this.rope = item;
          s.ropeRemaining = S.ropeDuration;
          this.spin = 0;
          s.bro = 'epke';
          this.events.push({
            type: 'ring',
            text: 'VAST! SLINGER MEE',
            height: item.height,
          });
        } else if (dx < -55) item.resolved = true;
        continue;
      }
      if (item.kind === 'disco') {
        if (Math.abs(dx) < 42 && this.height < 12 && this.spin > 0) {
          if (item.part === 0 && s.effects.boost > 0) {
            this.discoGroup = item.group ?? -1;
            s.discoRemaining = S.discoDuration;
            s.discoHits = 0;
            s.bro = 'tieme';
            this.spin = S.boostedSpinDuration;
          }
          if (s.discoRemaining > 0 && this.discoGroup === item.group) {
            item.resolved = true;
            s.discoHits++;
            this.events.push({
              type: 'discohit',
              text: `${s.discoHits} / 3 · DISCO!`,
              x: dx,
            });
          }
        }
        if (dx < -48) item.resolved = true;
        continue;
      }
      if (!isHazard(item.kind)) continue;
      const touching = Math.abs(dx) < 42;
      const jump = this.height > (item.kind === 'highlog' ? 100 : 55),
        spin = this.spin > 0;
      const safe =
        item.kind === 'log' || item.kind === 'highlog'
          ? jump
          : item.kind === 'low'
            ? spin && this.height < 12
            : item.kind === 'combo'
              ? jump && spin
              : spin;
      if (touching) {
        if (s.effects.bro > 0) {
          this.clear(item, false);
          continue;
        }
        if (!safe) {
          this.hit(item);
          if (this.state.status === 'lost') return;
          continue;
        }
        if (['beat', 'duo', 'combo'].includes(item.kind))
          this.clear(
            item,
            s.level >= 2 && s.time - this.lastSpin <= S.perfectWindow,
          );
      } else if (dx < -45) this.clear(item, false);
    }
    if (s.time >= this.level.duration) this.finish(true);
  }
  private hit(item: CourseItem) {
    item.resolved = true;
    item.hit = true;
    const s = this.state;
    if (s.effects.shield > 0) {
      s.effects.shield = 0;
      this.events.push({ type: 'shield', text: 'SCHILD REDT JE!' });
      return;
    }
    if (this.immunity > 0) return;
    s.lives--;
    s.damage++;
    s.combo = 0;
    s.multiplier = 1;
    this.immunity = S.invulnerability;
    const tips: Record<string, string> = {
      log: 'Spring iets eerder over de boomstam.',
      highlog: 'Hoge stam? Spring iets eerder. Eén sprong is genoeg.',
      low: 'Lage balk? Spin op de grond, zonder te springen.',
      combo: 'Stam + beat? Spring én spin tegelijk.',
      beat: 'Beatblok? Tik op de paarse spinknop.',
      duo: 'Twee beats? Eén goed getimede spin breekt ze allebei.',
    };
    s.tip = tips[item.kind];
    this.events.push({
      type: 'hit',
      text:
        item.kind === 'low'
          ? 'SPIN ONDERDOOR'
          : item.kind === 'combo'
            ? 'SPRING + SPIN'
            : 'AU! NOG EEN KANS',
    });
    if (s.lives <= 0) this.finish(false);
  }
  private clear(item: CourseItem, perfect: boolean) {
    item.resolved = true;
    item.perfect = perfect;
    const s = this.state;
    s.combo++;
    s.maxCombo = Math.max(s.maxCombo, s.combo);
    s.multiplier = Math.min(4, 1 + Math.floor(s.combo / 3));
    this.points(S.obstaclePoints);
    this.energy(S.energy.obstacle);
    if (item.kind === 'low') s.counts.lows++;
    if (item.kind === 'combo') s.counts.combos++;
    if (perfect) {
      s.counts.perfects++;
      this.points(S.perfectPoints);
      this.energy(S.energy.perfect);
    }
    this.events.push({
      type: perfect ? 'perfect' : 'clear',
      text: perfect
        ? 'PERFECT!'
        : item.kind === 'low'
          ? 'NICE FREEZE!'
          : item.kind === 'combo'
            ? 'BRO COMBO!'
            : item.kind === 'beat' || item.kind === 'duo'
              ? 'NICE SPIN!'
              : 'CLEAN JUMP!',
    });
  }
  private finish(won: boolean) {
    const s = this.state;
    s.status = won ? 'won' : 'lost';
    if (won) s.score += S.finishBonus + s.lives * 250;
    s.medals = [
      won,
      s.counts[this.level.challenge] >= this.level.target,
      won && s.damage === 0,
    ];
    s.newBest = s.score > s.best;
    s.best = Math.max(s.best, s.score);
    this.events.push({ type: won ? 'win' : 'lose' });
  }
}
