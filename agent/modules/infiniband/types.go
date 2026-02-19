package infiniband

import "github.com/eWloYW8/Telemetry/api"

const Category api.MetricCategory = "infiniband"

type CollectorSpec struct {
	Category string
	Interval string
}

type Registration struct {
	Collectors []CollectorSpec
}

type InterfaceMetrics struct {
	Name          string
	Address       string
	OperState     string
	MTU           uint32
	IBDevice      string
	Port          uint32
	Rate          string
	LinkState     string
	PhysicalState string
	RxBytes       uint64
	TxBytes       uint64
	SampledAtNano int64
}

type Metrics struct {
	Interfaces []InterfaceMetrics
}
