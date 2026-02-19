package api

import (
	cpupb "github.com/eWloYW8/Telemetry/agent/modules/cpu/pb"
	gpupb "github.com/eWloYW8/Telemetry/agent/modules/gpu/pb"
	infinibandpb "github.com/eWloYW8/Telemetry/agent/modules/infiniband/pb"
	memorypb "github.com/eWloYW8/Telemetry/agent/modules/memory/pb"
	networkpb "github.com/eWloYW8/Telemetry/agent/modules/network/pb"
	processpb "github.com/eWloYW8/Telemetry/agent/modules/process/pb"
	storagepb "github.com/eWloYW8/Telemetry/agent/modules/storage/pb"
	transportpb "github.com/eWloYW8/Telemetry/api/pb"
)

const (
	categoryCPUUltra   = "cpu_ultra_fast"
	categoryCPUMedium  = "cpu_medium"
	categoryGPUFast    = "gpu_fast"
	categoryMemory     = "memory"
	categoryStorage    = "storage"
	categoryNetwork    = "network"
	categoryInfiniBand = "infiniband"
	categoryProcess    = "process"
)

const (
	commandCPUScalingRange = "cpu_scaling_range"
	commandCPUGovernor     = "cpu_governor"
	commandCPUUncoreRange  = "cpu_uncore_range"
	commandCPUPowerCap     = "cpu_power_cap"
	commandGPUClockRange   = "gpu_clock_range"
	commandGPUPowerCap     = "gpu_power_cap"
	commandProcessSignal   = "process_signal"
)

func ToPBAgentMessage(msg *AgentMessage) *transportpb.AgentMessage {
	if msg == nil {
		return nil
	}
	return &transportpb.AgentMessage{
		Kind:         string(msg.Kind),
		Registration: toPBRegistration(msg.Registration),
		Metrics:      toPBMetricsBatch(msg.Metrics),
		Result:       toPBCommandResult(msg.Result),
		Heartbeat:    toPBHeartbeat(msg.Heartbeat),
	}
}

func ToPBRegistration(v *Registration) *transportpb.Registration {
	return toPBRegistration(v)
}

func FromPBRegistration(v *transportpb.Registration) *Registration {
	return fromPBRegistration(v)
}

func ToPBMetricSample(v MetricSample) *transportpb.MetricSample {
	out := &transportpb.MetricSample{
		Category:   string(v.Category),
		AtUnixNano: v.At,
	}
	setPBMetricPayload(out, v.Payload)
	return out
}

func FromPBMetricSample(v *transportpb.MetricSample) MetricSample {
	if v == nil {
		return MetricSample{}
	}
	return MetricSample{
		Category: MetricCategory(v.GetCategory()),
		At:       v.GetAtUnixNano(),
		Payload:  fromPBMetricPayload(v),
	}
}

func ToPBCommand(v *Command) *transportpb.Command {
	return toPBCommand(v)
}

func FromPBCommand(v *transportpb.Command) *Command {
	return fromPBCommand(v)
}

func ToPBCommandResult(v *CommandResult) *transportpb.CommandResult {
	return toPBCommandResult(v)
}

func FromPBCommandResult(v *transportpb.CommandResult) *CommandResult {
	return fromPBCommandResult(v)
}

func FromPBAgentMessage(msg *transportpb.AgentMessage) *AgentMessage {
	if msg == nil {
		return nil
	}
	return &AgentMessage{
		Kind:         MessageKind(msg.GetKind()),
		Registration: fromPBRegistration(msg.GetRegistration()),
		Metrics:      fromPBMetricsBatch(msg.GetMetrics()),
		Result:       fromPBCommandResult(msg.GetResult()),
		Heartbeat:    fromPBHeartbeat(msg.GetHeartbeat()),
	}
}

func ToPBServerMessage(msg *ServerMessage) *transportpb.ServerMessage {
	if msg == nil {
		return nil
	}
	return &transportpb.ServerMessage{
		Kind:    string(msg.Kind),
		Command: toPBCommand(msg.Command),
		Ack:     toPBServerAck(msg.Ack),
	}
}

func FromPBServerMessage(msg *transportpb.ServerMessage) *ServerMessage {
	if msg == nil {
		return nil
	}
	return &ServerMessage{
		Kind:    MessageKind(msg.GetKind()),
		Command: fromPBCommand(msg.GetCommand()),
		Ack:     fromPBServerAck(msg.GetAck()),
	}
}

