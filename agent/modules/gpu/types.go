package gpu

import "telemetry/api"

const (
	CategoryFast api.MetricCategory = "gpu_fast"
)

const (
	CommandSetClockRange api.CommandType = "gpu_clock_range"
	CommandSetPowerCap   api.CommandType = "gpu_power_cap"
)

type StaticInfo struct {
	Index             int
	Name              string
	UUID              string
	MemoryTotalBytes  uint64
	PowerMinMilliWatt uint32
	PowerMaxMilliWatt uint32
	SMClockMinMHz     uint32
	SMClockMaxMHz     uint32
	MemClockMinMHz    uint32
	MemClockMaxMHz    uint32
}

type CollectorSpec struct {
	Category string
	Interval string
}

type ControllerSpec struct {
	Type string
}

type Registration struct {
	Static      []StaticInfo
	Collectors  []CollectorSpec
	Controllers []ControllerSpec
}

type DeviceFastMetrics struct {
	Index            int
	UtilizationGPU   uint32
	UtilizationMem   uint32
	MemoryUsedBytes  uint64
	TemperatureC     uint32
	PowerUsageMilliW uint32
	GraphicsClockMHz uint32
	MemoryClockMHz   uint32
	SMClockMinMHz    uint32
	SMClockMaxMHz    uint32
	MemClockMinMHz   uint32
	MemClockMaxMHz   uint32
	PowerLimitMilliW uint32
	SampledAtNano    int64
}

type FastMetrics struct {
	Devices []DeviceFastMetrics
}

type ClockRangeCommand struct {
	GPUIndex  int
	SMMinMHz  uint32
	SMMaxMHz  uint32
	MemMinMHz uint32
	MemMaxMHz uint32
}

type PowerCapCommand struct {
	GPUIndex  int
	MilliWatt uint32
}
