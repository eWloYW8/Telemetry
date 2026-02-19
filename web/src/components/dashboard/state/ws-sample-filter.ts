const minSampleIntervalMsMin = 0;
const minSampleIntervalMsMax = 60_000;
const sampleMetaKeys = new Set(["category", "atUnixNano", "at_unix_nano"]);
const identityHintKeys = [
  "coreId",
  "core_id",
  "packageId",
  "package_id",
  "gpuIndex",
  "gpu_index",
  "pid",
  "ppid",
  "uid",
  "gid",
  "name",
  "device",
  "disk",
  "iface",
  "interface",
  "mountpoint",
  "mountPoint",
  "filesystem",
  "fs",
] as const;

export const defaultMinSampleIntervalMs = 0;
export const defaultProcessMinSampleIntervalMs = 0;

export function normalizeMinSampleIntervalMs(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return defaultMinSampleIntervalMs;
  return Math.min(minSampleIntervalMsMax, Math.max(minSampleIntervalMsMin, Math.floor(num)));
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function itemIdentity(item: unknown, index: number): string {
  if (!isPlainObject(item)) return `idx:${index}`;

  const parts: string[] = [];
  for (const key of identityHintKeys) {
    const value = item[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      parts.push(`${key}=${String(value)}`);
    }
  }
  if (parts.length > 0) return parts.join("|");

  for (const [key, value] of Object.entries(item)) {
    if (!/(^id$|_id$|Id$|ID$)/.test(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return `${key}=${String(value)}`;
    }
  }

  return `idx:${index}`;
}

function shouldAcceptPoint(
  lastAcceptedByPoint: Map<string, bigint>,
  pointKey: string,
  atNs: bigint,
  minIntervalNs: bigint,
): boolean {
  const lastAccepted = lastAcceptedByPoint.get(pointKey);
  if (lastAccepted !== undefined && atNs - lastAccepted < minIntervalNs) {
    return false;
  }
  lastAcceptedByPoint.set(pointKey, atNs);
  return true;
}

export function filterSampleByMinInterval(
  nodeId: string,
  category: string,
  sample: Record<string, any>,
  atNs: bigint,
  minIntervalMs: number,
  lastAcceptedByPoint: Map<string, bigint>,
): Record<string, any> | null {
  if (minIntervalMs <= 0) return sample;

  const minIntervalNs = BigInt(minIntervalMs) * 1_000_000n;
  if (category === "process") {
    const snapshotKey = `${nodeId}\u0000${category}\u0000snapshot`;
    if (!shouldAcceptPoint(lastAcceptedByPoint, snapshotKey, atNs, minIntervalNs)) {
      return null;
    }
    return sample;
  }

  let acceptedPoints = 0;
  const nextSample: Record<string, any> = {};

  for (const [key, value] of Object.entries(sample)) {
    if (sampleMetaKeys.has(key)) {
      nextSample[key] = value;
    }
  }

  for (const [payloadKey, payloadValue] of Object.entries(sample)) {
    if (sampleMetaKeys.has(payloadKey)) continue;
    if (!isPlainObject(payloadValue)) continue;

    const nextPayload: Record<string, any> = { ...payloadValue };
    const arrayEntries = Object.entries(payloadValue).filter(([, value]) => Array.isArray(value));

    if (arrayEntries.length === 0) {
      const pointKey = `${nodeId}\u0000${category}\u0000${payloadKey}\u0000obj`;
      if (!shouldAcceptPoint(lastAcceptedByPoint, pointKey, atNs, minIntervalNs)) {
        continue;
      }
      acceptedPoints += 1;
      nextSample[payloadKey] = nextPayload;
      continue;
    }

    let payloadAccepted = 0;
    for (const [fieldKey, fieldValue] of arrayEntries) {
      const list = fieldValue as any[];
      const filtered: any[] = [];
      for (let i = 0; i < list.length; i += 1) {
        const id = itemIdentity(list[i], i);
        const pointKey = `${nodeId}\u0000${category}\u0000${payloadKey}.${fieldKey}\u0000${id}`;
        if (!shouldAcceptPoint(lastAcceptedByPoint, pointKey, atNs, minIntervalNs)) {
          continue;
        }
        filtered.push(list[i]);
      }
      nextPayload[fieldKey] = filtered;
      payloadAccepted += filtered.length;
    }

    if (payloadAccepted > 0) {
      acceptedPoints += payloadAccepted;
      nextSample[payloadKey] = nextPayload;
    }
  }

  if (acceptedPoints === 0) return null;
  return nextSample;
}
