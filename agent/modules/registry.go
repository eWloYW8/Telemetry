package modules

import (
	"fmt"
	"sort"
	"time"

	"github.com/eWloYW8/Telemetry/api"
)

type CollectorFunc func(at time.Time) (api.MetricSample, error)
type ControllerFunc func(cmd *api.Command) error

type CollectorEntry struct {
	Category  api.MetricCategory
	Interval  time.Duration
	Collector CollectorFunc
}

type ControllerEntry struct {
	Type       api.CommandType
	Controller ControllerFunc
}

type Module interface {
	Name() string
	Registration() any
	CollectorEntries() []CollectorEntry
	ControllerEntries() []ControllerEntry
}

type RegisteredCollectorEntry struct {
	Module    string
	Category  api.MetricCategory
	Interval  time.Duration
	Collector CollectorFunc
}

type Registry struct {
	modules            []Module
	moduleMetadata     map[string]any
	collectorEntries   []RegisteredCollectorEntry
	controllerHandlers map[api.CommandType]ControllerFunc
}

func NewRegistry(mods ...Module) (*Registry, error) {
	r := &Registry{
		modules:            make([]Module, 0, len(mods)),
		moduleMetadata:     make(map[string]any, len(mods)),
		collectorEntries:   make([]RegisteredCollectorEntry, 0, 16),
		controllerHandlers: make(map[api.CommandType]ControllerFunc, 16),
	}

	owners := make(map[api.CommandType]string, 16)
	for _, m := range mods {
		if m == nil {
			continue
		}
		name := m.Name()
		if name == "" {
			return nil, fmt.Errorf("module name is empty")
		}
		r.modules = append(r.modules, m)
		if meta := m.Registration(); meta != nil {
			r.moduleMetadata[name] = meta
		}

		for _, entry := range m.CollectorEntries() {
			if entry.Collector == nil {
				continue
			}
			r.collectorEntries = append(r.collectorEntries, RegisteredCollectorEntry{
				Module:    name,
				Category:  entry.Category,
				Interval:  entry.Interval,
				Collector: entry.Collector,
			})
		}

		for _, entry := range m.ControllerEntries() {
			if entry.Controller == nil {
				continue
			}
			if owner, ok := owners[entry.Type]; ok {
				return nil, fmt.Errorf("command type %s registered by both %s and %s", entry.Type, owner, name)
			}
			owners[entry.Type] = name
			r.controllerHandlers[entry.Type] = entry.Controller
		}
	}

	sort.Slice(r.collectorEntries, func(i, j int) bool {
		if r.collectorEntries[i].Interval == r.collectorEntries[j].Interval {
			if r.collectorEntries[i].Module == r.collectorEntries[j].Module {
				return r.collectorEntries[i].Category < r.collectorEntries[j].Category
			}
			return r.collectorEntries[i].Module < r.collectorEntries[j].Module
		}
		return r.collectorEntries[i].Interval < r.collectorEntries[j].Interval
	})

	return r, nil
}

func (r *Registry) CollectorEntries() []RegisteredCollectorEntry {
	if r == nil || len(r.collectorEntries) == 0 {
		return nil
	}
	out := make([]RegisteredCollectorEntry, len(r.collectorEntries))
	copy(out, r.collectorEntries)
	return out
}

func (r *Registry) ModuleMetadata() map[string]any {
	if r == nil || len(r.moduleMetadata) == 0 {
		return nil
	}
	out := make(map[string]any, len(r.moduleMetadata))
	for name, meta := range r.moduleMetadata {
		out[name] = meta
	}
	return out
}

func (r *Registry) ExecuteController(cmd *api.Command) error {
	if r == nil {
		return fmt.Errorf("module registry is nil")
	}
	if cmd == nil {
		return fmt.Errorf("command is nil")
	}
	handler, ok := r.controllerHandlers[cmd.Type]
	if !ok {
		return fmt.Errorf("unsupported command type: %s", cmd.Type)
	}
	return handler(cmd)
}
