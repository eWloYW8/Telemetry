import type { NodeRuntime } from "../types";

export function upsertNode(
  list: NodeRuntime[],
  node: NodeRuntime,
): NodeRuntime[] {
  const idx = list.findIndex((n) => n.nodeId === node.nodeId);
  if (idx < 0) {
    return [...list, node].sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  }
  const next = [...list];
  next[idx] = node;
  return next;
}

export function markStaleNodes(list: NodeRuntime[], nowNs: bigint, staleAfterNs: bigint): NodeRuntime[] {
  let changed = false;
  const next = list.map((n) => {
    const shouldConnected = nowNs - n.lastSeenUnixNano <= staleAfterNs;
    if (shouldConnected === n.connected) return n;
    changed = true;
    return { ...n, connected: shouldConnected };
  });
  return changed ? next : list;
}
