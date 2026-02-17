"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function DenseTableFrame({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("telemetry-table-frame", className)} {...props} />;
}

export function DenseTable({ className, ...props }: ComponentProps<"table">) {
  return <table className={cn("telemetry-table", className)} {...props} />;
}

export function DenseTableHead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("telemetry-table-head", className)} {...props} />;
}

export function DenseTableHeaderCell({ className, ...props }: ComponentProps<"th">) {
  return <th className={cn("telemetry-table-th", className)} {...props} />;
}

export function DenseTableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("telemetry-table-body", className)} {...props} />;
}

export function DenseTableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("telemetry-table-row", className)} {...props} />;
}

export function DenseTableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("telemetry-table-cell", className)} {...props} />;
}
