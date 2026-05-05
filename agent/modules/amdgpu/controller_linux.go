//go:build linux

package amdgpu

import (
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
)

type Controller struct {
	collector *Collector
}

func NewController(collector *Collector) *Controller {
	return &Controller{collector: collector}
}

func (c *Controller) SetClockRange(gpuIndex int, smMinMHz, smMaxMHz, memMinMHz, memMaxMHz uint32) error {
	if c == nil || c.collector == nil || !c.collector.enabled {
		return fmt.Errorf("amdgpu is not available")
	}
	if gpuIndex < 0 || gpuIndex >= len(c.collector.devices) {
		return fmt.Errorf("invalid gpu index %d", gpuIndex)
	}
	dev := c.collector.devices[gpuIndex]

	sclkFull := dpmCoversFullRange(dev.sclkDPM, smMinMHz, smMaxMHz)
	mclkFull := dpmCoversFullRange(dev.mclkDPM, memMinMHz, memMaxMHz)
	wantManual := !(sclkFull && mclkFull)

	perfLevelPath := filepath.Join(dev.devPath, "power_dpm_force_performance_level")

	if !wantManual {
		if err := writeString(perfLevelPath, "auto"); err != nil {
			return fmt.Errorf("set performance level auto: %w", err)
		}
		c.collector.updateLockRange(gpuIndex,
			minOf(dev.sclkDPM), maxOf(dev.sclkDPM),
			minOf(dev.mclkDPM), maxOf(dev.mclkDPM))
		return nil
	}

	if err := writeString(perfLevelPath, "manual"); err != nil {
		return fmt.Errorf("set performance level manual: %w", err)
	}

	var errs []string
	var effSMMin, effSMMax, effMemMin, effMemMax uint32

	if len(dev.sclkDPM) > 0 && (smMinMHz > 0 || smMaxMHz > 0) {
		mask, lo, hi := levelsInRange(dev.sclkDPM, smMinMHz, smMaxMHz)
		if len(mask) > 0 {
			if err := writeString(filepath.Join(dev.devPath, "pp_dpm_sclk"), mask); err != nil {
				errs = append(errs, fmt.Sprintf("set sclk mask: %s", err))
			} else {
				effSMMin, effSMMax = lo, hi
			}
		}
	}
	if len(dev.mclkDPM) > 0 && (memMinMHz > 0 || memMaxMHz > 0) {
		mask, lo, hi := levelsInRange(dev.mclkDPM, memMinMHz, memMaxMHz)
		if len(mask) > 0 {
			if err := writeString(filepath.Join(dev.devPath, "pp_dpm_mclk"), mask); err != nil {
				errs = append(errs, fmt.Sprintf("set mclk mask: %s", err))
			} else {
				effMemMin, effMemMax = lo, hi
			}
		}
	}

	c.collector.updateLockRange(gpuIndex, effSMMin, effSMMax, effMemMin, effMemMax)

	if len(errs) > 0 {
		return fmt.Errorf("%s", strings.Join(errs, "; "))
	}
	return nil
}

func (c *Controller) SetPowerCap(gpuIndex int, milliWatt uint32) error {
	if c == nil || c.collector == nil || !c.collector.enabled {
		return fmt.Errorf("amdgpu is not available")
	}
	if gpuIndex < 0 || gpuIndex >= len(c.collector.devices) {
		return fmt.Errorf("invalid gpu index %d", gpuIndex)
	}
	dev := c.collector.devices[gpuIndex]
	if dev.hwmonPath == "" {
		return fmt.Errorf("hwmon path not found for gpu %d", gpuIndex)
	}

	target := uint64(milliWatt) * 1_000 // mW -> uW
	if dev.powerMinUw > 0 && target < dev.powerMinUw {
		target = dev.powerMinUw
	}
	if dev.powerMaxUw > 0 && target > dev.powerMaxUw {
		target = dev.powerMaxUw
	}
	path := filepath.Join(dev.hwmonPath, "power1_cap")
	if err := writeString(path, strconv.FormatUint(target, 10)); err != nil {
		return fmt.Errorf("write %s: %w", path, err)
	}
	return nil
}

// levelsInRange returns a space-separated list of DPM level indices whose
// frequency falls within [minMHz, maxMHz]. If no level fits, it falls back
// to the single level whose frequency is closest to minMHz.
// Returns the written mask plus the effective [lo, hi] in MHz for bookkeeping.
func levelsInRange(dpm []uint32, minMHz, maxMHz uint32) (string, uint32, uint32) {
	if len(dpm) == 0 {
		return "", 0, 0
	}
	if maxMHz == 0 {
		maxMHz = dpm[len(dpm)-1]
	}
	if minMHz > maxMHz {
		minMHz, maxMHz = maxMHz, minMHz
	}

	var selected []int
	var lo, hi uint32
	for i, f := range dpm {
		if f == 0 {
			continue // unknown frequency (GPU in GFXOFF when sampled)
		}
		if f >= minMHz && f <= maxMHz {
			selected = append(selected, i)
			if lo == 0 || f < lo {
				lo = f
			}
			if f > hi {
				hi = f
			}
		}
	}
	if len(selected) == 0 {
		closest := -1
		var bestDiff uint32
		for i, f := range dpm {
			if f == 0 {
				continue
			}
			d := diff(f, minMHz)
			if closest < 0 || d < bestDiff {
				bestDiff = d
				closest = i
			}
		}
		if closest < 0 {
			return "", 0, 0
		}
		selected = []int{closest}
		lo, hi = dpm[closest], dpm[closest]
	}

	parts := make([]string, 0, len(selected))
	for _, i := range selected {
		parts = append(parts, strconv.Itoa(i))
	}
	return strings.Join(parts, " "), lo, hi
}

func dpmCoversFullRange(dpm []uint32, minMHz, maxMHz uint32) bool {
	if len(dpm) == 0 {
		return true // nothing to constrain
	}
	full_lo, full_hi := minOf(dpm), maxOf(dpm)
	if minMHz == 0 && maxMHz == 0 {
		return true
	}
	lo := minMHz
	hi := maxMHz
	if lo == 0 {
		lo = full_lo
	}
	if hi == 0 {
		hi = full_hi
	}
	return lo <= full_lo && hi >= full_hi
}

func minOf(dpm []uint32) uint32 {
	var m uint32
	for _, v := range dpm {
		if v == 0 {
			continue
		}
		if m == 0 || v < m {
			m = v
		}
	}
	return m
}

func maxOf(dpm []uint32) uint32 {
	var m uint32
	for _, v := range dpm {
		if v > m {
			m = v
		}
	}
	return m
}

func diff(a, b uint32) uint32 {
	if a > b {
		return a - b
	}
	return b - a
}
