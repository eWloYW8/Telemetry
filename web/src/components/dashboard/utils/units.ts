export function formatNumber(v: number, digits = 3): string {
  if (!Number.isFinite(v)) return "0";
  if (digits <= 0) return `${Math.round(v)}`;
  const fixed = v.toFixed(digits);
  const trimmed = fixed.replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
  return trimmed === "-0" ? "0" : trimmed;
}

export function formatPercent(v: number): string {
  return `${formatNumber(v, 3)} %`;
}

export function formatBytes(v: number): string {
  if (!v || v <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let value = v;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${formatNumber(value, 3)} ${units[idx]}`;
}

export function formatPowerMicroW(v: number): string {
  return `${formatNumber(v / 1_000_000, 3)} W`;
}

export function formatPowerMilliW(v: number): string {
  return `${formatNumber(v / 1000, 3)} W`;
}

export function formatKHz(v: number): string {
  if (!v || v <= 0) return "0 kHz";
  if (v >= 1_000_000) return `${formatNumber(v / 1_000_000, 3)} GHz`;
  if (v >= 1000) return `${formatNumber(v / 1000, 3)} MHz`;
  return `${formatNumber(v, 3)} kHz`;
}

export function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

export function sliceLimit<T>(arr: T[], limit: number): T[] {
  if (arr.length <= limit) return arr;
  return arr.slice(arr.length - limit);
}
