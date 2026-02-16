"use client";

import type { ReactNode } from "react";

export function Section({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {icon}
          {title}
        </div>
        {right}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

export function StatRow({ name, value }: { name: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-2 border-b border-slate-100 py-1 text-sm last:border-b-0">
      <div className="text-slate-500">{name}</div>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  );
}

