import type { RawHistorySample } from "../types";

export type HistoryMap = Record<string, Record<string, RawHistorySample[]>>;

const defaultRetentionNs = 3_600_000_000_000n; // 1 hour
const defaultMaxPoints = 5_000;

export function pushHistory(
  history: HistoryMap,
  nodeId: string,
  category: string,
  sample: RawHistorySample,
  retentionNs = defaultRetentionNs,
  maxPoints = defaultMaxPoints,
): HistoryMap {
  const nodeHistory = history[nodeId] ?? {};
  const list = nodeHistory[category] ?? [];
  const appended = [...list, sample];
  const minTs = sample.atNs - retentionNs;
  const timePruned = appended.filter((s) => s.atNs >= minTs);
  const nextList =
    timePruned.length > maxPoints
      ? timePruned.slice(timePruned.length - maxPoints)
      : timePruned;

  return {
    ...history,
    [nodeId]: {
      ...nodeHistory,
      [category]: nextList,
    },
  };
}
