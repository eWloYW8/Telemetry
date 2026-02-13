//go:build !linux || !amd64 || !cgo

package gpu

import "fmt"

type Controller struct {
	collector *Collector
}

func NewController(collector *Collector) *Controller {
	return &Controller{collector: collector}
}

func (c *Controller) SetClockRange(gpuIndex int, smMinMHz, smMaxMHz, memMinMHz, memMaxMHz uint32) error {
	return fmt.Errorf("gpu clock control is unsupported on this platform")
}

func (c *Controller) SetPowerCap(gpuIndex int, milliWatt uint32) error {
	return fmt.Errorf("gpu power cap control is unsupported on this platform")
}
