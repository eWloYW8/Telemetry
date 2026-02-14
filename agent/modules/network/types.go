package network

import "telemetry/api"

const Category api.MetricCategory = "network"

type CollectorSpec struct {
	Category string
	Interval string
}

type Registration struct {
	Collectors []CollectorSpec
}

type InterfaceMetrics struct {
	Name          string
	IPs           []string
	RxBytes       uint64
	RxPackets     uint64
	TxBytes       uint64
	TxPackets     uint64
	SampledAtNano int64
}

type Metrics struct {
	Interfaces []InterfaceMetrics
}
