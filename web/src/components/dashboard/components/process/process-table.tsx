"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";

import {
  DenseTable,
  DenseTableBody,
  DenseTableCell,
  DenseTableFrame,
  DenseTableHead,
  DenseTableHeaderCell,
  DenseTableRow,
} from "../ui/dense-table";
import type { ProcessRow, ProcessSortKey, SortDir } from "../../types";
import { formatBytes, formatPercent } from "../../utils/units";

type ProcessTableProps = {
  rows: ProcessRow[];
  sortKey: ProcessSortKey;
  sortDir: SortDir;
  onSort: (k: ProcessSortKey) => void;
  pinnedPids: Set<number>;
  onTogglePin: (pid: number) => void;
  commandPending: boolean;
  onSignal: (pid: number, signal: number) => void;
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-[var(--telemetry-muted-fg)] opacity-50">-</span>;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export function ProcessTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  pinnedPids,
  onTogglePin,
  commandPending,
  onSignal,
}: ProcessTableProps) {
  const compactCellClass = "py-0.5";
  const signalButtonClass = "h-4 rounded-sm px-1 text-[9px] leading-none";

  const stateClass = (state: string): string => {
    switch (state) {
      case "R":
        return "text-[var(--telemetry-success)]";
      case "S":
        return "text-[var(--telemetry-accent)]";
      case "D":
        return "text-[var(--telemetry-warning)]";
      case "Z":
        return "text-[var(--telemetry-danger)]";
      case "T":
        return "text-[var(--telemetry-warning)]";
      default:
        return "text-[var(--telemetry-text)]";
    }
  };

  const cpuClass = (cpu: number): string => {
    if (cpu >= 80) return "text-[var(--telemetry-danger)]";
    if (cpu >= 40) return "text-[var(--telemetry-warning)]";
    if (cpu >= 15) return "text-[var(--telemetry-accent)]";
    return "text-[var(--telemetry-success)]";
  };

  const memClass = (bytes: number): string => {
    if (bytes >= 8 * 1024 * 1024 * 1024) return "text-[var(--telemetry-danger)]";
    if (bytes >= 2 * 1024 * 1024 * 1024) return "text-[var(--telemetry-warning)]";
    if (bytes >= 512 * 1024 * 1024) return "text-[var(--telemetry-accent)]";
    return "text-[var(--telemetry-text)]";
  };

  const onRowClick = (evt: MouseEvent<HTMLTableRowElement>, pid: number) => {
    const target = evt.target as HTMLElement | null;
    if (target?.closest("button")) return;
    onTogglePin(pid);
  };

  return (
    <DenseTableFrame>
      <DenseTable className="min-w-[1180px] table-auto">
        <DenseTableHead>
          <tr>
            {[
              ["PID", "pid"],
              ["PPID", "ppid"],
              ["User", "user"],
              ["State", "state"],
              ["CPU %", "cpu"],
              ["Memory", "memory"],
              ["Command", "command"],
            ].map(([label, key]) => (
              <DenseTableHeaderCell key={key}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[var(--telemetry-muted-fg)] transition-colors hover:text-[var(--telemetry-text)]"
                  onClick={() => onSort(key as ProcessSortKey)}
                >
                  {label}
                  <SortIcon active={sortKey === key} dir={sortDir} />
                </button>
              </DenseTableHeaderCell>
            ))}
            <DenseTableHeaderCell>Signals</DenseTableHeaderCell>
          </tr>
        </DenseTableHead>
        <DenseTableBody>
          {rows.map((p) => (
            <DenseTableRow
              key={`proc-${p.pid}`}
              onClick={(evt) => onRowClick(evt, p.pid)}
              title={pinnedPids.has(p.pid) ? "Click row to unpin" : "Click row to pin on top"}
              style={
                pinnedPids.has(p.pid)
                  ? {
                      background: "color-mix(in oklch, var(--telemetry-accent-soft) 82%, white 18%)",
                    }
                  : undefined
              }
            >
              <DenseTableCell className={`${compactCellClass} font-mono`}>{p.pid}</DenseTableCell>
              <DenseTableCell className={`${compactCellClass} font-mono text-[var(--telemetry-muted-fg)]`}>
                {p.ppid}
              </DenseTableCell>
              <DenseTableCell className={`${compactCellClass} font-medium`}>{p.user}</DenseTableCell>
              <DenseTableCell className={`${compactCellClass} font-mono ${stateClass(p.state)}`}>{p.state}</DenseTableCell>
              <DenseTableCell className={`${compactCellClass} font-mono ${cpuClass(p.cpu)}`}>
                {formatPercent(p.cpu)}
              </DenseTableCell>
              <DenseTableCell className={`${compactCellClass} font-mono ${memClass(p.memory)}`}>
                {formatBytes(p.memory)}
              </DenseTableCell>
              <DenseTableCell
                className={`${compactCellClass} max-w-[520px] overflow-hidden text-ellipsis font-mono`}
                title={p.command}
              >
                {p.command}
              </DenseTableCell>
              <DenseTableCell className={compactCellClass}>
                <div className="flex items-center gap-0.5">
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={commandPending}
                    onClick={() => onSignal(p.pid, 15)}
                    className={signalButtonClass}
                  >
                    TERM
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={commandPending}
                    onClick={() => onSignal(p.pid, 2)}
                    className={signalButtonClass}
                  >
                    INT
                  </Button>
                  <Button
                    size="xs"
                    variant="destructive"
                    disabled={commandPending}
                    onClick={() => onSignal(p.pid, 9)}
                    className={signalButtonClass}
                  >
                    KILL
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={commandPending}
                    onClick={() => onSignal(p.pid, 19)}
                    className={signalButtonClass}
                  >
                    STOP
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={commandPending}
                    onClick={() => onSignal(p.pid, 18)}
                    className={signalButtonClass}
                  >
                    CONT
                  </Button>
                </div>
              </DenseTableCell>
            </DenseTableRow>
          ))}
        </DenseTableBody>
      </DenseTable>
    </DenseTableFrame>
  );
}
