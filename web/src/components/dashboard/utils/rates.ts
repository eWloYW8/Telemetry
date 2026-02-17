import { nsDiffToSeconds } from "./time";

export function deltaRate(curValue: number, prevValue: number, curNs: bigint, prevNs: bigint): number | null {
  const delta = curValue - prevValue;
  if (!Number.isFinite(delta) || delta < 0) return null;
  const dt = nsDiffToSeconds(curNs, prevNs);
  if (dt <= 0) return null;
  return delta / dt;
}

export function maxOr(v: number, fallback: number): number {
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return v;
}
