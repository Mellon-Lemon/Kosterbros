import { SETTINGS as S } from './settings.ts';

export type Status = 'menu' | 'countdown' | 'running' | 'paused' | 'won' | 'lost';
export type Action = 'jump' | 'spin';
export type GameState = {
  status: Status; score: number; best: number; newBest: boolean; time: number; stage: number;
  lives: number; stars: number; combo: number; maxCombo: number; multiplier: number;
  bro: 'epke' | 'tieme'; countdown: number; tip: string; muted: boolean;
};
export const INITIAL_STATE: GameState = { status: 'menu', score: 0, best: 0, newBest: false, time: 0, stage: 0, lives: S.lives, stars: 0, combo: 0, maxCombo: 0, multiplier: 1, bro: 'epke', countdown: S.countdown, tip: '', muted: false };
export type CourseItem = { id: number; kind: 'log' | 'beat' | 'ring' | 'star'; when: number; height: number; resolved: boolean; hit: boolean };
export type GameEvent = { type: 'jump' | 'spin' | 'star' | 'ring' | 'clear' | 'hit' | 'shield' | 'stage' | 'win' | 'lose' | 'tick'; text?: string; x?: number; height?: number; color?: string };
export const distanceAt = (t: number) => S.startSpeed * t + .5 * (S.endSpeed - S.startSpeed) / S.duration * t * t;
export const speedAt = (t: number) => S.startSpeed + (S.endSpeed - S.startSpeed) * t / S.duration;

/** Same opening every run to teach the controls, then a deterministic mixed course. */
export function createCourse(): CourseItem[] {
  const items: CourseItem[] = []; let seed = S.seed; let id = 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const add = (kind: CourseItem['kind'], when: number, height = 0) => items.push({id: id++, kind, when, height, resolved: false, hit: false});
  let when = 5;
  for (let i = 0; when < S.duration - 3.5; i++) {
    const kind = i === 0 ? 'log' : i === 1 ? 'beat' : random() < (when < 30 ? .7 : when < 60 ? .3 : .5) ? 'log' : 'beat';
    add(kind, when);
    if (kind === 'log') { add('ring', when, 175); add('star', when - .26, 150); add('star', when + .22, 150); }
    else { add('star', when - .3, 42); add('star', when + .3, 42); }
    // Ground stars lead into each challenge without demanding a separate action.
    add('star', when - 1.05, 44); add('star', when - .8, 44);
    when += (i < 3 ? 3.0 : 2.25 - .3 * (when / S.duration)) + random() * .45;
  }
  return items.sort((a,b) => a.when - b.when);
}