func toPBRegistration(v *Registration) *transportpb.Registration {
	if v == nil {
		return nil
	}
	modules := make([]*transportpb.ModuleRegistration, 0, len(v.Modules))
	for name, payload := range v.Modules {
		if module := toPBModuleRegistration(name, payload); module != nil {
			modules = append(modules, module)
		}
	}
	return &transportpb.Registration{
		NodeId:     v.NodeID,
		Basic:      toPBBasicInfo(v.Basic),
		Modules:    modules,
		AtUnixNano: v.At,
	}
}

func fromPBRegistration(v *transportpb.Registration) *Registration {
	if v == nil {
		return nil
	}
	modules := make(map[string]any, len(v.GetModules()))
	for _, module := range v.GetModules() {
		if module == nil {
			continue
		}
		name, payload := fromPBModuleRegistration(module)
		if name == "" || payload == nil {
			continue
		}
		modules[name] = payload
	}
	return &Registration{
		NodeID:  v.GetNodeId(),
		Basic:   fromPBBasicInfo(v.GetBasic()),
		Modules: modules,
		At:      v.GetAtUnixNano(),
	}
}

func toPBModuleRegistration(name string, payload any) *transportpb.ModuleRegistration {
	switch name {
	case "cpu":
		if v, ok := decodeAs[cpupb.ModuleRegistration](payload); ok {
			return &transportpb.ModuleRegistration{Name: name, Metadata: &transportpb.ModuleRegistration_Cpu{Cpu: v}}
		}
	case "gpu":
		if v, ok := decodeAs[gpupb.ModuleRegistration](payload); ok {
			return &transportpb.ModuleRegistration{Name: name, Metadata: &transportpb.ModuleRegistration_Gpu{Gpu: v}}
		}
	case "memory":
		if v, ok := decodeAs[memorypb.ModuleRegistration](payload); ok {
			return &transportpb.ModuleRegistration{Name: name, Metadata: &transportpb.ModuleRegistration_Memory{Memory: v}}
		}
	case "storage":
		if v, ok := decodeAs[storagepb.ModuleRegistration](payload); ok {
			return &transportpb.ModuleRegistration{Name: name, Metadata: &transportpb.ModuleRegistration_Storage{Storage: v}}
		}
	case "network":
		if v, ok := decodeAs[networkpb.ModuleRegistration](payload); ok {
			return &transportpb.ModuleRegistration{Name: name, Metadata: &transportpb.ModuleRegistration_Network{Network: v}}
		}
	case "infiniband":
		if v, ok := decodeAs[infinibandpb.ModuleRegistration](payload); ok {
			return &transportpb.ModuleRegistration{Name: name, Metadata: &transportpb.ModuleRegistration_Infiniband{Infiniband: v}}
		}
	case "process":
		if v, ok := decodeAs[processpb.ModuleRegistration](payload); ok {
			return &transportpb.ModuleRegistration{Name: name, Metadata: &transportpb.ModuleRegistration_Process{Process: v}}
		}
	}
	return nil
}

func fromPBModuleRegistration(v *transportpb.ModuleRegistration) (string, any) {
	if v == nil {
		return "", nil
	}
	switch payload := v.Metadata.(type) {
	case *transportpb.ModuleRegistration_Cpu:
		return v.GetName(), payload.Cpu
	case *transportpb.ModuleRegistration_Gpu:
		return v.GetName(), payload.Gpu
	case *transportpb.ModuleRegistration_Memory:
		return v.GetName(), payload.Memory
	case *transportpb.ModuleRegistration_Storage:
		return v.GetName(), payload.Storage
	case *transportpb.ModuleRegistration_Network:
		return v.GetName(), payload.Network
	case *transportpb.ModuleRegistration_Infiniband:
		return v.GetName(), payload.Infiniband
	case *transportpb.ModuleRegistration_Process:
		return v.GetName(), payload.Process
	default:
		return "", nil
	}
}

func toPBBasicInfo(v BasicInfo) *transportpb.BasicInfo {
	return &transportpb.BasicInfo{
		Hostname:       v.Hostname,
		Ips:            append([]string(nil), v.IPs...),
		Os:             v.OS,
		Kernel:         v.Kernel,
		Arch:           v.Arch,
		MachineId:      v.MachineID,
		BootId:         v.BootID,
		HardwareModel:  v.HardwareModel,
		HardwareVendor: v.HardwareVendor,
	}
}

func fromPBBasicInfo(v *transportpb.BasicInfo) BasicInfo {
	if v == nil {
		return BasicInfo{}
	}
	return BasicInfo{
		Hostname:       v.GetHostname(),
		IPs:            append([]string(nil), v.GetIps()...),
		OS:             v.GetOs(),
		Kernel:         v.GetKernel(),
		Arch:           v.GetArch(),
		MachineID:      v.GetMachineId(),
		BootID:         v.GetBootId(),
		HardwareModel:  v.GetHardwareModel(),
		HardwareVendor: v.GetHardwareVendor(),
	}
}

