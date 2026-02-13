package memory

import "telemetry/api"

const Category api.MetricCategory = "memory"

type CollectorSpec struct {
	Category string
	Interval string
}

type Registration struct {
	Collectors []CollectorSpec
}

type Metrics struct {
	TotalBytes     uint64
	UsedBytes      uint64
	FreeBytes      uint64
	AvailableBytes uint64
	CachedBytes    uint64
	BuffersBytes   uint64
}
