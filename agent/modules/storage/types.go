package storage

import "telemetry/api"

const Category api.MetricCategory = "storage"

type CollectorSpec struct {
	Category string
	Interval string
}

type Registration struct {
	Collectors []CollectorSpec
}

type DiskMetrics struct {
	Name         string
	Mountpoint   string
	Filesystem   string
	TotalBytes   uint64
	UsedBytes    uint64
	FreeBytes    uint64
	ReadSectors  uint64
	WriteSectors uint64
	ReadIOs      uint64
	WriteIOs     uint64
}

type Metrics struct {
	Disks []DiskMetrics
}
