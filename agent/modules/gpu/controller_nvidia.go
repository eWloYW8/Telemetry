//go:build linux && amd64 && cgo

package gpu

import (
	"fmt"
	"strings"

	"github.com/NVIDIA/go-nvml/pkg/nvml"
)

type Controller struct {
	collector *Collector
}

func NewController(collector *Collector) *Controller {
	return &Controller{collector: collector}
}

func (c *Controller) SetClockRange(gpuIndex int, smMinMHz, smMaxMHz, memMinMHz, memMaxMHz uint32) error {
	if c == nil || c.collector == nil || !c.collector.enabled {
		return fmt.Errorf("nvml is not enabled")
	}
	if gpuIndex < 0 || gpuIndex >= len(c.collector.devices) {
		return fmt.Errorf("invalid gpu index %d", gpuIndex)
	}
	dev := c.collector.devices[gpuIndex]
	var errs []string

	if smMinMHz > 0 || smMaxMHz > 0 {
		ret := nvml.DeviceSetGpuLockedClocks(dev, smMinMHz, smMaxMHz)
		if ret != nvml.SUCCESS {
			errs = append(errs, fmt.Sprintf("set gpu locked clocks: %s", ret.Error()))
		} else {
			c.collector.updateLockRange(gpuIndex, smMinMHz, smMaxMHz, 0, 0)
		}
	}
	if memMinMHz > 0 || memMaxMHz > 0 {
		ret := nvml.DeviceSetMemoryLockedClocks(dev, memMinMHz, memMaxMHz)
		if ret != nvml.SUCCESS {
			errs = append(errs, fmt.Sprintf("set memory locked clocks: %s", ret.Error()))
		} else {
			c.collector.updateLockRange(gpuIndex, 0, 0, memMinMHz, memMaxMHz)
		}
	}
	if len(errs) > 0 {
		return fmt.Errorf(strings.Join(errs, "; "))
	}
	return nil
}

func (c *Controller) SetPowerCap(gpuIndex int, milliWatt uint32) error {
	if c == nil || c.collector == nil || !c.collector.enabled {
		return fmt.Errorf("nvml is not enabled")
	}
	if gpuIndex < 0 || gpuIndex >= len(c.collector.devices) {
		return fmt.Errorf("invalid gpu index %d", gpuIndex)
	}
	ret := nvml.DeviceSetPowerManagementLimit(c.collector.devices[gpuIndex], milliWatt)
	if ret != nvml.SUCCESS {
		return fmt.Errorf("set gpu power cap: %s", ret.Error())
	}
	return nil
}