export class RunnerModel {
  state: GameState = {...INITIAL_STATE};
  items: CourseItem[] = [];
  events: GameEvent[] = [];
  height = 0; velocity = 0; spin = 0; spinCooldown = 0; immunity = 0; shield = 0;
  distance = 0; pausedFrom: 'running' | 'countdown' = 'running';
  start() {
    const best = this.state.best; const muted = this.state.muted;
    this.state = {...INITIAL_STATE, status: 'countdown', best, muted};
    this.items = createCourse(); this.events = []; this.distance = 0;
    this.height = this.velocity = this.spin = this.spinCooldown = this.immunity = this.shield = 0;
  }
  pause() {
    if (this.state.status === 'running' || this.state.status === 'countdown') {
      this.pausedFrom = this.state.status; this.state.status = 'paused';
    }
  }
  resume() { if (this.state.status === 'paused') this.state.status = this.pausedFrom; }
  menu() { this.state.status = 'menu'; this.events = []; }
  action(action: Action) {
    if (this.state.status !== 'running') return false;
    if (action === 'jump' && this.height <= .01) {
      this.velocity = S.jumpVelocity; this.spin = 0; this.state.bro = 'epke';
      this.events.push({type: 'jump'}); return true;
    }
    if (action === 'spin' && this.spinCooldown <= 0) {
      this.spin = S.spinDuration; this.spinCooldown = S.spinCooldown; this.state.bro = 'tieme';
      this.events.push({type: 'spin'}); return true;
    }
    return false;
  }
  offset(item: CourseItem) { return distanceAt(item.when) - this.distance; }
  step(delta: number) {
    // Substeps keep collision and jump physics consistent on slow displays.
    let remaining = Math.min(Math.max(delta, 0), .25);
    while (remaining > .000001) { const dt = Math.min(remaining, 1/120); this.update(dt); remaining -= dt; }
  }
  private update(dt: number) {
    const s = this.state;
    if (s.status === 'countdown') {
      const before = Math.ceil(s.countdown);
      s.countdown = Math.max(0, s.countdown - dt);
      if (Math.ceil(s.countdown) !== before) this.events.push({type:'tick'});
      if (s.countdown <= 0) { s.status = 'running'; this.events.push({type: 'stage', text: 'LET’S GO, BRO’S!'}); }
      return;
    }
    if (s.status !== 'running') return;
    s.time = Math.min(S.duration, s.time + dt); this.distance = distanceAt(s.time);
    const newStage = Math.min(2, Math.floor(s.time / (S.duration / 3)));
    if (newStage !== s.stage) { s.stage = newStage; this.events.push({type:'stage', text:S.stages[newStage].subtitle}); }
    if (this.height > 0 || this.velocity > 0) {
      this.height += this.velocity * dt - .5 * S.gravity * dt * dt;
      this.velocity -= S.gravity * dt;
      if (this.height <= 0) { this.height = 0; this.velocity = 0; }
    }
    this.spin = Math.max(0, this.spin - dt); this.spinCooldown = Math.max(0, this.spinCooldown - dt);
    this.immunity = Math.max(0, this.immunity - dt); this.shield = Math.max(0, this.shield - dt);
    for (const item of this.items) {
      if (item.resolved) continue;
      const dx = this.offset(item);
      if (dx > 140 || dx < -140) continue;
      if (item.kind === 'star') {
        if (Math.abs(dx) < 36 && Math.abs(item.height - (this.height + 48)) < 72) {
          item.resolved = true; s.stars++; s.score += S.starPoints * s.multiplier;
          this.events.push({type:'star', x:dx, height:item.height});
        } else if (dx < -40) item.resolved = true;
        continue;
      }
      if (item.kind === 'ring') {
        if (Math.abs(dx) < 45 && this.height > 65 && s.bro === 'epke') {
          item.resolved = true; s.score += S.ringPoints * s.multiplier;
          this.events.push({type:'ring', x:dx, height:item.height, text:`TOUWGRIP +${S.ringPoints * s.multiplier}`});
        } else if (dx < -48) item.resolved = true;
        continue;
      }
      // Beat barriers always need a spin. Logs always need a jump.
      const touching = Math.abs(dx) < (item.kind === 'log' ? 42 : 46);
      const safe = item.kind === 'log' ? this.height > 55 : this.spin > 0;
      if (touching && item.kind === 'beat' && safe) this.clear(item);
      else if (touching && !safe) {
        item.resolved = true; item.hit = true;
        if (this.shield > 0) { this.shield = 0; this.events.push({type:'shield', text:'SCHILD REDT JE!'}); }
        else if (this.immunity <= 0) {
          s.lives--; s.combo = 0; s.multiplier = 1; this.immunity = S.invulnerability;
          s.tip = item.kind === 'log' ? 'Boomstam? Tik iets eerder op de groene springknop.' : 'Paars beatblok? Tik op de paarse spinknop om erdoorheen te breken.';
          this.events.push({type:'hit', text:item.kind === 'log' ? 'BOOMSTAM → TIK GROEN' : 'BEATBLOK → TIK PAARS'});
          if (s.lives <= 0) { s.status = 'lost'; this.finish(false); return; }
        }
      } else if (dx < -48) this.clear(item);
    }
    if (s.time >= S.duration) { s.status = 'won'; this.finish(true); }
  }
  private clear(item: CourseItem) {
    item.resolved = true; const s = this.state;
    s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo);
    s.multiplier = Math.min(4, 1 + Math.floor(s.combo / 3)); s.score += S.obstaclePoints * s.multiplier;
    this.events.push({type:'clear', x:this.offset(item), text:item.kind === 'beat' ? 'NICE SPIN!' : 'CLEAN JUMP!'});
    if (s.combo % 6 === 0) { this.shield = S.shieldDuration; this.events.push({type:'shield', text:'BRO POWER! · SCHILD'}); }
  }
  private finish(won: boolean) {
    if (won) this.state.score += S.finishBonus + this.state.lives * 250;
    this.state.newBest = this.state.score > this.state.best;
    this.state.best = Math.max(this.state.best, this.state.score);
    this.events.push({type:won ? 'win' : 'lose'});
  }
}
