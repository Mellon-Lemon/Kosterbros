import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunnerModel, type CourseItem, type Action } from '../game/core.ts';
import { LEVELS } from '../game/levels.ts';
import { buildCourse, isHazard, distanceAt } from '../game/course.ts';
import { SETTINGS as S, type PowerUp } from '../game/settings.ts';
import {
  freshProgress,
  parseProgress,
  recordRun,
  loadProgress,
  saveProgress,
} from '../game/progress.ts';
import { drive } from './driver.ts';
const advance = (m: RunnerModel, seconds: number) => {
  for (let t = 0; t < seconds - 1e-7; t += 0.01)
    m.step(Math.min(0.01, seconds - t));
};
function running(level = 0) {
  const m = new RunnerModel();
  m.start(level);
  advance(m, 3.02);
  assert.equal(m.state.status, 'running');
  m.items = [];
  m.events = [];
  return m;
}
function item(
  m: RunnerModel,
  kind: CourseItem['kind'],
  delay = 0,
  power?: PowerUp,
  height = 0,
) {
  const i: CourseItem = {
    id: m.items.length,
    kind,
    when: m.state.time + delay,
    height,
    resolved: false,
    hit: false,
    power,
  };
  m.items.push(i);
  return i;
}
function pickup(m: RunnerModel, power: PowerUp) {
  item(m, 'pickup', 0, power, 44);
  m.step(0.01);
}
function run(level: number, seed: number, fps: number, bonuses = true) {
  const m = new RunnerModel();
  m.start(level, 'solo', seed);
  advance(m, 3.02);
  if (!bonuses) m.items = m.items.filter((i) => i.kind !== 'pickup');
  for (
    let i = 0;
    i < (LEVELS[level].duration + 1) * fps && m.state.status === 'running';
    i++
  ) {
    drive(m, (a) => m.action(a), bonuses);
    m.step(1 / fps);
    m.events = [];
  }
  assert.equal(
    m.state.status,
    'won',
    `level ${level + 1}, seed ${seed}, ${fps}fps: ${m.state.tip}`,
  );
  assert.equal(
    m.state.damage,
    0,
    `damage at level ${level + 1}, seed ${seed}, ${fps}fps`,
  );
  return m;
}
void test('No input loses, with useful feedback', () => {
  const m = new RunnerModel();
  m.start();
  advance(m, 60);
  assert.equal(m.state.status, 'lost');
  assert.equal(m.state.lives, 0);
  assert.ok(m.state.tip);
});
void test('Double jump requires a charge and a fresh action; one per flight', () => {
  const m = running(1);
  assert.equal(m.action('jump'), true);
  assert.equal(m.action('jump'), false);
  advance(m, 0.25);
  m.state.charge = true;
  assert.equal(m.action('jump'), true);
  assert.equal(m.state.charge, false);
  m.state.charge = true;
  assert.equal(m.action('jump'), false);
  advance(m, 1.4);
  assert.equal(m.doubleUsed, false);
  assert.equal(m.state.charge, true);
  assert.equal(m.action('jump'), true);
  advance(m, 0.2);
  assert.equal(m.action('jump'), true);
  advance(m, 1.4);
  assert.equal(m.state.charge, false);
});
void test('Duplicate charge rewards points without accumulating charges', () => {
  const m = running(1);
  pickup(m, 'charge');
  pickup(m, 'charge');
  assert.equal(m.state.charge, true);
  assert.equal(m.state.score, 50);
});
void test('Jump and spin work in both input orders without cancelling', () => {
  for (const actions of [
    ['jump', 'spin'],
    ['spin', 'jump'],
  ] as Action[][]) {
    const m = running(4);
    item(m, 'combo', 0.3);
    for (const action of actions) assert.equal(m.action(action), true);
    assert.ok(m.velocity > 0);
    assert.ok(m.spin > 0);
    advance(m, 0.6);
    assert.equal(m.state.damage, 0);
  }
});
void test('High rope is unreachable by ordinary jump; double jump grabs and releases', () => {
  for (const charged of [false, true]) {
    const m = running(1);
    item(m, 'rope', 0.68, undefined, 400);
    m.state.charge = charged;
    m.action('jump');
    advance(m, 0.28);
    if (charged) m.action('jump');
    advance(m, 0.4);
    assert.equal(Boolean(m.rope), charged);
    if (charged) {
      assert.equal(m.action('jump'), false);
      advance(m, 1.6);
      assert.equal(m.state.counts.ropes, 1);
      assert.equal(m.height, 0);
      assert.equal(m.rope, null);
      assert.equal(m.state.score, S.ropePoints);
    }
  }
});
void test('Every obstacle accepts its move and punishes the wrong move', () => {
  for (const kind of [
    'log',
    'highlog',
    'beat',
    'duo',
    'low',
    'combo',
  ] as const) {
    const m = running(4);
    item(m, kind, 0.4);
    if (['log', 'highlog', 'combo'].includes(kind)) m.action('jump');
    if (['beat', 'duo', 'low', 'combo'].includes(kind)) m.action('spin');
    advance(m, 0.8);
    assert.equal(m.state.damage, 0, kind);
    assert.equal(m.state.combo, 1, kind);
    const bad = running(4);
    item(bad, kind, 0.4);
    if (kind === 'beat' || kind === 'duo' || kind === 'low') bad.action('jump');
    else bad.action('spin');
    advance(bad, 0.8);
    assert.equal(bad.state.damage, 1, kind);
  }
});
void test('Perfect spins award additional energy and score in a 0.2-second window', () => {
  for (const early of [false, true]) {
    const m = running(2);
    item(m, 'beat', early ? 0.4 : 0.2);
    m.action('spin');
    advance(m, 0.6);
    assert.equal(m.state.counts.perfects, early ? 0 : 1);
    assert.equal(m.state.energy, early ? 8 : 12);
    assert.equal(m.state.score, early ? 100 : 150);
  }
});
void test('Pause and resume countdown freeze physics and timed effects', () => {
  const m = running(3);
  m.state.effects.double = 5;
  m.state.charge = true;
  m.action('jump');
  advance(m, 0.1);
  m.pause();
  const time = m.state.time,
    height = m.height,
    effect = m.state.effects.double;
  advance(m, 10);
  assert.equal(m.state.time, time);
  m.resume();
  advance(m, 1.8);
  assert.equal(m.height, height);
  assert.equal(m.state.effects.double, effect);
  assert.equal(m.action('jump'), false);
  advance(m, 0.3);
  assert.ok(m.state.time > time);
});
void test('Timed pickups refresh instead of stack; different effects coexist', () => {
  const m = running(4);
  for (const power of ['shield', 'magnet', 'double', 'boost'] as const)
    pickup(m, power);
  advance(m, 2);
  pickup(m, 'double');
  assert.ok(m.state.effects.double > 7.99 && m.state.effects.double <= 8);
  assert.ok(m.state.effects.magnet > 0);
  assert.ok(m.state.effects.boost > 0);
  advance(m, 8.1);
  assert.deepEqual(m.state.effects, {
    shield: 0,
    magnet: 0,
    double: 0,
    boost: 0,
    bro: 0,
  });
});
void test('Shield absorbs one hit and full heart yields points', () => {
  const m = running(4);
  pickup(m, 'shield');
  item(m, 'beat');
  m.step(0.01);
  assert.equal(m.shield, 0);
  assert.equal(m.state.damage, 0);
  item(m, 'beat');
  m.step(0.01);
  assert.equal(m.state.lives, 2);
  pickup(m, 'heart');
  assert.equal(m.state.lives, 3);
  pickup(m, 'heart');
  assert.equal(m.state.score, 100);
  assert.equal(m.state.damage, 1);
});
void test('Magnet collects only stars, with finite range', () => {
  const m = running(4);
  pickup(m, 'magnet');
  item(m, 'star', 0.3, undefined, 350);
  item(m, 'pickup', 0.3, 'charge', 350);
  item(m, 'ring', 0.3, undefined, 175);
  item(m, 'star', 2, undefined, 350);
  advance(m, 0.5);
  assert.equal(m.state.stars, 1);
  assert.equal(m.state.charge, false);
  assert.equal(m.state.counts.rings, 0);
});
void test('Beat Boost controls duration and cooldown, and expires', () => {
  const m = running(2);
  pickup(m, 'boost');
  m.action('spin');
  assert.equal(m.spin, 1.2);
  assert.equal(m.spinCooldown, 0.65);
  assert.equal(m.action('spin'), false);
  advance(m, 0.66);
  assert.equal(m.action('spin'), true);
  advance(m, 6);
  m.action('spin');
  assert.equal(m.spin, 0.85);
  assert.equal(m.spinCooldown, 0.95);
});
void test('BRO POWER requires full meter, preserves shield, doubles once and earns no energy', () => {
  const m = running(2);
  assert.equal(m.action('power'), false);
  m.state.energy = 100;
  pickup(m, 'shield');
  pickup(m, 'double');
  assert.equal(m.action('power'), true);
  assert.equal(m.action('power'), false);
  item(m, 'beat');
  m.step(0.01);
  assert.equal(m.state.energy, 0);
  assert.equal(m.state.score, 200);
  assert.ok(m.shield > 0);
  assert.equal(m.state.damage, 0);
  assert.equal(m.state.counts.powers, 1);
  advance(m, 5.1);
  item(m, 'beat', 0.2);
  m.action('spin');
  advance(m, 0.4);
  assert.equal(m.state.energy, 12);
  const early = running(1);
  early.state.energy = 100;
  assert.equal(early.action('power'), false);
});
void test('Energy survives damage; combo no longer grants an automatic shield', () => {
  const m = running(2);
  m.state.energy = 40;
  item(m, 'beat');
  m.step(0.01);
  assert.equal(m.state.energy, 40);
  advance(m, 2);
  for (let i = 0; i < 6; i++) {
    item(m, 'beat', 0.2);
    m.action('spin');
    advance(m, 1.1);
  }
  assert.equal(m.shield, 0);
});
void test('Finish bonus is not doubled and no-damage medal tracks damage, not hearts', () => {
  const m = running(4);
  m.state.time = m.level.duration - 0.01;
  m.distance = distanceAt(m.state.time, 4);
  m.state.damage = 1;
  m.state.effects.double = 4;
  m.step(0.02);
  assert.equal(m.state.score, 1750);
  assert.deepEqual(m.state.medals, [true, false, false]);
});
void test('Replay resets transient state but retains settings; invalid levels rejected', () => {
  const m = running(4);
  m.state.muted = true;
  m.state.charge = true;
  m.state.energy = 100;
  pickup(m, 'boost');
  m.start(2, 'coop', 42, 1234);
  assert.equal(m.state.best, 1234);
  assert.equal(m.state.muted, true);
  assert.equal(m.state.mode, 'coop');
  assert.equal(m.state.charge, false);
  assert.equal(m.state.energy, 0);
  assert.equal(m.state.effects.boost, 0);
  assert.equal(m.start(99), false);
});
void test('Progress, records and medals are separate by mode; legacy remains separate', () => {
  let p = parseProgress(null, '9876');
  p = recordRun(p, 0, 'solo', 1200, [true, true, true]);
  assert.equal(p.modes.solo.unlocked, 1);
  assert.equal(p.modes.coop.unlocked, 0);
  assert.deepEqual(p.modes.coop.medals[0], [false, false, false]);
  p = recordRun(p, 0, 'coop', 2500, [false, false, false]);
  assert.equal(p.modes.solo.records[0], 1200);
  assert.equal(p.modes.coop.records[0], 2500);
  assert.deepEqual(p.modes.solo.medals[0], [true, true, true]);
  assert.equal(p.classicBest, 9876);
  assert.deepEqual(parseProgress(JSON.stringify(p)), p);
});
void test('Corrupt, blocked and malformed storage never breaks play', () => {
  assert.deepEqual(parseProgress('{bad'), freshProgress());
  const broken = {
    getItem() {
      throw Error('denied');
    },
    setItem() {
      throw Error('denied');
    },
  };
  assert.deepEqual(loadProgress(broken), freshProgress());
  assert.equal(saveProgress(broken, freshProgress()), false);
  const p = parseProgress(
    JSON.stringify({
      version: 2,
      unlocked: 100,
      records: { solo: [-4, 'bad', null] },
      medals: [[1, true, 'yes']],
    }),
  );
  assert.equal(p.modes.solo.unlocked, 5);
  assert.deepEqual(p.modes.solo.medals[0], [false, true, false]);
  assert.deepEqual(p.modes.solo.records, [0, 0, 0, 0, 0, 0]);
});
for (const fps of [30, 60, 120])
  for (const l of LEVELS)
    void test(`Level ${l.id + 1} complete, all medals at ${fps} FPS`, () => {
      const m = run(l.id, 12010, fps);
      assert.deepEqual(m.state.medals, [true, true, true]);
    });
