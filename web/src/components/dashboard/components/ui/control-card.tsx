"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ControlCardProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  disabledNote?: ReactNode;
  className?: string;
};

export function ControlCard({ title, description, children, disabledNote, className }: ControlCardProps) {
  return (
    <div className={cn("telemetry-control-card space-y-3", className)}>
      <div>
        <div className="telemetry-title">{title}</div>
        {description ? <div className="mt-1 telemetry-muted">{description}</div> : null}
      </div>
      <div className="space-y-3">{children}</div>
      {disabledNote ? <div className="telemetry-muted">{disabledNote}</div> : null}
    </div>
  );
}
