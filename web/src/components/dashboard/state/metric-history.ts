import type { RawHistorySample } from "../types";

export type HistoryMap = Record<string, Record<string, RawHistorySample[]>>;

const defaultRetentionNs = 3_600_000_000_000n; // 1 hour
export const defaultHistoryLimits = {
  perSeriesMaxPoints: 500,
  totalMaxPoints: 10_000,
} as const;

const minPerSeriesMaxPoints = 100;
const maxPerSeriesMaxPoints = 200_000;
const minTotalMaxPoints = 1_000;
const maxTotalMaxPoints = 2_000_000;

export type HistoryLimitSettings = {
  perSeriesMaxPoints: number;
  totalMaxPoints: number;
};

export type PushHistoryBatchResult = {
  history: HistoryMap;
  totalPoints: number;
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

export function countHistoryPoints(history: HistoryMap): number {
  let total = 0;
  for (const nodeHistory of Object.values(history)) {
    for (const list of Object.values(nodeHistory)) {
      total += list.length;
    }
  }
  return total;
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
  return pushHistoryBatch(
    history,
    [{ nodeId, category, sample }],
    retentionNs,
    limitsInput,
  );
}

export function pushHistoryBatch(
  history: HistoryMap,
  updates: Array<{ nodeId: string; category: string; sample: RawHistorySample }>,
  retentionNs = defaultRetentionNs,
  limitsInput: Partial<HistoryLimitSettings> | null | undefined = defaultHistoryLimits,
): HistoryMap {
  return pushHistoryBatchWithTotal(history, updates, retentionNs, limitsInput).history;
}

export function pushHistoryBatchWithTotal(
  history: HistoryMap,
  updates: Array<{ nodeId: string; category: string; sample: RawHistorySample }>,
  retentionNs = defaultRetentionNs,
  limitsInput: Partial<HistoryLimitSettings> | null | undefined = defaultHistoryLimits,
  totalPointsHint?: number,
): PushHistoryBatchResult {
  if (updates.length === 0) {
    return {
      history,
      totalPoints: totalPointsHint ?? countHistoryPoints(history),
    };
  }

  const limits = normalizeHistoryLimitSettings(limitsInput);
  const grouped = new Map<string, Array<{ atNs: bigint; sample: RawHistorySample }>>();
  for (const update of updates) {
    const key = `${update.nodeId}\u0000${update.category}`;
    const list = grouped.get(key) ?? [];
    list.push({ atNs: update.sample.atNs, sample: update.sample });
    grouped.set(key, list);
  }

  const next: HistoryMap = { ...history };
  let changed = false;
  let totalDelta = 0;

  for (const [key, list] of grouped.entries()) {
    const sep = key.indexOf("\u0000");
    const nodeId = key.slice(0, sep);
    const category = key.slice(sep + 1);

    const nodeHistory = next[nodeId] ?? history[nodeId] ?? {};
    const sourceList = nodeHistory[category] ?? [];
    const sourceListLength = sourceList.length;
    const additions = list.map((entry) => entry.sample);
    if (additions.length === 0) continue;

    let maxAtNs = additions[0].atNs;
    for (let i = 1; i < additions.length; i += 1) {
      if (additions[i].atNs > maxAtNs) maxAtNs = additions[i].atNs;
    }

    const appended = [...sourceList, ...additions];
    const minTs = maxAtNs - retentionNs;
    let start = 0;
    while (start < appended.length && appended[start].atNs < minTs) {
      start += 1;
    }
    const timePruned = start > 0 ? appended.slice(start) : appended;
    const nextList =
      timePruned.length > limits.perSeriesMaxPoints
        ? timePruned.slice(timePruned.length - limits.perSeriesMaxPoints)
        : timePruned;

    next[nodeId] = {
      ...nodeHistory,
      [category]: nextList,
    };
    totalDelta += nextList.length - sourceListLength;
    changed = true;
  }

  if (!changed) {
    return {
      history,
      totalPoints: totalPointsHint ?? countHistoryPoints(history),
    };
  }

  const nextTotalPoints =
    totalPointsHint === undefined ? undefined : Math.max(0, totalPointsHint + totalDelta);
  if (nextTotalPoints !== undefined && nextTotalPoints <= limits.totalMaxPoints) {
    return {
      history: next,
      totalPoints: nextTotalPoints,
    };
  }

  const trimmed = trimTotalHistoryPoints(next, limits.totalMaxPoints);
  return {
    history: trimmed,
    totalPoints: countHistoryPoints(trimmed),
  };
}
