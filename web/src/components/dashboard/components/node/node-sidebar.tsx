"use client";

import { Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { NodeRuntime } from "../../types";

type NodeSidebarProps = {
  wsConnected: boolean;
  nodes: NodeRuntime[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
};

function basicInfo(registration: Record<string, any> | null | undefined): Record<string, any> | null {
  return (registration?.basic ?? null) as Record<string, any> | null;
}

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
          (() => {
            const basic = basicInfo(node.registration);
            const hostname = String(basic?.hostname ?? "") || node.nodeId;
            const arch = String(basic?.arch ?? "") || "-";
            const sourceIP = node.sourceIP && node.sourceIP.trim() !== "" ? node.sourceIP : "-";
            const os = String(basic?.os ?? "") || "-";
            const kernel = String(basic?.kernel ?? "") || "-";
            return (
              <button
                key={node.nodeId}
                type="button"
                onClick={() => onSelectNode(node.nodeId)}
                className={`w-full border px-3 py-2 text-left ${
                  node.nodeId === selectedNodeId ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium">{hostname}</div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={node.connected ? "default" : "outline"}>
                      {node.connected ? "online" : "stale"}
                    </Badge>
                    <Badge variant={node.connected ? "default" : "outline"}>{arch}</Badge>
                  </div>
                </div>
                <div className="mt-1 truncate font-mono text-xs text-slate-500">{sourceIP}</div>
                <div className="mt-1 truncate font-mono text-xs text-slate-500">{os}</div>
                <div className="mt-1 truncate font-mono text-xs text-slate-500">{kernel}</div>
              </button>
            );
          })()
        ))}
      </div>
    </aside>
  );
}