func toPBHeartbeat(v *Heartbeat) *transportpb.Heartbeat {
	if v == nil {
		return nil
	}
	return &transportpb.Heartbeat{NodeId: v.NodeID, AtUnixNano: v.At}
}

func fromPBHeartbeat(v *transportpb.Heartbeat) *Heartbeat {
	if v == nil {
		return nil
	}
	return &Heartbeat{NodeID: v.GetNodeId(), At: v.GetAtUnixNano()}
}

func toPBMetricsBatch(v *MetricsBatch) *transportpb.MetricsBatch {
	if v == nil {
		return nil
	}
	samples := make([]*transportpb.MetricSample, 0, len(v.Samples))
	for _, s := range v.Samples {
		out := &transportpb.MetricSample{Category: string(s.Category), AtUnixNano: s.At}
		setPBMetricPayload(out, s.Payload)
		samples = append(samples, out)
	}
	return &transportpb.MetricsBatch{NodeId: v.NodeID, Samples: samples, SentAtUnixNano: v.SentAt}
}

func fromPBMetricsBatch(v *transportpb.MetricsBatch) *MetricsBatch {
	if v == nil {
		return nil
	}
	samples := make([]MetricSample, 0, len(v.GetSamples()))
	for _, s := range v.GetSamples() {
		if s == nil {
			continue
		}
		samples = append(samples, MetricSample{
			Category: MetricCategory(s.GetCategory()),
			At:       s.GetAtUnixNano(),
			Payload:  fromPBMetricPayload(s),
		})
	}
	return &MetricsBatch{NodeID: v.GetNodeId(), Samples: samples, SentAt: v.GetSentAtUnixNano()}
}

func setPBMetricPayload(out *transportpb.MetricSample, payload any) {
	if out == nil {
		return
	}
	switch out.GetCategory() {
	case categoryCPUUltra:
		if v, ok := decodeAs[cpupb.UltraMetrics](payload); ok {
			out.Payload = &transportpb.MetricSample_CpuUltraMetrics{CpuUltraMetrics: v}
		}
	case categoryCPUMedium:
		if v, ok := decodeAs[cpupb.MediumMetrics](payload); ok {
			out.Payload = &transportpb.MetricSample_CpuMediumMetrics{CpuMediumMetrics: v}
		}
	case categoryGPUFast:
		if v, ok := decodeAs[gpupb.FastMetrics](payload); ok {
			out.Payload = &transportpb.MetricSample_GpuFastMetrics{GpuFastMetrics: v}
		}
	case categoryMemory:
		if v, ok := decodeAs[memorypb.Metrics](payload); ok {
			out.Payload = &transportpb.MetricSample_MemoryMetrics{MemoryMetrics: v}
		}
	case categoryStorage:
		if v, ok := decodeAs[storagepb.Metrics](payload); ok {
			out.Payload = &transportpb.MetricSample_StorageMetrics{StorageMetrics: v}
		}
	case categoryNetwork:
		if v, ok := decodeAs[networkpb.Metrics](payload); ok {
			out.Payload = &transportpb.MetricSample_NetworkMetrics{NetworkMetrics: v}
		}
	case categoryInfiniBand:
		if v, ok := decodeAs[infinibandpb.Metrics](payload); ok {
			out.Payload = &transportpb.MetricSample_InfinibandMetrics{InfinibandMetrics: v}
		}
	case categoryProcess:
		if v, ok := decodeAs[processpb.Metrics](payload); ok {
			out.Payload = &transportpb.MetricSample_ProcessMetrics{ProcessMetrics: v}
		}
	}
}

func fromPBMetricPayload(v *transportpb.MetricSample) any {
	if v == nil {
		return nil
	}
	switch payload := v.Payload.(type) {
	case *transportpb.MetricSample_CpuUltraMetrics:
		return payload.CpuUltraMetrics
	case *transportpb.MetricSample_CpuMediumMetrics:
		return payload.CpuMediumMetrics
	case *transportpb.MetricSample_GpuFastMetrics:
		return payload.GpuFastMetrics
	case *transportpb.MetricSample_MemoryMetrics:
		return payload.MemoryMetrics
	case *transportpb.MetricSample_StorageMetrics:
		return payload.StorageMetrics
	case *transportpb.MetricSample_NetworkMetrics:
		return payload.NetworkMetrics
	case *transportpb.MetricSample_InfinibandMetrics:
		return payload.InfinibandMetrics
	case *transportpb.MetricSample_ProcessMetrics:
		return payload.ProcessMetrics
	default:
		return nil
	}
}

