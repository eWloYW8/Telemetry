import type { RawHistorySample } from "../types";
import { sliceLimit } from "../utils/units";

export type HistoryMap = Record<string, Record<string, RawHistorySample[]>>;

export function pushHistory(
  history: HistoryMap,
  nodeId: string,
  category: string,
  sample: RawHistorySample,
  maxLen = 360,
): HistoryMap {
  const nodeHistory = history[nodeId] ?? {};
  const list = nodeHistory[category] ?? [];
  return {
    ...history,
    [nodeId]: {
      ...nodeHistory,
      [category]: sliceLimit([...list, sample], maxLen),
    },
  };
}
