import { isHazard, type Action, type RunnerModel } from '../game/core.ts';
/** Timed normal input: no state/physics/score overrides. Shared by model and browser QA. */
export function drive(
  m: RunnerModel,
  act: (action: Action) => unknown,
  bonuses = true,
) {
  if (m.state.status !== 'running') return;
  if (bonuses && m.state.energy >= 100) act('power');
  const disco = m.items.find(
    (i) => !i.resolved && i.kind === 'disco' && i.part === 0,
  );
  if (
    bonuses &&
    disco &&
    disco.when - m.state.time < 0.23 &&
    disco.when > m.state.time &&
    m.spinCooldown <= 0
  )
    act('spin');
  const rope = m.items.find(
    (i) => !i.resolved && i.kind === 'rope' && i.when > m.state.time,
  );
  if (bonuses && rope && !m.rope) {
    const t = rope.when - m.state.time;
    if (t < 0.68 && t > 0.4 && m.height === 0 && m.state.charge) act('jump');
    if (t < 0.4 && t > 0.2 && m.height > 0 && !m.doubleUsed && m.state.charge)
      act('jump');
  }
  const next = m.items.find((i) => !i.resolved && isHazard(i.kind));
  if (!next) return;
  const t = next.when - m.state.time;
  if (
    ['log', 'highlog', 'combo'].includes(next.kind) &&
    t <= 0.4 &&
    t > 0.15 &&
    m.height === 0
  )
    act('jump');
  if (
    ['beat', 'duo', 'combo', 'low'].includes(next.kind) &&
    t <= 0.23 &&
    t > 0.1 &&
    m.spinCooldown <= 0
  )
    act('spin');
}
