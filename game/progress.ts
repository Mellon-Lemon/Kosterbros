import { LEVELS } from './levels.ts';
export type Mode = 'solo' | 'coop';
export type Medals = [boolean, boolean, boolean];
export type ModeProgress = {
  unlocked: number;
  medals: Medals[];
  records: number[];
};
export type Progress = {
  version: 3;
  classicBest: number;
  modes: Record<Mode, ModeProgress>;
};
export const PROGRESS_KEY = 'kosterbros.progress.v3';
const freshMode = (): ModeProgress => ({
  unlocked: 0,
  medals: LEVELS.map(() => [false, false, false]),
  records: LEVELS.map(() => 0),
});
export const freshProgress = (): Progress => ({
  version: 3,
  classicBest: 0,
  modes: { solo: freshMode(), coop: freshMode() },
});
const score = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.min(1e9, Math.max(0, Math.floor(v)))
    : 0;
export function parseProgress(
  raw: string | null,
  classic: string | null = null,
): Progress {
  const p = freshProgress();
  p.classicBest = score(Number(classic));
  try {
    const v = JSON.parse(raw || 'null');
    if (!v || ![2, 3].includes(v.version)) return p;
    p.classicBest = Math.max(p.classicBest, score(v.classicBest));
    for (const mode of ['solo', 'coop'] as const) {
      // Existing shared v2 achievements are retained in both modes; new progress is independent.
      const source =
        v.version === 2
          ? {
              unlocked: v.unlocked,
              medals: v.medals,
              records: v.records?.[mode],
            }
          : v.modes?.[mode];
      p.modes[mode] = {
        unlocked: Math.min(5, score(source?.unlocked)),
        medals: LEVELS.map(
          (_, i) =>
            [0, 1, 2].map((j) => source?.medals?.[i]?.[j] === true) as Medals,
        ),
        records: LEVELS.map((_, i) => score(source?.records?.[i])),
      };
    }
  } catch {
    /* A damaged save never blocks play. */
  }
  return p;
}
export function recordRun(
  p: Progress,
  level: number,
  mode: Mode,
  scoreValue: number,
  medals: Medals,
): Progress {
  const next = parseProgress(JSON.stringify(p)),
    target = next.modes[mode];
  target.records[level] = Math.max(target.records[level], scoreValue);
  target.medals[level] = target.medals[level].map(
    (v, i) => v || medals[i],
  ) as Medals;
  if (medals[0])
    target.unlocked = Math.max(target.unlocked, Math.min(5, level + 1));
  return next;
}
export function loadProgress(storage: Pick<Storage, 'getItem'>): Progress {
  try {
    return parseProgress(
      storage.getItem(PROGRESS_KEY) ||
        storage.getItem('kosterbros.progress.v2'),
      storage.getItem('kosterbros.record.v1'),
    );
  } catch {
    return freshProgress();
  }
}
export function saveProgress(
  storage: Pick<Storage, 'setItem'>,
  p: Progress,
): boolean {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
