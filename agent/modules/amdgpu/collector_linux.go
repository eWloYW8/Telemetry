//go:build linux

package amdgpu

import (
	"fmt"
	"path/filepath"
	"sync"
	"time"
)

type lockClockState struct {
	SMMinMHz  uint32
	SMMaxMHz  uint32
	MemMinMHz uint32
	MemMaxMHz uint32
}

type Collector struct {
	enabled bool
	devices []*deviceInfo
	static  []StaticInfo

	mu         sync.RWMutex
	lockStates map[int]lockClockState
}

func NewCollector() (*Collector, error) {
	devices, err := discoverDevices()
	if err != nil {
		return &Collector{enabled: false}, err
	}
	if len(devices) == 0 {
		return &Collector{enabled: false}, nil
	}

	collector := &Collector{
		enabled:    true,
		devices:    devices,
		static:     make([]StaticInfo, 0, len(devices)),
		lockStates: make(map[int]lockClockState, len(devices)),
	}
	for _, dev := range devices {
		smMin, smMax := dpmRange(dev.sclkDPM)
		memMin, memMax := dpmRange(dev.mclkDPM)
		collector.static = append(collector.static, StaticInfo{
			Index:             dev.index,
			Name:              dev.name,
			UUID:              dev.pciAddr,
			MemoryTotalBytes:  dev.vramTotalBytes,
			PowerMinMilliWatt: uint32(dev.powerMinUw / 1_000),
			PowerMaxMilliWatt: uint32(dev.powerMaxUw / 1_000),
			SMClockMinMHz:     smMin,
			SMClockMaxMHz:     smMax,
			MemClockMinMHz:    memMin,
			MemClockMaxMHz:    memMax,
		})
		collector.lockStates[dev.index] = lockClockState{
			SMMinMHz:  smMin,
			SMMaxMHz:  smMax,
			MemMinMHz: memMin,
			MemMaxMHz: memMax,
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
	for _, dev := range g.devices {
		g.refreshDPMTables(dev)
		metric, err := g.sampleDevice(dev)
		if err != nil {
			continue
		}
		out.Devices = append(out.Devices, metric)
	}
	return out, nil
}

// refreshDPMTables re-reads pp_dpm_{sclk,mclk} and merges any newly observed
// non-zero frequencies into the cached tables. Indices are preserved; a zero
// reading (GFXOFF) does not overwrite a previously known canonical value.
func (g *Collector) refreshDPMTables(dev *deviceInfo) {
	mergeInto := func(current []uint32, raw []uint32) []uint32 {
		if len(raw) == 0 {
			return current
		}
		if len(current) == 0 {
			return append([]uint32(nil), raw...)
		}
		out := append([]uint32(nil), current...)
		for i, v := range raw {
			if i >= len(out) {
				out = append(out, v)
				continue
			}
			if v != 0 {
				out[i] = v
			}
		}
		return out
	}
	g.mu.Lock()
	defer g.mu.Unlock()
	if b, err := readFile(filepath.Join(dev.devPath, "pp_dpm_sclk")); err == nil {
		dev.sclkDPM = mergeInto(dev.sclkDPM, parseDPMTable(string(b)))
	}
	if b, err := readFile(filepath.Join(dev.devPath, "pp_dpm_mclk")); err == nil {
		dev.mclkDPM = mergeInto(dev.mclkDPM, parseDPMTable(string(b)))
	}
}

func (g *Collector) sampleDevice(dev *deviceInfo) (DeviceFastMetrics, error) {
	if dev == nil {
		return DeviceFastMetrics{}, fmt.Errorf("nil device")
	}

	busy, _ := readUint(filepath.Join(dev.devPath, "gpu_busy_percent"))
	vramUsed, _ := readUint(filepath.Join(dev.devPath, "mem_info_vram_used"))

	var memUtil uint32
	if dev.vramTotalBytes > 0 {
		memUtil = uint32(vramUsed * 100 / dev.vramTotalBytes)
	}

	var tempC uint32
	var powerUsageMilliW uint32
	var powerCapMilliW uint32
	var sclkMHz, mclkMHz uint32
	if dev.hwmonPath != "" {
		if v, err := readUint(filepath.Join(dev.hwmonPath, "temp1_input")); err == nil {
			tempC = uint32(v / 1000) // millidegrees C -> degrees C
		}
		if v, err := readUint(filepath.Join(dev.hwmonPath, "power1_average")); err == nil {
			powerUsageMilliW = uint32(v / 1_000) // uW -> mW
		}
		if v, err := readUint(filepath.Join(dev.hwmonPath, "power1_cap")); err == nil {
			powerCapMilliW = uint32(v / 1_000)
		}
		if v, err := readUint(filepath.Join(dev.hwmonPath, "freq1_input")); err == nil {
			sclkMHz = uint32(v / 1_000_000) // Hz -> MHz
		}
		if v, err := readUint(filepath.Join(dev.hwmonPath, "freq2_input")); err == nil {
			mclkMHz = uint32(v / 1_000_000)
		}
	}

	smMin, smMax, memMin, memMax := g.currentLockRange(dev.index, dev)

	return DeviceFastMetrics{
		Index:            dev.index,
		UtilizationGPU:   uint32(busy),
		UtilizationMem:   memUtil,
		MemoryUsedBytes:  vramUsed,
		TemperatureC:     tempC,
		PowerUsageMilliW: powerUsageMilliW,
		GraphicsClockMHz: sclkMHz,
		MemoryClockMHz:   mclkMHz,
		SMClockMinMHz:    smMin,
		SMClockMaxMHz:    smMax,
		MemClockMinMHz:   memMin,
		MemClockMaxMHz:   memMax,
		PowerLimitMilliW: powerCapMilliW,
		SampledAtNano:    time.Now().UnixNano(),
	}, nil
}

func (g *Collector) currentLockRange(index int, _ *deviceInfo) (uint32, uint32, uint32, uint32) {
	g.mu.RLock()
	state := g.lockStates[index]
	g.mu.RUnlock()
	return state.SMMinMHz, state.SMMaxMHz, state.MemMinMHz, state.MemMaxMHz
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

func dpmRange(levels []uint32) (uint32, uint32) {
	var minV, maxV uint32
	for _, v := range levels {
		if v == 0 {
			continue
		}
		if minV == 0 || v < minV {
			minV = v
		}
		if v > maxV {
			maxV = v
		}
	}
	return minV, maxV
}
