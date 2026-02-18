package cpu

import (
	"time"

	"github.com/eWloYW8/Telemetry/config"
)

type Module struct {
	collector  *Collector
	controller *Controller
	intervals  config.ReportConfig
}

const (
	defaultUltraInterval  = 100 * time.Millisecond
	defaultMediumInterval = 1 * time.Second
)

func (m *Module) ultraInterval() time.Duration {
	if m == nil {
		return defaultUltraInterval
	}
	// Keep compatibility with old config key `cpu_fast`.
	return m.intervals.Interval(string(CategoryUltra), m.intervals.Interval("cpu_fast", defaultUltraInterval))
}

func (m *Module) mediumInterval() time.Duration {
	if m == nil {
		return defaultMediumInterval
	}
	return m.intervals.Interval(string(CategoryMedium), defaultMediumInterval)
}

func New(intervals config.ReportConfig) (*Module, error) {
	static, mappings, err := DiscoverTopology()
	if err != nil {
		return nil, err
	}
	collector := NewCollector(static, mappings, DiscoverPackageTemperatureInputs(mappings))
	module := &Module{
		collector:  collector,
		controller: NewController(collector),
		intervals:  intervals,
	}
	collector.WaitWarmup(module.mediumInterval())
	return module, nil
}

func (m *Module) Registration() any {
	if m == nil || m.collector == nil {
		return nil
	}
	return toPBModuleRegistration(&Registration{
		Static: m.collector.StaticInfo(),
		Collectors: []CollectorSpec{
			{Category: string(CategoryUltra), Interval: m.ultraInterval().String()},
			{Category: string(CategoryMedium), Interval: m.mediumInterval().String()},
		},
		Controllers: []ControllerSpec{
			{Type: string(CommandSetScalingRange)},
			{Type: string(CommandSetGovernor)},
			{Type: string(CommandSetUncoreRange)},
			{Type: string(CommandSetPowerCap)},
		},
		Devices:  m.collector.Devices(),
		Controls: m.collector.PackageControls(),
	})
}

func (m *Module) Name() string {
	return "cpu"
}
