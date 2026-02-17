"use client";

import { useMemo, useState } from "react";
import { Activity } from "lucide-react";

import { ProcessTable } from "../../components/process/process-table";
import type { ProcessRow, ProcessSortKey, RawHistorySample, SortDir } from "../../types";
import { numField, strField } from "../shared/data";
import { Section } from "../shared/section";

type ProcessModuleViewProps = {
  latestRaw: Record<string, Record<string, any>>;
  historyByCategory: Record<string, RawHistorySample[]>;
  cmdPending: boolean;
  cmdMsg: string;
  sendCommand: (commandType: string, payload: Record<string, unknown>) => void;
};

export function ProcessModuleView({ latestRaw, historyByCategory, cmdPending, cmdMsg, sendCommand }: ProcessModuleViewProps) {
  const [procSortKey, setProcSortKey] = useState<ProcessSortKey>("pid");
  const [procSortDir, setProcSortDir] = useState<SortDir>("asc");
  const [pinnedPids, setPinnedPids] = useState<Set<number>>(new Set());

  const processRaw = latestRaw.process?.processMetrics ?? latestRaw.process?.process_metrics ?? null;
  const processRowsRaw = (processRaw?.processes ?? []) as Array<Record<string, any>>;

  const processRows = useMemo<ProcessRow[]>(() => {
    const rows = processRowsRaw.map((p) => ({
      pid: numField(p, "pid"),
      ppid: numField(p, "ppid"),
      user: strField(p, "user") || "-",
      state: strField(p, "state") || "-",
      cpu: numField(p, "cpuPercent", "cpu_percent"),
      memory: numField(p, "memoryBytes", "memory_bytes"),
      command: strField(p, "command") || "-",
    }));

    return rows.sort((a, b) => {
      const aPinned = pinnedPids.has(a.pid);
      const bPinned = pinnedPids.has(b.pid);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;

      const sign = procSortDir === "asc" ? 1 : -1;
      switch (procSortKey) {
        case "pid":
          return (a.pid - b.pid) * sign;
        case "ppid":
          return (a.ppid - b.ppid) * sign;
        case "cpu":
          return (a.cpu - b.cpu) * sign;
        case "memory":
          return (a.memory - b.memory) * sign;
        case "user":
          return a.user.localeCompare(b.user) * sign;
        case "state":
          return a.state.localeCompare(b.state) * sign;
        case "command":
          return a.command.localeCompare(b.command) * sign;
        default:
          return 0;
      }
    });
  }, [processRowsRaw, procSortDir, procSortKey, pinnedPids, historyByCategory.process]);

  const onSortProcess = (key: ProcessSortKey) => {
    if (procSortKey === key) {
      setProcSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setProcSortKey(key);
    setProcSortDir(key === "command" || key === "user" || key === "state" ? "asc" : "desc");
  };

  const onTogglePin = (pid: number) => {
    setPinnedPids((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  return (
    <Section title="Process Table" icon={<Activity className="h-4 w-4" />}>
      <div className="mb-2 text-xs text-slate-500">
        Ctld-style dense table: sticky header, sortable columns, one-line rows, horizontal scrolling, common
        signal actions.
      </div>
      <ProcessTable
        rows={processRows}
        sortKey={procSortKey}
        sortDir={procSortDir}
        onSort={onSortProcess}
        pinnedPids={pinnedPids}
        onTogglePin={onTogglePin}
        commandPending={cmdPending}
        onSignal={(pid, signal) => sendCommand("process_signal", { pid, signal })}
      />
      {cmdMsg ? <div className="mt-2 text-xs text-slate-600">{cmdMsg}</div> : null}
    </Section>
  );
}
