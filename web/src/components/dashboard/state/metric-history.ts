import type { RawHistorySample } from "../types";

export type HistoryMap = Record<string, Record<string, RawHistorySample[]>>;

const defaultRetentionNs = 3_600_000_000_000n; // 1 hour
export const defaultHistoryLimits = {
  perSeriesMaxPoints: 5_000,
  totalMaxPoints: 60_000,
} as const;

const minPerSeriesMaxPoints = 100;
const maxPerSeriesMaxPoints = 200_000;
const minTotalMaxPoints = 1_000;
const maxTotalMaxPoints = 2_000_000;

export type HistoryLimitSettings = {
  perSeriesMaxPoints: number;
  totalMaxPoints: number;
};

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function normalizeHistoryLimitSettings(input: Partial<HistoryLimitSettings> | null | undefined): HistoryLimitSettings {
  const perSeriesMaxPoints = clampInt(
    Number(input?.perSeriesMaxPoints ?? defaultHistoryLimits.perSeriesMaxPoints),
    minPerSeriesMaxPoints,
    maxPerSeriesMaxPoints,
  );
  const totalRaw = clampInt(
    Number(input?.totalMaxPoints ?? defaultHistoryLimits.totalMaxPoints),
    minTotalMaxPoints,
    maxTotalMaxPoints,
  );
  const totalMaxPoints = Math.max(totalRaw, perSeriesMaxPoints);
  return { perSeriesMaxPoints, totalMaxPoints };
}

function trimTotalHistoryPoints(history: HistoryMap, totalMaxPoints: number): HistoryMap {
  if (totalMaxPoints <= 0) return {};

  const all: Array<{ nodeId: string; category: string; index: number; atNs: bigint }> = [];
  for (const [nodeId, nodeHistory] of Object.entries(history)) {
    for (const [category, list] of Object.entries(nodeHistory)) {
      for (let i = 0; i < list.length; i += 1) {
        all.push({ nodeId, category, index: i, atNs: list[i].atNs });
      }
    }
  }
  if (all.length <= totalMaxPoints) return history;

  all.sort((a, b) => (a.atNs === b.atNs ? 0 : a.atNs < b.atNs ? -1 : 1));
  const pruneCount = all.length - totalMaxPoints;
  const dropIndexBySeries = new Map<string, Set<number>>();
  for (let i = 0; i < pruneCount; i += 1) {
    const item = all[i];
    const key = `${item.nodeId}\u0000${item.category}`;
    const set = dropIndexBySeries.get(key) ?? new Set<number>();
    set.add(item.index);
    dropIndexBySeries.set(key, set);
  }

  const next: HistoryMap = {};
  for (const [nodeId, nodeHistory] of Object.entries(history)) {
    const nextNodeHistory: Record<string, RawHistorySample[]> = {};
    for (const [category, list] of Object.entries(nodeHistory)) {
      const key = `${nodeId}\u0000${category}`;
      const drops = dropIndexBySeries.get(key);
      if (!drops || drops.size === 0) {
        nextNodeHistory[category] = list;
        continue;
      }
      nextNodeHistory[category] = list.filter((_, idx) => !drops.has(idx));
    }
    next[nodeId] = nextNodeHistory;
  }

  return next;
}

export function applyHistoryLimits(history: HistoryMap, limitsInput: Partial<HistoryLimitSettings> | null | undefined): HistoryMap {
  const limits = normalizeHistoryLimitSettings(limitsInput);

  const perSeriesTrimmed: HistoryMap = {};
  for (const [nodeId, nodeHistory] of Object.entries(history)) {
    const nextNodeHistory: Record<string, RawHistorySample[]> = {};
    for (const [category, list] of Object.entries(nodeHistory)) {
      if (list.length > limits.perSeriesMaxPoints) {
        nextNodeHistory[category] = list.slice(list.length - limits.perSeriesMaxPoints);
      } else {
        nextNodeHistory[category] = list;
      }
    }
    perSeriesTrimmed[nodeId] = nextNodeHistory;
  }

  return trimTotalHistoryPoints(perSeriesTrimmed, limits.totalMaxPoints);
}

export function pushHistory(
  history: HistoryMap,
  nodeId: string,
  category: string,
  sample: RawHistorySample,
  retentionNs = defaultRetentionNs,
  limitsInput: Partial<HistoryLimitSettings> | null | undefined = defaultHistoryLimits,
): HistoryMap {
  const limits = normalizeHistoryLimitSettings(limitsInput);
  const nodeHistory = history[nodeId] ?? {};
  const list = nodeHistory[category] ?? [];
  const appended = [...list, sample];
  const minTs = sample.atNs - retentionNs;
  const timePruned = appended.filter((s) => s.atNs >= minTs);
  const nextList =
    timePruned.length > limits.perSeriesMaxPoints
      ? timePruned.slice(timePruned.length - limits.perSeriesMaxPoints)
      : timePruned;

  const next = {
    ...history,
    [nodeId]: {
      ...nodeHistory,
      [category]: nextList,
    },
  };
  return trimTotalHistoryPoints(next, limits.totalMaxPoints);
}
