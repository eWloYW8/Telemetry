/// <reference lib="webworker" />

import { decodeWSEventFromBytes } from "./ws-message-decode";
import { defaultMinSampleIntervalMs, defaultProcessMinSampleIntervalMs, normalizeMinSampleIntervalMs } from "./ws-sample-filter";
import type { WorkerInboundMessage } from "./ws-worker-protocol";

const worker = self as unknown as DedicatedWorkerGlobalScope;
const lastAcceptedByPoint = new Map<string, bigint>();

let minSampleIntervalMs = defaultMinSampleIntervalMs;
let processMinSampleIntervalMs = defaultProcessMinSampleIntervalMs;

worker.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === "set-min-sample-interval") {
    minSampleIntervalMs = normalizeMinSampleIntervalMs(msg.minSampleIntervalMs);
    processMinSampleIntervalMs = normalizeMinSampleIntervalMs(msg.processMinSampleIntervalMs);
    return;
  }

  if (msg.type === "reset-filter") {
    lastAcceptedByPoint.clear();
    return;
  }

  if (msg.type !== "decode") return;

  try {
    const decoded = decodeWSEventFromBytes(new Uint8Array(msg.bytes), {
      minSampleIntervalMs,
      processMinSampleIntervalMs,
      lastAcceptedByPoint,
    });
    if (decoded) {
      worker.postMessage(decoded);
    }
  } catch {
    // ignore decode errors
  }
};

export {};
