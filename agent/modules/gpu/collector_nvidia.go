//go:build linux && amd64 && cgo

package gpu

import (
	"fmt"

	"github.com/NVIDIA/go-nvml/pkg/nvml"
)

type Collector struct {
	enabled bool
	devices []nvml.Device
	static  []StaticInfo
}

func NewCollector() (*Collector, error) {
	ret := nvml.Init()
	if ret != nvml.SUCCESS {
		return &Collector{enabled: false}, fmt.Errorf("nvml init: %s", ret.Error())
	}

	count, ret := nvml.DeviceGetCount()
	if ret != nvml.SUCCESS {
		return &Collector{enabled: false}, fmt.Errorf("nvml device count: %s", ret.Error())
	}

	collector := &Collector{
		enabled: true,
		devices: make([]nvml.Device, 0, count),
		static:  make([]StaticInfo, 0, count),
	}
	for i := 0; i < count; i++ {
		dev, ret := nvml.DeviceGetHandleByIndex(i)
		if ret != nvml.SUCCESS {
			continue
		}
		collector.devices = append(collector.devices, dev)

		name, _ := nvml.DeviceGetName(dev)
		uuid, _ := nvml.DeviceGetUUID(dev)
		mem, _ := nvml.DeviceGetMemoryInfo(dev)
		minP, maxP, _ := nvml.DeviceGetPowerManagementLimitConstraints(dev)
		collector.static = append(collector.static, StaticInfo{
			Index:             i,
			Name:              name,
			UUID:              uuid,
			MemoryTotalBytes:  mem.Total,
			PowerMinMilliWatt: minP,
			PowerMaxMilliWatt: maxP,
		})
	}

	return collector, nil
}

func (g *Collector) Enabled() bool {
	return g != nil && g.enabled
}

func (g *Collector) StaticInfo() []StaticInfo {
	if g == nil {
		return nil
	}
	out := make([]StaticInfo, len(g.static))
	copy(out, g.static)
	return out
}

func (g *Collector) CollectFast() (*FastMetrics, error) {
	if g == nil || !g.enabled {
		return &FastMetrics{}, nil
	}
	out := &FastMetrics{Devices: make([]DeviceFastMetrics, 0, len(g.devices))}
	for i, dev := range g.devices {
		util, ret := nvml.DeviceGetUtilizationRates(dev)
		if ret != nvml.SUCCESS {
			continue
		}
		memory, _ := nvml.DeviceGetMemoryInfo(dev)
		temp, _ := nvml.DeviceGetTemperature(dev, nvml.TEMPERATURE_GPU)
		power, _ := nvml.DeviceGetPowerUsage(dev)
		smClock, _ := nvml.DeviceGetClockInfo(dev, nvml.CLOCK_SM)
		memClock, _ := nvml.DeviceGetClockInfo(dev, nvml.CLOCK_MEM)
		limit, _ := nvml.DeviceGetPowerManagementLimit(dev)
		smMin, smMax := getClockRange(dev, nvml.CLOCK_SM)
		memMin, memMax := getClockRange(dev, nvml.CLOCK_MEM)

		out.Devices = append(out.Devices, DeviceFastMetrics{
			Index:            i,
			UtilizationGPU:   util.Gpu,
			UtilizationMem:   util.Memory,
			MemoryUsedBytes:  memory.Used,
			TemperatureC:     temp,
			PowerUsageMilliW: power,
			GraphicsClockMHz: smClock,
			MemoryClockMHz:   memClock,
			SMClockMinMHz:    smMin,
			SMClockMaxMHz:    smMax,
			MemClockMinMHz:   memMin,
			MemClockMaxMHz:   memMax,
			PowerLimitMilliW: limit,
		})
	}
	return out, nil
}

func getClockRange(device nvml.Device, t nvml.ClockType) (uint32, uint32) {
	minClock, maxClock, ret := nvml.DeviceGetMinMaxClockOfPState(device, t, nvml.PSTATE_0)
	if ret == nvml.SUCCESS {
		return minClock, maxClock
	}
	maxClock, ret = nvml.DeviceGetMaxClockInfo(device, t)
	if ret == nvml.SUCCESS {
		return 0, maxClock
	}
	return 0, 0
}