func toPBCommand(v *Command) *transportpb.Command {
	if v == nil {
		return nil
	}
	out := &transportpb.Command{Id: v.ID, NodeId: v.NodeID, Type: string(v.Type), IssuedAtUnixNano: v.IssuedAt}
	switch out.GetType() {
	case commandCPUScalingRange:
		if payload, ok := decodeAs[cpupb.ScalingRangeCommand](v.Payload); ok {
			out.Payload = &transportpb.Command_CpuScalingRange{CpuScalingRange: payload}
		}
	case commandCPUGovernor:
		if payload, ok := decodeAs[cpupb.GovernorCommand](v.Payload); ok {
			out.Payload = &transportpb.Command_CpuGovernor{CpuGovernor: payload}
		}
	case commandCPUUncoreRange:
		if payload, ok := decodeAs[cpupb.UncoreRangeCommand](v.Payload); ok {
			out.Payload = &transportpb.Command_CpuUncoreRange{CpuUncoreRange: payload}
		}
	case commandCPUPowerCap:
		if payload, ok := decodeAs[cpupb.PowerCapCommand](v.Payload); ok {
			out.Payload = &transportpb.Command_CpuPowerCap{CpuPowerCap: payload}
		}
	case commandGPUClockRange:
		if payload, ok := decodeAs[gpupb.ClockRangeCommand](v.Payload); ok {
			out.Payload = &transportpb.Command_GpuClockRange{GpuClockRange: payload}
		}
	case commandGPUPowerCap:
		if payload, ok := decodeAs[gpupb.PowerCapCommand](v.Payload); ok {
			out.Payload = &transportpb.Command_GpuPowerCap{GpuPowerCap: payload}
		}
	case commandProcessSignal:
		if payload, ok := decodeAs[processpb.SignalCommand](v.Payload); ok {
			out.Payload = &transportpb.Command_ProcessSignal{ProcessSignal: payload}
		}
	}
	return out
}

func fromPBCommand(v *transportpb.Command) *Command {
	if v == nil {
		return nil
	}
	out := &Command{ID: v.GetId(), NodeID: v.GetNodeId(), Type: CommandType(v.GetType()), IssuedAt: v.GetIssuedAtUnixNano()}
	switch payload := v.Payload.(type) {
	case *transportpb.Command_CpuScalingRange:
		out.Payload = payload.CpuScalingRange
	case *transportpb.Command_CpuGovernor:
		out.Payload = payload.CpuGovernor
	case *transportpb.Command_CpuUncoreRange:
		out.Payload = payload.CpuUncoreRange
	case *transportpb.Command_CpuPowerCap:
		out.Payload = payload.CpuPowerCap
	case *transportpb.Command_GpuClockRange:
		out.Payload = payload.GpuClockRange
	case *transportpb.Command_GpuPowerCap:
		out.Payload = payload.GpuPowerCap
	case *transportpb.Command_ProcessSignal:
		out.Payload = payload.ProcessSignal
	}
	return out
}

func toPBCommandResult(v *CommandResult) *transportpb.CommandResult {
	if v == nil {
		return nil
	}
	return &transportpb.CommandResult{
		CommandId:          v.CommandID,
		NodeId:             v.NodeID,
		Type:               string(v.Type),
		Success:            v.Success,
		Error:              v.Error,
		FinishedAtUnixNano: v.FinishedAt,
	}
}

func fromPBCommandResult(v *transportpb.CommandResult) *CommandResult {
	if v == nil {
		return nil
	}
	return &CommandResult{
		CommandID:  v.GetCommandId(),
		NodeID:     v.GetNodeId(),
		Type:       CommandType(v.GetType()),
		Success:    v.GetSuccess(),
		Error:      v.GetError(),
		FinishedAt: v.GetFinishedAtUnixNano(),
	}
}

func toPBServerAck(v *ServerAck) *transportpb.ServerAck {
	if v == nil {
		return nil
	}
	return &transportpb.ServerAck{NodeId: v.NodeID, AtUnixNano: v.At}
}

func fromPBServerAck(v *transportpb.ServerAck) *ServerAck {
	if v == nil {
		return nil
	}
	return &ServerAck{NodeID: v.GetNodeId(), At: v.GetAtUnixNano()}
}

func decodeAs[T any](in any) (*T, bool) {
	if in == nil {
		return nil, false
	}
	if v, ok := in.(T); ok {
		out := v
		return &out, true
	}
	if v, ok := in.(*T); ok && v != nil {
		return v, true
	}
	return nil, false
}
