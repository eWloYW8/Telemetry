package cpu

import "telemetry/api"

const (
	CategoryUltra  api.MetricCategory = "cpu_ultra_fast"
	CategoryMedium api.MetricCategory = "cpu_medium"
)

const (
	CommandSetScalingRange api.CommandType = "cpu_scaling_range"
	CommandSetGovernor     api.CommandType = "cpu_governor"
	CommandSetUncoreRange  api.CommandType = "cpu_uncore_range"
	CommandSetPowerCap     api.CommandType = "cpu_power_cap"
)

type StaticInfo struct {
	Vendor              string
	Model               string
	Packages            int
	PhysicalCores       int
	LogicalCores        int
	ThreadsPerCore      int
	CPUInfoMinKHz       uint64
	CPUInfoMaxKHz       uint64
	SupportsIntelUncore bool
	SupportsRAPL        bool
}

type CollectorSpec struct {
	Category string
	Interval string
}

type ControllerSpec struct {
	Type string
}

type Registration struct {
	Static      StaticInfo
	Collectors  []CollectorSpec
	Controllers []ControllerSpec
	Devices     []DeviceInfo
}

type DeviceInfo struct {
	PackageID   int
	Vendor      string
	Model       string
	CoreIDs     []int
	CoreCount   uint32
	ThreadCount uint32
}

type CoreFastMetrics struct {
	CoreID        int
	Utilization   float64
	ScalingCurKHz uint64
	PackageID     int
}

type PackageRAPL struct {
	PackageID      int
	EnergyMicroJ   uint64
	PowerCapMicroW uint64
}

type PackageTemperature struct {
	PackageID int
	MilliC    uint32
}

type MediumMetrics struct {
	Cores        []CoreFastMetrics
	Temperatures []PackageTemperature
}

type PerCoreConfig struct {
	CoreID             int
	ScalingMinKHz      uint64
	ScalingMaxKHz      uint64
	AvailableGovernors []string
	CurrentGovernor    string
	ScalingDriver      string
	PackageID          int
}

type UncoreMetrics struct {
	PackageID     int
	CurrentKHz    uint64
	MinKHz        uint64
	MaxKHz        uint64
	InitialMinKHz uint64
	InitialMaxKHz uint64
}

type UltraMetrics struct {
	PerCore []PerCoreConfig
	RAPL    []PackageRAPL
	Uncore  []UncoreMetrics
}

type ScalingRangeCommand struct {
	MinKHz    uint64
	MaxKHz    uint64
	PackageID *int
}

type GovernorCommand struct {
	Governor  string
	PackageID *int
}

type UncoreRangeCommand struct {
	PackageID int
	MinKHz    uint64
	MaxKHz    uint64
}

type PowerCapCommand struct {
	PackageID int
	MicroWatt uint64
}
