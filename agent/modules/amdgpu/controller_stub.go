//go:build !linux

package amdgpu

import "fmt"

type Controller struct {
	collector *Collector
}

func NewController(collector *Collector) *Controller {
	return &Controller{collector: collector}
}

func (c *Controller) SetClockRange(_ int, _, _, _, _ uint32) error {
	return fmt.Errorf("amdgpu control is unsupported on this platform")
}

func (c *Controller) SetPowerCap(_ int, _ uint32) error {
	return fmt.Errorf("amdgpu control is unsupported on this platform")
}
