package storage

import "telemetry/api"

const Category api.MetricCategory = "storage"

type CollectorSpec struct {
	Category string
	Interval string
}

type StaticDiskInfo struct {
	Name       string
	Mountpoint string
	Filesystem string
	TotalBytes uint64
}

type Registration struct {
	Collectors  []CollectorSpec
	StaticDisks []StaticDiskInfo
}

type DiskMetrics struct {
	Name          string
	UsedBytes     uint64
	FreeBytes     uint64
	ReadSectors   uint64
	WriteSectors  uint64
	ReadIOs       uint64
	WriteIOs      uint64
	SampledAtNano int64
}

type Metrics struct {
	Disks []DiskMetrics
}
