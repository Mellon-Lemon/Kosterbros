import { LEVELS } from './levels.ts';
import type { PowerUp } from './settings.ts';
export type Hazard = 'log' | 'highlog' | 'beat' | 'duo' | 'low' | 'combo';
export type ItemKind = Hazard | 'ring' | 'rope' | 'disco' | 'star' | 'pickup';
export type CourseItem = {
  id: number;
  kind: ItemKind;
  when: number;
  height: number;
  resolved: boolean;
  hit: boolean;
  power?: PowerUp;
  perfect?: boolean;
  group?: number;
  part?: number;
};
export type Segment = {
  variant: number;
  start: number;
  duration: number;
  rope: boolean;
  disco: boolean;
};
export const isHazard = (kind: ItemKind): kind is Hazard =>
  ['log', 'highlog', 'beat', 'duo', 'low', 'combo'].includes(kind);
export const distanceAt = (t: number, levelId = 0) => {
  const l = LEVELS[levelId];
  return (
    l.startSpeed * t +
    ((0.5 * (l.endSpeed - l.startSpeed)) / l.duration) * t * t
  );
};
export const speedAt = (t: number, levelId = 0) => {
  const l = LEVELS[levelId];
  return l.startSpeed + ((l.endSpeed - l.startSpeed) * t) / l.duration;
};
/** Authored rhythms, shuffled as whole segments. All landings are clear. */
export function buildCourse(
  levelId: number,
  seed: number,
): { items: CourseItem[]; segments: Segment[] } {
  const l = LEVELS[levelId],
    items: CourseItem[] = [],
    segments: Segment[] = [];
  let id = 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const add = (kind: ItemKind, when: number, height = 0, power?: PowerUp) =>
    items.push({
      id: id++,
      kind,
      when,
      height,
      power,
      resolved: false,
      hit: false,
    });
  const hazard = (kind: Hazard, when: number) => {
    add(kind, when);
    if (kind === 'log' || kind === 'highlog' || kind === 'combo') {
      add('ring', when, 175);
      add('star', when - 0.2, 170);
      add('star', when + 0.2, 170);
    } else {
      add('star', when - 0.3, 44);
      add('star', when + 0.3, 44);
    }
    add('star', when - 1.05, 44);
    add('star', when - 0.8, 44);
  };
  const count = Math.floor((l.duration - 6) / 10),
    length = (l.duration - 6) / count;
  const patterns: Hazard[][][] = [
    [
      ['log', 'beat', 'log'],
      ['log', 'log', 'beat'],
      ['beat', 'log', 'log'],
      ['log', 'beat', 'beat'],
      ['beat', 'log', 'beat'],
      ['beat', 'beat', 'log'],
    ],
    [
      ['highlog', 'beat'],
      ['beat', 'highlog'],
      ['log', 'highlog'],
      ['highlog', 'log'],
      ['beat', 'log'],
      ['log', 'beat'],
    ],
    [
      ['duo', 'log', 'beat'],
      ['beat', 'duo', 'highlog'],
      ['log', 'beat', 'duo'],
      ['duo', 'highlog', 'duo'],
      ['beat', 'duo'],
      ['duo', 'beat'],
    ],
    [
      ['low', 'log', 'duo'],
      ['low', 'beat', 'highlog'],
      ['log', 'low', 'beat'],
      ['duo', 'low', 'log'],
      ['low', 'duo'],
      ['low', 'highlog'],
    ],
    [
      ['combo', 'low', 'duo'],
      ['combo', 'highlog', 'beat'],
      ['low', 'combo', 'log'],
      ['duo', 'log', 'combo'],
      ['combo', 'duo'],
      ['combo', 'low'],
    ],
    [
      ['combo', 'duo', 'low', 'log'],
      ['log', 'low', 'duo', 'combo'],
      ['duo', 'highlog', 'combo', 'low'],
      ['low', 'combo', 'log', 'duo'],
      ['combo', 'duo'],
      ['low', 'combo'],
    ],
  ];
  let previous = -1;
  for (let slot = 0; slot < count; slot++) {
    let variant = slot === 0 ? 0 : Math.floor(random() * 5);
    if (slot > 0 && variant >= previous) variant++;
    if (levelId === 5 && slot % 3 !== 2 && variant >= 4) variant %= 4;
    if (levelId >= 2 && slot === 1) variant = 5;
    if (levelId >= 2 && slot === 2) variant = 4;
    if (segments.at(-1)?.variant === variant) variant = (variant + 1) % 4;
    previous = variant;
    const start = 3 + slot * length,
      rope = levelId === 1 || (levelId >= 2 && variant === 4),
      disco = levelId >= 2 && variant === 5;
    segments.push({ variant, start, duration: length, rope, disco });
    if (rope) {
      add('pickup', start + 0.55, 44, 'charge');
      add('rope', start + 2.5, 400);
      for (let s = 0; s < 4; s++)
        add('star', start + 2.45 + s * 0.18, 330 + Math.sin(s) * 30);
      add(
        'pickup',
        start + 4.7,
        44,
        levelId === 1 ? 'shield' : l.pickups[slot % l.pickups.length],
      );
    } else if (disco) {
      add('pickup', start + 0.55, 44, 'boost');
      for (let part = 0; part < 3; part++)
        items.push({
          id: id++,
          kind: 'disco',
          when: start + 2.5 + part * 0.26,
          height: 0,
          resolved: false,
          hit: false,
          group: slot,
          part,
        });
      for (let s = 0; s < 4; s++) add('star', start + 2.45 + s * 0.18, 44);
    } else add('pickup', start + 0.55, 44, l.pickups[slot % l.pickups.length]);
    const sequence = patterns[levelId][variant],
      times =
        rope || disco
          ? [6, 8.5]
          : sequence.length === 4
            ? [1.8, 4, 6.2, 8.4]
            : [2, 4.8, 7.6];
    sequence.forEach((kind, index) => hazard(kind, start + times[index]));
    if (levelId === 5 && (rope || disco)) hazard('log', start + 10);
  }
  return { items: items.sort((a, b) => a.when - b.when), segments };
}
