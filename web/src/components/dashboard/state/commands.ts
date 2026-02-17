import { telemetry as telemetryProto } from "@/lib/proto/telemetry";

let commandSeq = 0;

export function nextCommandID(nodeId: string): string {
  commandSeq += 1;
  return `${nodeId}-${Date.now()}-${commandSeq}`;
}

export function buildProtoCommand(
  nodeId: string,
  commandType: string,
  payload: Record<string, unknown>,
  commandID: string,
) {
  const base = {
    id: commandID,
    nodeId,
    type: commandType,
  };

  switch (commandType) {
    case "cpu_scaling_range":
      return telemetryProto.v1.Command.create({
        ...base,
        cpuScalingRange: telemetryProto.module.cpu.v1.ScalingRangeCommand.create(payload),
      });
    case "cpu_governor":
      return telemetryProto.v1.Command.create({
        ...base,
        cpuGovernor: telemetryProto.module.cpu.v1.GovernorCommand.create(payload),
      });
    case "cpu_uncore_range":
      return telemetryProto.v1.Command.create({
        ...base,
        cpuUncoreRange: telemetryProto.module.cpu.v1.UncoreRangeCommand.create(payload),
      });
    case "cpu_power_cap":
      return telemetryProto.v1.Command.create({
        ...base,
        cpuPowerCap: telemetryProto.module.cpu.v1.PowerCapCommand.create(payload),
      });
    case "gpu_clock_range":
      return telemetryProto.v1.Command.create({
        ...base,
        gpuClockRange: telemetryProto.module.gpu.v1.ClockRangeCommand.create(payload),
      });
    case "gpu_power_cap":
      return telemetryProto.v1.Command.create({
        ...base,
        gpuPowerCap: telemetryProto.module.gpu.v1.PowerCapCommand.create(payload),
      });
    case "process_signal":
      return telemetryProto.v1.Command.create({
        ...base,
        processSignal: telemetryProto.module.process.v1.SignalCommand.create(payload),
      });
    default:
      throw new Error(`unsupported command type: ${commandType}`);
  }
}
