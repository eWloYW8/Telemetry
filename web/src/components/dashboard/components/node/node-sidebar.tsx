"use client";

import { Server, Settings2, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { NodeRuntime } from "../../types";

type NodeSidebarProps = {
  wsConnected: boolean;
  nodes: NodeRuntime[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  powerSelected: boolean;
  onSelectPower: () => void;
  settingsSelected: boolean;
  onSelectSettings: () => void;
};

function basicInfo(registration: Record<string, any> | null | undefined): Record<string, any> | null {
  return (registration?.basic ?? null) as Record<string, any> | null;
}

export function NodeSidebar({
  wsConnected,
  nodes,
  selectedNodeId,
  onSelectNode,
  powerSelected,
  onSelectPower,
  settingsSelected,
  onSelectSettings,
}: NodeSidebarProps) {
  const online = nodes.filter((n) => n.connected).length;

  return (
    <aside className="telemetry-panel flex h-[260px] min-h-[260px] flex-col overflow-hidden lg:h-full lg:min-h-0 lg:w-[320px] lg:min-w-[320px]">
      <div className="telemetry-panel-header">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <Server className="h-4 w-4" />
            Nodes
          </div>
          <Badge variant={wsConnected ? "default" : "outline"}>WS {wsConnected ? "connected" : "retrying"}</Badge>
        </div>
        <div className="mt-1 telemetry-muted">
          Online {online}/{nodes.length}
        </div>
      </div>

      <div className="min-h-0 flex-1 p-2">
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="min-h-0 flex-1 space-y-1.5 overflow-auto">
            {nodes.length === 0 ? (
              <div className="telemetry-empty p-3 text-sm">Waiting for telemetry stream...</div>
            ) : null}

            {nodes.map((node) => {
              const basic = basicInfo(node.registration);
              const hostname = String(basic?.hostname ?? "") || node.nodeId;
              const arch = String(basic?.arch ?? "") || "-";
              const sourceIP = node.sourceIP && node.sourceIP.trim() !== "" ? node.sourceIP : "-";
              const os = String(basic?.os ?? "") || "-";
              const kernel = String(basic?.kernel ?? "") || "-";
              const selected = node.nodeId === selectedNodeId;

              return (
                <button
                  key={node.nodeId}
                  type="button"
                  onClick={() => onSelectNode(node.nodeId)}
                  className={cn(
                    "w-full rounded-md border p-2.5 text-left transition-colors",
                    selected
                      ? "border-[var(--telemetry-accent)] bg-[var(--telemetry-accent-soft)]"
                      : "border-[var(--telemetry-border)] bg-[var(--telemetry-surface)] hover:bg-[var(--telemetry-row-hover)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div className="truncate text-sm font-semibold text-[var(--telemetry-text)]">{hostname}</div>
                      <Badge variant="outline" className="h-5 px-1.5 font-mono text-[10px]">
                        {arch}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="telemetry-status-dot"
                        style={{ background: node.connected ? "var(--telemetry-success)" : "var(--telemetry-warning)" }}
                        aria-hidden="true"
                      />
                      <Badge variant={node.connected ? "default" : "outline"}>
                        {node.connected ? "online" : "stale"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-1.5 grid gap-0.5 text-[11px] text-[var(--telemetry-muted-fg)]">
                    <div className="truncate font-mono">{sourceIP}</div>
                    <div className="truncate font-mono">
                      {os} · {kernel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-[var(--telemetry-border)] pt-2">
            <button
              type="button"
              onClick={onSelectPower}
              className={cn(
                "mb-1.5 w-full rounded-md border p-2.5 text-left text-sm font-semibold transition-colors",
                powerSelected
                  ? "border-[var(--telemetry-accent)] bg-[var(--telemetry-accent-soft)]"
                  : "border-[var(--telemetry-border)] bg-[var(--telemetry-surface)] hover:bg-[var(--telemetry-row-hover)]",
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                Power
              </span>
            </button>
            <button
              type="button"
              onClick={onSelectSettings}
              className={cn(
                "w-full rounded-md border p-2.5 text-left text-sm font-semibold transition-colors",
                settingsSelected
                  ? "border-[var(--telemetry-accent)] bg-[var(--telemetry-accent-soft)]"
                  : "border-[var(--telemetry-border)] bg-[var(--telemetry-surface)] hover:bg-[var(--telemetry-row-hover)]",
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Settings2 className="h-4 w-4" />
                Settings
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