for (const l of LEVELS)
  void test(`Level ${l.id + 1}: 100 seeds, authored transitions and achievable challenge`, () => {
    const variants = new Set<number>();
    for (let seed = 0; seed < 100; seed++) {
      const { items, segments } = buildCourse(l.id, seed);
      assert.deepEqual(buildCourse(l.id, seed).items, items);
      for (const [i, s] of segments.entries()) {
        variants.add(s.variant);
        assert.ok(s.duration >= 8 && s.duration <= 12);
        if (i) assert.notEqual(s.variant, segments[i - 1].variant);
      }
      assert.equal(segments[0].variant, 0);
      const hazards = items.filter((i) => isHazard(i.kind));
      for (let i = 1; i < hazards.length; i++)
        assert.ok(hazards[i].when - hazards[i - 1].when >= 1.4);
      assert.ok(hazards.at(-1)!.when <= l.duration - 3);
      for (const rope of items.filter((i) => i.kind === 'rope')) {
        assert.ok(
          items.some(
            (i) =>
              i.power === 'charge' &&
              rope.when - i.when >= 1.5 &&
              rope.when - i.when < 2.5,
          ),
        );
        assert.ok(
          !hazards.some(
            (i) => i.when > rope.when - 1.2 && i.when < rope.when + 2,
          ),
        );
      }
      const m = run(l.id, seed, 60);
      assert.ok(
        m.state.medals[1],
        `challenge at seed ${seed}: ${JSON.stringify(m.state.counts)}`,
      );
    }
    assert.equal(variants.size, 6);
  });
