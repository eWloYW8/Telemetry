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
		smMinRaw, smMaxRaw := getClockRange(dev, nvml.CLOCK_SM)
		smGraphicsMin, smGraphicsMax := getClockRange(dev, nvml.CLOCK_GRAPHICS)
		smMin, smMax := pickPreferredRange(smMinRaw, smMaxRaw, smGraphicsMin, smGraphicsMax)
		memMin, memMax := getClockRange(dev, nvml.CLOCK_MEM)
		smStateMin, smStateMax := normalizeConfiguredRange(smMin, smMax)
		memStateMin, memStateMax := normalizeConfiguredRange(memMin, memMax)
		if smStateMin > 0 && smStateMax >= smStateMin {
			if ret := nvml.DeviceSetGpuLockedClocks(dev, smStateMin, smStateMax); ret == nvml.SUCCESS {
				smStateMin, smStateMax = normalizeConfiguredRange(smStateMin, smStateMax)
			}
		}
		if memStateMin > 0 && memStateMax >= memStateMin {
			if ret := nvml.DeviceSetMemoryLockedClocks(dev, memStateMin, memStateMax); ret == nvml.SUCCESS {
				memStateMin, memStateMax = normalizeConfiguredRange(memStateMin, memStateMax)
			}
		}
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
			SMMinMHz:  smStateMin,
			SMMaxMHz:  smStateMax,
			MemMinMHz: memStateMin,
			MemMaxMHz: memStateMax,
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
		smTargetMin, smTargetMax, memTargetMin, memTargetMax := g.currentLockRange(i, dev)
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

func normalizeConfiguredRange(minMHz, maxMHz uint32) (uint32, uint32) {
	switch {
	case minMHz > 0 && maxMHz > 0:
		if minMHz > maxMHz {
			return maxMHz, minMHz
		}
		return minMHz, maxMHz
	case minMHz > 0:
		return minMHz, minMHz
	case maxMHz > 0:
		return 0, maxMHz
	default:
		return 0, 0
	}
}

func pickPreferredRange(primaryMin, primaryMax, fallbackMin, fallbackMax uint32) (uint32, uint32) {
	primaryValid := primaryMin > 0 && primaryMax > primaryMin
	fallbackValid := fallbackMin > 0 && fallbackMax > fallbackMin
	switch {
	case primaryValid && !fallbackValid:
		return primaryMin, primaryMax
	case !primaryValid && fallbackValid:
		return fallbackMin, fallbackMax
	case primaryValid && fallbackValid:
		if fallbackMax-fallbackMin > primaryMax-primaryMin {
			return fallbackMin, fallbackMax
		}
		return primaryMin, primaryMax
	case primaryMax > 0:
		return primaryMin, primaryMax
	default:
		return fallbackMin, fallbackMax
	}
}

func (g *Collector) staticLockRange(index int, dev nvml.Device) (uint32, uint32, uint32, uint32) {
	var smMinRaw, smMaxRaw uint32
	var memMinRaw, memMaxRaw uint32

	if index >= 0 && index < len(g.static) {
		smMinRaw = g.static[index].SMClockMinMHz
		smMaxRaw = g.static[index].SMClockMaxMHz
		memMinRaw = g.static[index].MemClockMinMHz
		memMaxRaw = g.static[index].MemClockMaxMHz
	}

	if smMaxRaw == 0 {
		minSM, maxSM := getClockRange(dev, nvml.CLOCK_SM)
		minGraphics, maxGraphics := getClockRange(dev, nvml.CLOCK_GRAPHICS)
		min, max := pickPreferredRange(minSM, maxSM, minGraphics, maxGraphics)
		if smMinRaw == 0 {
			smMinRaw = min
		}
		if smMaxRaw == 0 {
			smMaxRaw = max
		}
	}
	if memMaxRaw == 0 {
		min, max := getClockRange(dev, nvml.CLOCK_MEM)
		if memMinRaw == 0 {
			memMinRaw = min
		}
		if memMaxRaw == 0 {
			memMaxRaw = max
		}
	}

	smMin, smMax := normalizeConfiguredRange(smMinRaw, smMaxRaw)
	memMin, memMax := normalizeConfiguredRange(memMinRaw, memMaxRaw)
	return smMin, smMax, memMin, memMax
}

func (g *Collector) currentLockRange(index int, device nvml.Device) (uint32, uint32, uint32, uint32) {
	g.mu.RLock()
	state, ok := g.lockStates[index]
	g.mu.RUnlock()
	if ok && (state.SMMinMHz > 0 || state.SMMaxMHz > 0 || state.MemMinMHz > 0 || state.MemMaxMHz > 0) {
		smMin, smMax := normalizeConfiguredRange(state.SMMinMHz, state.SMMaxMHz)
		memMin, memMax := normalizeConfiguredRange(state.MemMinMHz, state.MemMaxMHz)
		return smMin, smMax, memMin, memMax
	}

	smMin, smMax, memMin, memMax := g.staticLockRange(index, device)
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
		smMin, smMax := normalizeConfiguredRange(smMinMHz, smMaxMHz)
		state.SMMinMHz = smMin
		state.SMMaxMHz = smMax
	}
	if memMinMHz > 0 || memMaxMHz > 0 {
		memMin, memMax := normalizeConfiguredRange(memMinMHz, memMaxMHz)
		state.MemMinMHz = memMin
		state.MemMaxMHz = memMax
	}
	g.lockStates[index] = state
}

func getClockRange(device nvml.Device, t nvml.ClockType) (uint32, uint32) {
	pstates, ret := nvml.DeviceGetSupportedPerformanceStates(device)
	if ret == nvml.SUCCESS && len(pstates) > 0 {
		var minClock, maxClock uint32
		for _, pstate := range pstates {
			minP, maxP, pRet := nvml.DeviceGetMinMaxClockOfPState(device, t, pstate)
			if pRet != nvml.SUCCESS || maxP == 0 {
				continue
			}
			if minP > 0 && (minClock == 0 || minP < minClock) {
				minClock = minP
			}
			if maxP > maxClock {
				maxClock = maxP
			}
		}
		if maxClock > 0 {
			return minClock, maxClock
		}
	}

	minClock, maxClock, ret := nvml.DeviceGetMinMaxClockOfPState(device, t, nvml.PSTATE_0)
	if ret == nvml.SUCCESS && maxClock > 0 {
		return minClock, maxClock
	}
	maxClock, ret = nvml.DeviceGetMaxClockInfo(device, t)
	if ret == nvml.SUCCESS {
		return 0, maxClock
	}
	return 0, 0
}
