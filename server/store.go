package server

import (
	"fmt"
	"sort"
	"sync"
	"time"

	"telemetry/api"
)

type nodeBuffer struct {
	mu           sync.RWMutex
	registration *api.Registration
	connected    bool
	lastSeen     int64
	latest       map[string]api.TimedSample
	samples      []api.TimedSample
}

type Store struct {
	retention         time.Duration
	maxSamplesPerNode int

	mu    sync.RWMutex
	nodes map[string]*nodeBuffer
}

func NewStore(retention time.Duration, maxSamplesPerNode int) *Store {
	return &Store{
		retention:         retention,
		maxSamplesPerNode: maxSamplesPerNode,
		nodes:             make(map[string]*nodeBuffer),
	}
}

func (s *Store) ensureNode(nodeID string) *nodeBuffer {
	s.mu.Lock()
	defer s.mu.Unlock()
	n, ok := s.nodes[nodeID]
	if !ok {
		n = &nodeBuffer{latest: make(map[string]api.TimedSample), samples: make([]api.TimedSample, 0, 1024)}
		s.nodes[nodeID] = n
	}
	return n
}

func (s *Store) SetNodeRegistration(reg *api.Registration) {
	n := s.ensureNode(reg.NodeID)
	n.mu.Lock()
	defer n.mu.Unlock()
	cp := *reg
	n.registration = &cp
	n.connected = true
	n.lastSeen = time.Now().UnixNano()
}

func (s *Store) SetNodeConnected(nodeID string, connected bool) {
	n := s.ensureNode(nodeID)
	n.mu.Lock()
	defer n.mu.Unlock()
	n.connected = connected
	n.lastSeen = time.Now().UnixNano()
}

func (s *Store) TouchNode(nodeID string, at int64) {
	n := s.ensureNode(nodeID)
	n.mu.Lock()
	defer n.mu.Unlock()
	n.lastSeen = at
}

func (s *Store) AddSamples(nodeID string, samples []api.MetricSample) {
	if len(samples) == 0 {
		return
	}
	n := s.ensureNode(nodeID)
	cutoff := time.Now().Add(-s.retention).UnixNano()

	n.mu.Lock()
	defer n.mu.Unlock()

	for _, sample := range samples {
		timed := api.TimedSample{
			NodeID:   nodeID,
			Category: sample.Category,
			At:       sample.At,
			Payload:  sample.Payload,
		}
		n.latest[string(sample.Category)] = timed
		n.samples = append(n.samples, timed)
	}

	idx := 0
	for idx < len(n.samples) && n.samples[idx].At < cutoff {
		idx++
	}
	if idx > 0 {
		n.samples = append([]api.TimedSample(nil), n.samples[idx:]...)
	}
	if s.maxSamplesPerNode > 0 && len(n.samples) > s.maxSamplesPerNode {
		start := len(n.samples) - s.maxSamplesPerNode
		n.samples = append([]api.TimedSample(nil), n.samples[start:]...)
	}
	n.lastSeen = time.Now().UnixNano()
}

func (s *Store) ListNodeSnapshots() []api.NodeSnapshot {
	s.mu.RLock()
	ids := make([]string, 0, len(s.nodes))
	for id := range s.nodes {
		ids = append(ids, id)
	}
	s.mu.RUnlock()

	sort.Strings(ids)
	result := make([]api.NodeSnapshot, 0, len(ids))
	for _, id := range ids {
		n := s.ensureNode(id)
		n.mu.RLock()
		snapshot := api.NodeSnapshot{
			NodeID:    id,
			Connected: n.connected,
			LastSeen:  n.lastSeen,
			Latest:    cloneLatest(n.latest),
		}
		if n.registration != nil {
			cp := *n.registration
			snapshot.Registration = &cp
		}
		n.mu.RUnlock()
		result = append(result, snapshot)
	}
	return result
}

func cloneLatest(in map[string]api.TimedSample) map[string]api.TimedSample {
	out := make(map[string]api.TimedSample, len(in))
	for k, v := range in {
		out[k] = v
	}
	return out
}

func (s *Store) GetNodeSnapshot(nodeID string) (api.NodeSnapshot, error) {
	s.mu.RLock()
	n, ok := s.nodes[nodeID]
	s.mu.RUnlock()
	if !ok {
		return api.NodeSnapshot{}, fmt.Errorf("node %s not found", nodeID)
	}
	n.mu.RLock()
	defer n.mu.RUnlock()
	snapshot := api.NodeSnapshot{
		NodeID:    nodeID,
		Connected: n.connected,
		LastSeen:  n.lastSeen,
		Latest:    cloneLatest(n.latest),
	}
	if n.registration != nil {
		cp := *n.registration
		snapshot.Registration = &cp
	}
	return snapshot, nil
}

func (s *Store) QuerySamples(nodeID string, since int64, category string, limit int) ([]api.TimedSample, error) {
	s.mu.RLock()
	n, ok := s.nodes[nodeID]
	s.mu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("node %s not found", nodeID)
	}
	n.mu.RLock()
	defer n.mu.RUnlock()
	if limit <= 0 {
		limit = 500
	}
	result := make([]api.TimedSample, 0, limit)
	for i := len(n.samples) - 1; i >= 0; i-- {
		s := n.samples[i]
		if since > 0 && s.At < since {
			break
		}
		if category != "" && string(s.Category) != category {
			continue
		}
		result = append(result, s)
		if len(result) >= limit {
			break
		}
	}
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}
	return result, nil
}
