"use client";

import { toBigIntNs } from "../../utils/time";

export function numField(obj: Record<string, any> | null | undefined, ...keys: string[]): number {
  if (!obj) return 0;
  for (const key of keys) {
    const value = obj[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
      continue;
    }
    if (typeof value === "bigint") return Number(value);
    if (typeof value === "object") {
      const big = toBigIntNs(value);
      if (big !== 0n) return Number(big);
    }
  }
  return 0;
}

export function strField(obj: Record<string, any> | null | undefined, ...keys: string[]): string {
  if (!obj) return "";
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return "";
}

export function sampledAtNs(v: Record<string, any>, fallback: bigint): bigint {
  const sampled = toBigIntNs(v.sampledAtUnixNano ?? v.sampled_at_unix_nano);
  if (sampled > 0n) return sampled;
  return fallback;
}

export function moduleMeta(registration: Record<string, any> | null | undefined, moduleName: string) {
  const modules = (registration?.modules ?? []) as Array<Record<string, any>>;
  for (const moduleEntry of modules) {
    if (moduleEntry.name !== moduleName) continue;
    if (moduleEntry[moduleName]) return moduleEntry[moduleName] as Record<string, any>;
    for (const key of ["cpu", "gpu", "memory", "storage", "network", "infiniband", "process"]) {
      if (moduleEntry[key]) return moduleEntry[key] as Record<string, any>;
    }
  }
  return null;
}

export function formatIDRanges(ids: number[]): string {
  if (!ids || ids.length === 0) return "-";
  const sorted = Array.from(new Set(ids)).sort((a, b) => a - b);
  const segments: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    segments.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = cur;
    prev = cur;
  }
  segments.push(start === prev ? `${start}` : `${start}-${prev}`);
  return segments.join(", ");
}

export const linePalette = [
  "#0f766e",
  "#1d4ed8",
  "#b45309",
  "#0e7490",
  "#15803d",
  "#c2410c",
  "#334155",
  "#0284c7",
];