for (const l of LEVELS)
  void test(`Level ${l.id + 1}: main route without any pickups or BRO POWER`, () => {
    for (const seed of [7, 31, 93]) run(l.id, seed, 30, false);
  });

void test('Two fingers hold independent actions; releasing one preserves the other', async () => {
  const { TouchInput } = await import('../game/input.ts');
  const input = new TouchInput();
  assert.equal(input.press(10, 'jump'), true);
  assert.equal(input.press(20, 'spin'), true);
  assert.deepEqual(input.held, ['jump', 'spin']);
  input.release(10);
  assert.deepEqual(input.held, ['spin']);
  assert.equal(input.press(30, 'jump'), true);
  input.release(20);
  assert.deepEqual(input.held, ['jump']);
  input.clear();
  assert.deepEqual(input.held, []);
  assert.equal(input.press(30, 'jump'), true);
});
void test('Repeated events or two fingers on one button never repeat its action', async () => {
  const { TouchInput } = await import('../game/input.ts');
  const input = new TouchInput();
  assert.equal(input.press(10, 'jump'), true);
  assert.equal(input.press(10, 'jump'), false);
  assert.equal(input.press(11, 'jump'), false);
  input.release(10);
  assert.deepEqual(input.held, ['jump']);
  input.release(11);
  assert.equal(input.press(12, 'jump'), true);
});

