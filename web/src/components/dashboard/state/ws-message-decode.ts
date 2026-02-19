import { telemetry as telemetryProto } from "../../../lib/proto/telemetry";

import { toBigIntNs } from "../utils/time";
import { filterSampleByMinInterval } from "./ws-sample-filter";
import type { WorkerDecodedEvent } from "./ws-worker-protocol";

const toObjectOptions = {
  longs: String,
  enums: String,
  defaults: false,
  arrays: true,
  objects: true,
};

type DecodeOptions = {
  minSampleIntervalMs: number;
  processMinSampleIntervalMs: number;
  lastAcceptedByPoint: Map<string, bigint>;
};

export function decodeWSEventFromBytes(bytes: Uint8Array, options: DecodeOptions): WorkerDecodedEvent | null {
  const decoded = telemetryProto.v1.WSOutgoingMessage.decode(bytes);
  const msg = telemetryProto.v1.WSOutgoingMessage.toObject(decoded, toObjectOptions) as Record<string, any>;

  if (msg.type === "command_result" && msg.commandResult) {
    const result = msg.commandResult as Record<string, any>;
    const commandID = String(result.commandId ?? "");
    if (!commandID) return null;
    return {
      kind: "command_result",
      commandID,
      success: Boolean(result.success),
      error: String(result.error ?? ""),
    };
  }

  if (msg.type === "node" && msg.node) {
    const nodeMsg = msg.node as Record<string, any>;
    const nodeId = String(nodeMsg.nodeId ?? "");
    if (!nodeId) return null;

    const latestRaw: Record<string, Record<string, any>> = {};
    const latestList = (nodeMsg.latest ?? []) as Array<Record<string, any>>;
    for (const sample of latestList) {
      const category = String(sample.category ?? "");
      if (!category) continue;
      latestRaw[category] = sample;
    }

    return {
      kind: "node",
      nodeId,
      connected: Boolean(nodeMsg.connected),
      lastSeenUnixNano: toBigIntNs(nodeMsg.lastSeenUnixNano),
      sourceIP: String(nodeMsg.sourceIp ?? ""),
      registration: (nodeMsg.registration ?? null) as Record<string, any> | null,
      latestRaw,
    };
  }

  if (msg.type !== "metric" || !msg.metric?.sample) {
    return null;
  }

  const timed = msg.metric as Record<string, any>;
  const sample = timed.sample as Record<string, any>;
  const nodeId = String(timed.nodeId ?? "");
  const category = String(sample.category ?? "");
  const atNs = toBigIntNs(sample.atUnixNano);
  if (!nodeId || !category || atNs <= 0n) {
    return null;
  }

  const minIntervalMs = category === "process" ? options.processMinSampleIntervalMs : options.minSampleIntervalMs;
  const filteredSample = filterSampleByMinInterval(
    nodeId,
    category,
    sample,
    atNs,
    minIntervalMs,
    options.lastAcceptedByPoint,
  );
  if (!filteredSample) return null;

  return {
    kind: "metric",
    nodeId,
    category,
    atNs,
    sample: filteredSample,
  };
}
