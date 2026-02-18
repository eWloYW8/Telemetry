package server

import (
	"fmt"
	"sort"
	"sync"

	"github.com/eWloYW8/Telemetry/api"
)

type nodeBuffer struct {
	mu           sync.RWMutex
	registration *api.Registration
	connected    bool
	lastSeen     int64
	sourceIP     string
}

type Store struct {
	mu    sync.RWMutex
	nodes map[string]*nodeBuffer
}

func NewStore() *Store {
	return &Store{
		nodes: make(map[string]*nodeBuffer),
	}
}

func (s *Store) ensureNode(nodeID string) *nodeBuffer {
	s.mu.Lock()
	defer s.mu.Unlock()
	n, ok := s.nodes[nodeID]
	if !ok {
		n = &nodeBuffer{}
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
	if reg.At > 0 {
		n.lastSeen = reg.At
	}
}

func (s *Store) SetNodeConnected(nodeID string, connected bool) {
	n := s.ensureNode(nodeID)
	n.mu.Lock()
	defer n.mu.Unlock()
	n.connected = connected
}

func (s *Store) SetNodeSourceIP(nodeID, sourceIP string) {
	n := s.ensureNode(nodeID)
	n.mu.Lock()
	defer n.mu.Unlock()
	n.sourceIP = sourceIP
}

func (s *Store) TouchNode(nodeID string, at int64) {
	n := s.ensureNode(nodeID)
	n.mu.Lock()
	defer n.mu.Unlock()
	n.lastSeen = at
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
			SourceIP:  n.sourceIP,
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
		SourceIP:  n.sourceIP,
	}
	if n.registration != nil {
		cp := *n.registration
		snapshot.Registration = &cp
	}
	return snapshot, nil
}
