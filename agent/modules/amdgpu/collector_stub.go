//go:build !linux

package amdgpu

type Collector struct{}

func NewCollector() (*Collector, error) {
	return &Collector{}, nil
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

func (g *Collector) updateLockRange(_ int, _, _, _, _ uint32) {}
