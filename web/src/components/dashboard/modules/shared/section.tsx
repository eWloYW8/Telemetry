"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Section({
  title,
  description,
  icon,
  right,
  compact = false,
  children,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="telemetry-panel overflow-hidden">
      <header className="telemetry-panel-header flex items-start justify-between gap-3">
        <div>
          <div className="telemetry-title inline-flex items-center gap-2">
            {icon}
            {title}
          </div>
          {description ? <div className="mt-1 telemetry-muted">{description}</div> : null}
        </div>
        {right}
      </header>
      <div className={cn(compact ? "p-2.5" : "p-3")}>{children}</div>
    </section>
  );
}

const statToneClass: Record<"default" | "success" | "warning" | "danger", string> = {
  default: "text-[var(--telemetry-text)]",
  success: "text-[var(--telemetry-success)]",
  warning: "text-[var(--telemetry-warning)]",
  danger: "text-[var(--telemetry-danger)]",
};

export function StatRow({
  name,
  value,
  tone = "default",
}: {
  name: string;
  value: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-2 border-b border-[var(--telemetry-border-subtle)] py-1 text-sm last:border-b-0">
      <div className="telemetry-muted">{name}</div>
      <div className={cn("font-medium", statToneClass[tone])}>{value}</div>
    </div>
  );
}
