export type TabKey = "cpu" | "gpu" | "memory" | "storage" | "network" | "process";

export type SortDir = "asc" | "desc";
export type ProcessSortKey = "pid" | "ppid" | "user" | "state" | "cpu" | "memory" | "command";

export type RawHistorySample = {
  atNs: bigint;
  sample: Record<string, any>;
};

export type NodeRuntime = {
  nodeId: string;
  connected: boolean;
  lastSeenUnixNano: bigint;
  registration?: Record<string, any> | null;
  latestRaw: Record<string, Record<string, any>>;
};

export type ChartLineDef = {
  key: string;
  label: string;
  color: string;
};

export type CpuCoreDenseRow = {
  packageId: number;
  coreId: number;
  utilPct: number;
  curKHz: number;
  minKHz: number;
  maxKHz: number;
  governor: string;
  driver: string;
  tempC: number;
};

export type ProcessRow = {
  pid: number;
  ppid: number;
  user: string;
  state: string;
  cpu: number;
  memory: number;
  command: string;
};
