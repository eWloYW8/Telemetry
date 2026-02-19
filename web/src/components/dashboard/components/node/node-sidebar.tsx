"use client";

import { useEffect, useState } from "react";
import { ChevronsLeft, ChevronsRight, Server, Settings2, Zap } from "lucide-react";

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
  const [collapsed, setCollapsed] = useState(false);
  const online = nodes.filter((n) => n.connected).length;
  const sidebarCollapsedKey = "telemetry.sidebar.collapsed";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(sidebarCollapsedKey);
      if (!raw) return;
      setCollapsed(raw === "1");
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(sidebarCollapsedKey, collapsed ? "1" : "0");
    } catch {
      // ignore localStorage errors
    }
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "telemetry-panel flex flex-col overflow-hidden",
        collapsed
          ? "h-auto min-h-0 lg:h-full lg:min-h-0 lg:w-[58px] lg:min-w-[58px]"
          : "h-[260px] min-h-[260px] lg:h-full lg:min-h-0 lg:w-[320px] lg:min-w-[320px]",
      )}
    >
      <div className={cn("telemetry-panel-header", collapsed && "hidden lg:block")}>
        {collapsed ? (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--telemetry-border)] bg-[var(--telemetry-surface-soft)] text-[var(--telemetry-muted-fg)] transition-colors hover:bg-[var(--telemetry-row-hover)]"
              aria-label="Expand node list"
              title="Expand node list"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4" />
              Nodes
            </div>
            <div className="inline-flex items-center gap-1">
              <Badge variant={wsConnected ? "default" : "outline"}>WS {wsConnected ? "connected" : "retrying"}</Badge>
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--telemetry-border)] bg-[var(--telemetry-surface-soft)] text-[var(--telemetry-muted-fg)] transition-colors hover:bg-[var(--telemetry-row-hover)]"
                aria-label="Collapse node list"
                title="Collapse node list"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {collapsed ? null : <div className="mt-1 telemetry-muted">Online {online}/{nodes.length}</div>}
      </div>

      {collapsed ? (
        <div className="p-1.5 lg:hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--telemetry-border)] bg-[var(--telemetry-surface-soft)] text-[var(--telemetry-muted-fg)] transition-colors hover:bg-[var(--telemetry-row-hover)]"
              aria-label="Expand node list"
              title="Expand node list"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>

            {nodes.map((node) => {
              const basic = basicInfo(node.registration);
              const hostname = String(basic?.hostname ?? "") || node.nodeId;
              const selected = node.nodeId === selectedNodeId;

              return (
                <button
                  key={`mobile-collapsed-${node.nodeId}`}
                  type="button"
                  onClick={() => onSelectNode(node.nodeId)}
                  aria-label={hostname}
                  title={`${hostname} (${node.connected ? "online" : "stale"})`}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border p-0 transition-colors",
                    selected
                      ? "border-[var(--telemetry-accent)] bg-[var(--telemetry-accent-soft)]"
                      : "border-[var(--telemetry-border)] bg-[var(--telemetry-surface)] hover:bg-[var(--telemetry-row-hover)]",
                  )}
                >
                  <Server
                    className="h-4 w-4"
                    style={{
                      color: selected
                        ? "var(--telemetry-accent)"
                        : node.connected
                          ? "var(--telemetry-success)"
                          : "var(--telemetry-warning)",
                    }}
                  />
                </button>
              );
            })}

            <button
              type="button"
              onClick={onSelectPower}
              aria-label="Power"
              title="Power"
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border p-0 transition-colors",
                powerSelected
                  ? "border-[var(--telemetry-accent)] bg-[var(--telemetry-accent-soft)]"
                  : "border-[var(--telemetry-border)] bg-[var(--telemetry-surface)] hover:bg-[var(--telemetry-row-hover)]",
              )}
            >
              <Zap className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onSelectSettings}
              aria-label="Settings"
              title="Settings"
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border p-0 transition-colors",
                settingsSelected
                  ? "border-[var(--telemetry-accent)] bg-[var(--telemetry-accent-soft)]"
                  : "border-[var(--telemetry-border)] bg-[var(--telemetry-surface)] hover:bg-[var(--telemetry-row-hover)]",
              )}
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className={cn("min-h-0 flex-1", collapsed ? "hidden p-1.5 lg:block" : "p-2")}>
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="min-h-0 flex-1 space-y-1.5 overflow-auto">
            {nodes.length === 0 ? (
              <div className={cn("telemetry-empty p-3 text-sm", collapsed && "flex items-center justify-center p-2 text-xs")}>
                {collapsed ? <Server className="h-4 w-4" /> : "Waiting for telemetry stream..."}
              </div>
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
                  aria-label={hostname}
                  title={`${hostname} (${node.connected ? "online" : "stale"})`}
                  className={cn(
                    collapsed
                      ? "mx-auto flex h-9 w-9 items-center justify-center rounded-md border p-0 text-left transition-colors"
                      : "w-full rounded-md border p-2.5 text-left transition-colors",
                    selected
                      ? "border-[var(--telemetry-accent)] bg-[var(--telemetry-accent-soft)]"
                      : "border-[var(--telemetry-border)] bg-[var(--telemetry-surface)] hover:bg-[var(--telemetry-row-hover)]",
                  )}
                >
                  {collapsed ? (
                    <Server
                      className="h-4 w-4"
                      style={{
                        color: selected
                          ? "var(--telemetry-accent)"
                          : node.connected
                            ? "var(--telemetry-success)"
                            : "var(--telemetry-warning)",
                      }}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[var(--telemetry-border)] pt-2">
            <button
              type="button"
              onClick={onSelectPower}
              aria-label="Power"
              title="Power"
              className={cn(
                collapsed
                  ? "mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-md border p-0 transition-colors"
                  : "mb-1.5 w-full rounded-md border p-2.5 text-left text-sm font-semibold transition-colors",
                powerSelected
                  ? "border-[var(--telemetry-accent)] bg-[var(--telemetry-accent-soft)]"
                  : "border-[var(--telemetry-border)] bg-[var(--telemetry-surface)] hover:bg-[var(--telemetry-row-hover)]",
              )}
            >
              <span className={cn("inline-flex items-center", collapsed ? "gap-0" : "gap-1.5")}>
                <Zap className="h-4 w-4" />
                {collapsed ? null : "Power"}
              </span>
            </button>
            <button
              type="button"
              onClick={onSelectSettings}
              aria-label="Settings"
              title="Settings"
              className={cn(
                collapsed
                  ? "mx-auto flex h-9 w-9 items-center justify-center rounded-md border p-0 transition-colors"
                  : "w-full rounded-md border p-2.5 text-left text-sm font-semibold transition-colors",
                settingsSelected
                  ? "border-[var(--telemetry-accent)] bg-[var(--telemetry-accent-soft)]"
                  : "border-[var(--telemetry-border)] bg-[var(--telemetry-surface)] hover:bg-[var(--telemetry-row-hover)]",
              )}
            >
              <span className={cn("inline-flex items-center", collapsed ? "gap-0" : "gap-1.5")}>
                <Settings2 className="h-4 w-4" />
                {collapsed ? null : "Settings"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
