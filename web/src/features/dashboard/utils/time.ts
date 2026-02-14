export type LongLike =
  | number
  | string
  | bigint
  | { toNumber?: () => number; toString?: () => string; low?: number; high?: number; unsigned?: boolean }
  | null
  | undefined;

export function toBigIntNs(v: LongLike): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return 0n;
    return BigInt(Math.trunc(v));
  }
  if (typeof v === "string") {
    if (!v) return 0n;
    try {
      return BigInt(v);
    } catch {
      return 0n;
    }
  }
  if (!v || typeof v !== "object") return 0n;

  if (typeof v.toString === "function") {
    try {
      const s = v.toString();
      if (s && /^-?\d+$/.test(s)) return BigInt(s);
    } catch {
      // ignore
    }
  }

  if (typeof v.toNumber === "function") {
    try {
      return BigInt(Math.trunc(v.toNumber()));
    } catch {
      // ignore
    }
  }

  if (typeof v.low === "number" && typeof v.high === "number") {
    const low = BigInt(v.low >>> 0);
    const high = BigInt(v.high >>> 0);
    const raw = (high << 32n) | low;
    if (v.unsigned) return raw;
    if ((v.high & 0x80000000) !== 0) {
      return raw - (1n << 64n);
    }
    return raw;
  }

  return 0n;
}

export function nsToMsNumber(ns: bigint): number {
  return Number(ns / 1_000_000n);
}

export function nsToTimeLabel(ns: bigint): string {
  if (ns <= 0n) return "";
  return new Date(nsToMsNumber(ns)).toLocaleTimeString();
}

export function nsDiffToSeconds(curNs: bigint, prevNs: bigint): number {
  const diff = curNs - prevNs;
  if (diff <= 0n) return 0;
  return Number(diff) / 1e9;
}