void test('Outside combination obstacles only one move can be active', () => {
  for (const actions of [
    ['jump', 'spin'],
    ['spin', 'jump'],
  ] as Action[][]) {
    const m = running(4);
    assert.equal(m.action(actions[0]), true);
    assert.equal(m.action(actions[1]), false);
    advance(m, 0.15);
    assert.equal(m.action(actions[1]), false);
  }
  const far = running(4);
  item(far, 'combo', 3);
  far.action('jump');
  assert.equal(far.action('spin'), false);
});
void test('The last accepted character stays active after their move ends', () => {
  const m = running();
  m.action('spin');
  advance(m, 2);
  assert.equal(m.state.bro, 'tieme');
  m.action('jump');
  advance(m, 2);
  assert.equal(m.state.bro, 'epke');
});
void test('Tieme breaks three bonus boxes for the same base score as the rope', () => {
  const m = running(2);
  pickup(m, 'boost');
  for (let part = 0; part < 3; part++)
    m.items.push({
      ...item(m, 'disco', 0.2 + part * 0.26),
      id: 100 + part,
      group: 10,
      part,
    });
  m.items = m.items.filter((i) => i.group === 10);
  m.action('spin');
  advance(m, 1.5);
  assert.equal(m.state.discos, 1);
  assert.equal(m.state.discoHits, 3);
  assert.equal(m.state.score, S.ropePoints);
  assert.equal(S.discoPoints, S.ropePoints);
  assert.equal(m.state.bro, 'tieme');
  assert.equal(m.state.damage, 0);
});
void test('Missing disco bonus is harmless; three boxes require Beat Boost', () => {
  const m = running(2);
  for (let part = 0; part < 3; part++) {
    const box = item(m, 'disco', 0.2 + part * 0.26);
    box.group = 1;
    box.part = part;
  }
  m.action('spin');
  advance(m, 2);
  assert.equal(m.state.discos, 0);
  assert.equal(m.state.score, 0);
  assert.equal(m.state.damage, 0);
});
void test('A v2 shared save migrates without losing past achievements', () => {
  const p = parseProgress(
    JSON.stringify({
      version: 2,
      unlocked: 3,
      medals: [[true, true, false]],
      records: { solo: [100], coop: [200] },
    }),
  );
  assert.equal(p.modes.solo.unlocked, 3);
  assert.equal(p.modes.coop.unlocked, 3);
  assert.equal(p.modes.coop.records[0], 200);
  const next = recordRun(p, 3, 'coop', 500, [true, true, true]);
  assert.equal(next.modes.coop.unlocked, 4);
  assert.equal(next.modes.solo.unlocked, 3);
  assert.deepEqual(next.modes.solo.medals[3], [false, false, false]);
});
