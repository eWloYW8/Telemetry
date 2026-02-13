package api

import (
	"time"
)

type MessageKind string

const (
	MessageKindRegister      MessageKind = "register"
	MessageKindMetrics       MessageKind = "metrics"
	MessageKindCommandResult MessageKind = "command_result"
	MessageKindHeartbeat     MessageKind = "heartbeat"
	MessageKindCommand       MessageKind = "command"
	MessageKindAck           MessageKind = "ack"
)

type MetricCategory string
type CommandType string

type AgentMessage struct {
	Kind         MessageKind
	Registration *Registration
	Metrics      *MetricsBatch
	Result       *CommandResult
	Heartbeat    *Heartbeat
}

type ServerMessage struct {
	Kind    MessageKind
	Command *Command
	Ack     *ServerAck
}

type Registration struct {
	NodeID  string
	Basic   BasicInfo
	Modules map[string]any
	At      int64
}

type Heartbeat struct {
	NodeID string
	At     int64
}

type MetricsBatch struct {
	NodeID  string
	Samples []MetricSample
	SentAt  int64
}

type MetricSample struct {
	Category MetricCategory
	At       int64
	Payload  any
}

type BasicInfo struct {
	Hostname       string
	IPs            []string
	OS             string
	Kernel         string
	Arch           string
	MachineID      string
	BootID         string
	HardwareModel  string
	HardwareVendor string
}

type Command struct {
	ID       string
	NodeID   string
	Type     CommandType
	IssuedAt int64
	Payload  any
}

type CommandResult struct {
	CommandID  string
	NodeID     string
	Type       CommandType
	Success    bool
	Error      string
	FinishedAt int64
}

type ServerAck struct {
	NodeID string
	At     int64
}

type NodeSnapshot struct {
	NodeID       string
	Connected    bool
	LastSeen     int64
	Registration *Registration
	Latest       map[string]TimedSample
}

type TimedSample struct {
	NodeID   string
	Category MetricCategory
	At       int64
	Payload  any
}

func NewHeartbeat(nodeID string) *Heartbeat {
	return &Heartbeat{NodeID: nodeID, At: time.Now().UnixNano()}
}
