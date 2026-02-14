package memory

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Collector struct{}

func NewCollector() *Collector {
	return &Collector{}
}

func (c *Collector) StaticInfo() StaticInfo {
	total, _ := readMemTotalBytes()
	return StaticInfo{TotalBytes: total}
}

func (c *Collector) Collect() (*Metrics, error) {
	b, err := os.ReadFile("/proc/meminfo")
	if err != nil {
		return nil, err
	}
	var total, free, available, cached, buffers uint64
	for _, line := range strings.Split(string(b), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		v, err := strconv.ParseUint(fields[1], 10, 64)
		if err != nil {
			continue
		}
		bytes := v * 1024
		switch fields[0] {
		case "MemTotal:":
			total = bytes
		case "MemFree:":
			free = bytes
		case "MemAvailable:":
			available = bytes
		case "Cached:":
			cached = bytes
		case "Buffers:":
			buffers = bytes
		}
	}
	used := uint64(0)
	if total > available {
		used = total - available
	}
	return &Metrics{
		UsedBytes:      used,
		FreeBytes:      free,
		AvailableBytes: available,
		CachedBytes:    cached,
		BuffersBytes:   buffers,
		SampledAtNano:  time.Now().UnixNano(),
	}, nil
}

func readMemTotalBytes() (uint64, error) {
	b, err := os.ReadFile("/proc/meminfo")
	if err != nil {
		return 0, err
	}
	for _, line := range strings.Split(string(b), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 || fields[0] != "MemTotal:" {
			continue
		}
		v, err := strconv.ParseUint(fields[1], 10, 64)
		if err != nil {
			return 0, err
		}
		return v * 1024, nil
	}
	return 0, nil
}
