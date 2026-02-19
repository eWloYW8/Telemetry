export type WorkerInboundMessage =
  | {
      type: "decode";
      bytes: ArrayBuffer;
    }
  | {
      type: "set-min-sample-interval";
      minSampleIntervalMs: number;
      processMinSampleIntervalMs: number;
    }
  | {
      type: "reset-filter";
    };

export type WorkerCommandResultEvent = {
  kind: "command_result";
  commandID: string;
  success: boolean;
  error: string;
};

export type WorkerNodeEvent = {
  kind: "node";
  nodeId: string;
  connected: boolean;
  lastSeenUnixNano: bigint;
  sourceIP: string;
  registration: Record<string, any> | null;
  latestRaw: Record<string, Record<string, any>>;
};

export type WorkerMetricEvent = {
  kind: "metric";
  nodeId: string;
  category: string;
  atNs: bigint;
  sample: Record<string, any>;
};

export type WorkerDecodedEvent = WorkerCommandResultEvent | WorkerNodeEvent | WorkerMetricEvent;
