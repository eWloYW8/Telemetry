//go:build linux && amd64 && cgo

package gpu

import (
	"fmt"
	"sync"
	"time"

	"github.com/NVIDIA/go-nvml/pkg/nvml"
)

type lockClockState struct {
	SMMinMHz  uint32
	SMMaxMHz  uint32
	MemMinMHz uint32
	MemMaxMHz uint32
}

type Collector struct {
	enabled bool
	devices []nvml.Device
	static  []StaticInfo

	mu         sync.RWMutex
	lockStates map[int]lockClockState
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
		enabled:    true,
		devices:    make([]nvml.Device, 0, count),
		static:     make([]StaticInfo, 0, count),
		lockStates: make(map[int]lockClockState, count),
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
		smMin, smMax := getClockRange(dev, nvml.CLOCK_SM)
		memMin, memMax := getClockRange(dev, nvml.CLOCK_MEM)
		smCur, _ := nvml.DeviceGetClockInfo(dev, nvml.CLOCK_SM)
		memCur, _ := nvml.DeviceGetClockInfo(dev, nvml.CLOCK_MEM)
		smNowMin, smNowMax := getClockTarget(deviceClockGetter{dev, nvml.CLOCK_SM}, smCur)
		memNowMin, memNowMax := getClockTarget(deviceClockGetter{dev, nvml.CLOCK_MEM}, memCur)
		collector.static = append(collector.static, StaticInfo{
			Index:             i,
			Name:              name,
			UUID:              uuid,
			MemoryTotalBytes:  mem.Total,
			PowerMinMilliWatt: minP,
			PowerMaxMilliWatt: maxP,
			SMClockMinMHz:     smMin,
			SMClockMaxMHz:     smMax,
			MemClockMinMHz:    memMin,
			MemClockMaxMHz:    memMax,
		})
		collector.lockStates[i] = lockClockState{
			SMMinMHz:  smNowMin,
			SMMaxMHz:  smNowMax,
			MemMinMHz: memNowMin,
			MemMaxMHz: memNowMax,
		}
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
		smTargetMin, smTargetMax, memTargetMin, memTargetMax := g.currentLockRange(i, dev, smClock, memClock)
		sampledAt := time.Now().UnixNano()

		out.Devices = append(out.Devices, DeviceFastMetrics{
			Index:            i,
			UtilizationGPU:   util.Gpu,
			UtilizationMem:   util.Memory,
			MemoryUsedBytes:  memory.Used,
			TemperatureC:     temp,
			PowerUsageMilliW: power,
			GraphicsClockMHz: smClock,
			MemoryClockMHz:   memClock,
			SMClockMinMHz:    smTargetMin,
			SMClockMaxMHz:    smTargetMax,
			MemClockMinMHz:   memTargetMin,
			MemClockMaxMHz:   memTargetMax,
			PowerLimitMilliW: limit,
			SampledAtNano:    sampledAt,
		})
	}
	return out, nil
}

type deviceClockGetter struct {
	device nvml.Device
	clock  nvml.ClockType
}

func getClockTarget(getter deviceClockGetter, fallbackCurrent uint32) (uint32, uint32) {
	if appClock, ret := nvml.DeviceGetApplicationsClock(getter.device, getter.clock); ret == nvml.SUCCESS && appClock > 0 {
		return appClock, appClock
	}
	if fallbackCurrent > 0 {
		return fallbackCurrent, fallbackCurrent
	}
	return 0, 0
}

func (g *Collector) currentLockRange(index int, device nvml.Device, smCurrentMHz, memCurrentMHz uint32) (uint32, uint32, uint32, uint32) {
	g.mu.RLock()
	state, ok := g.lockStates[index]
	g.mu.RUnlock()
	if ok && (state.SMMinMHz > 0 || state.SMMaxMHz > 0 || state.MemMinMHz > 0 || state.MemMaxMHz > 0) {
		return state.SMMinMHz, state.SMMaxMHz, state.MemMinMHz, state.MemMaxMHz
	}

	smMin, smMax := getClockTarget(deviceClockGetter{device, nvml.CLOCK_SM}, smCurrentMHz)
	memMin, memMax := getClockTarget(deviceClockGetter{device, nvml.CLOCK_MEM}, memCurrentMHz)

	g.mu.Lock()
	g.lockStates[index] = lockClockState{
		SMMinMHz:  smMin,
		SMMaxMHz:  smMax,
		MemMinMHz: memMin,
		MemMaxMHz: memMax,
	}
	g.mu.Unlock()

	return smMin, smMax, memMin, memMax
}

func (g *Collector) updateLockRange(index int, smMinMHz, smMaxMHz, memMinMHz, memMaxMHz uint32) {
	if g == nil {
		return
	}
	g.mu.Lock()
	defer g.mu.Unlock()
	state := g.lockStates[index]
	if smMinMHz > 0 || smMaxMHz > 0 {
		state.SMMinMHz = smMinMHz
		state.SMMaxMHz = smMaxMHz
	}
	if memMinMHz > 0 || memMaxMHz > 0 {
		state.MemMinMHz = memMinMHz
		state.MemMaxMHz = memMaxMHz
	}
	g.lockStates[index] = state
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
