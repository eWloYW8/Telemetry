"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ProcessRow, ProcessSortKey, SortDir } from "../../types";
import { formatBytes, formatPercent } from "../../utils/units";

type ProcessTableProps = {
  rows: ProcessRow[];
  sortKey: ProcessSortKey;
  sortDir: SortDir;
  onSort: (k: ProcessSortKey) => void;
  commandPending: boolean;
  onSignal: (pid: number, signal: number) => void;
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-slate-300">-</span>;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export function ProcessTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  commandPending,
  onSignal,
}: ProcessTableProps) {
  const stateClass = (state: string): string => {
    switch (state) {
      case "R":
        return "text-emerald-600";
      case "S":
        return "text-blue-600";
      case "D":
        return "text-amber-600";
      case "Z":
        return "text-red-600";
      case "T":
        return "text-orange-600";
      default:
        return "text-slate-700";
    }
  };
  const cpuClass = (cpu: number): string => {
    if (cpu >= 80) return "text-red-600";
    if (cpu >= 40) return "text-orange-600";
    if (cpu >= 15) return "text-amber-600";
    return "text-emerald-600";
  };
  const memClass = (bytes: number): string => {
    if (bytes >= 8 * 1024 * 1024 * 1024) return "text-red-600";
    if (bytes >= 2 * 1024 * 1024 * 1024) return "text-orange-600";
    if (bytes >= 512 * 1024 * 1024) return "text-amber-600";
    return "text-slate-700";
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 text-[11px]">
      <table className="w-full min-w-[1180px] table-auto">
        <thead className="sticky top-0 z-20 bg-slate-50">
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
              <th key={key} className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-slate-900"
                  onClick={() => onSort(key as ProcessSortKey)}
                >
                  {label}
                  <SortIcon active={sortKey === key} dir={sortDir} />
                </button>
              </th>
            ))}
            <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Signals</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((p) => (
            <tr key={`proc-${p.pid}`} className="hover:bg-slate-50">
              <td className="px-3 py-0.5 whitespace-nowrap font-mono">{p.pid}</td>
              <td className="px-3 py-0.5 whitespace-nowrap font-mono text-slate-500">{p.ppid}</td>
              <td className="px-3 py-0.5 whitespace-nowrap font-medium">{p.user}</td>
              <td className={`px-3 py-0.5 whitespace-nowrap font-mono ${stateClass(p.state)}`}>{p.state}</td>
              <td className={`px-3 py-0.5 whitespace-nowrap font-mono ${cpuClass(p.cpu)}`}>{formatPercent(p.cpu)}</td>
              <td className={`px-3 py-0.5 whitespace-nowrap font-mono ${memClass(p.memory)}`}>{formatBytes(p.memory)}</td>
              <td className="max-w-[520px] overflow-hidden text-ellipsis px-3 py-0.5 whitespace-nowrap font-mono" title={p.command}>
                {p.command}
              </td>
              <td className="px-3 py-0.5 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={commandPending}
                    onClick={() => onSignal(p.pid, 15)}
                    className="h-5 px-1.5 text-[10px]"
                  >
                    TERM
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={commandPending}
                    onClick={() => onSignal(p.pid, 2)}
                    className="h-5 px-1.5 text-[10px]"
                  >
                    INT
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={commandPending}
                    onClick={() => onSignal(p.pid, 9)}
                    className="h-5 px-1.5 text-[10px]"
                  >
                    KILL
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={commandPending}
                    onClick={() => onSignal(p.pid, 19)}
                    className="h-5 px-1.5 text-[10px]"
                  >
                    STOP
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={commandPending}
                    onClick={() => onSignal(p.pid, 18)}
                    className="h-5 px-1.5 text-[10px]"
                  >
                    CONT
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
