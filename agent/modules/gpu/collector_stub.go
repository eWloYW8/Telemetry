//go:build !linux || !amd64 || !cgo

package gpu

import (
	"fmt"
)

type Collector struct{}

func NewCollector() (*Collector, error) {
	return &Collector{}, fmt.Errorf("nvml collector only supported on linux/amd64")
}

func (g *Collector) Enabled() bool {
	return false
}

func (g *Collector) StaticInfo() []StaticInfo {
	return nil
}

func (g *Collector) CollectFast() (*FastMetrics, error) {
	return &FastMetrics{}, nil
}
