"use client";

import { Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { NodeRuntime } from "../../types";
import { nsToTimeLabel } from "../../utils/time";

function moduleNames(registration: Record<string, any> | null | undefined): string[] {
  const modules = (registration?.modules ?? []) as Array<Record<string, any>>;
  return modules.map((m) => String(m.name ?? "")).filter(Boolean).sort();
}

type NodeSidebarProps = {
  wsConnected: boolean;
  nodes: NodeRuntime[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
};

export function NodeSidebar({ wsConnected, nodes, selectedNodeId, onSelectNode }: NodeSidebarProps) {
  const online = nodes.filter((n) => n.connected).length;

  return (
    <aside className="w-[280px] border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Server className="h-5 w-5" />
          Nodes
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Online {online}/{nodes.length}
        </div>
        <div className="mt-2">
          <Badge variant={wsConnected ? "default" : "outline"}>
            WS {wsConnected ? "connected" : "reconnecting"}
          </Badge>
        </div>
      </div>

      <div className="max-h-[calc(100vh-100px)] space-y-2 overflow-auto p-2">
        {nodes.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            Waiting for telemetry stream...
          </div>
        ) : null}

        {nodes.map((node) => (
          <button
            key={node.nodeId}
            type="button"
            onClick={() => onSelectNode(node.nodeId)}
            className={`w-full border px-3 py-2 text-left ${
              node.nodeId === selectedNodeId ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium">{node.nodeId}</div>
              <Badge variant={node.connected ? "default" : "outline"}>
                {node.connected ? "online" : "stale"}
              </Badge>
            </div>
            <div className="mt-1 truncate text-xs text-slate-500">{moduleNames(node.registration).join(", ") || "-"}</div>
            <div className="text-xs text-slate-400">Last {nsToTimeLabel(node.lastSeenUnixNano)}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
