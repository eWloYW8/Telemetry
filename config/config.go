package config

import (
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type TLSConfig struct {
	CAFile             string `yaml:"ca_file"`
	CertFile           string `yaml:"cert_file"`
	KeyFile            string `yaml:"key_file"`
	ServerNameOverride string `yaml:"server_name_override"`
}

type LogConfig struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
}

type ServerConfig struct {
	GRPCListen        string        `yaml:"grpc_listen"`
	HTTPListen        string        `yaml:"http_listen"`
	Retention         time.Duration `yaml:"retention"`
	MaxSamplesPerNode int           `yaml:"max_samples_per_node"`
	IngestQueueSize   int           `yaml:"ingest_queue_size"`
	PerNodeQueueSize  int           `yaml:"per_node_queue_size"`
	CommandTimeout    time.Duration `yaml:"command_timeout"`
	HTTPReadTimeout   time.Duration `yaml:"http_read_timeout"`
	HTTPWriteTimeout  time.Duration `yaml:"http_write_timeout"`
	HTTPIdleTimeout   time.Duration `yaml:"http_idle_timeout"`
	Log               LogConfig     `yaml:"log"`
	TLS               TLSConfig     `yaml:"tls"`
}

type AgentConfig struct {
	NodeID           string        `yaml:"node_id"`
	ServerAddress    string        `yaml:"server_address"`
	ReconnectBackoff time.Duration `yaml:"reconnect_backoff"`
	SendQueueSize    int           `yaml:"send_queue_size"`
	ControlTimeout   time.Duration `yaml:"control_timeout"`
	Report           ReportConfig  `yaml:"report"`
	Log              LogConfig     `yaml:"log"`
	TLS              TLSConfig     `yaml:"tls"`
}

type ReportConfig struct {
	Intervals   map[string]time.Duration `yaml:"intervals"`
	Heartbeat   time.Duration            `yaml:"heartbeat"`
	BatchFlush  time.Duration            `yaml:"batch_flush"`
	MaxPerBatch int                      `yaml:"max_per_batch"`
}

func (r ReportConfig) Interval(key string, fallback time.Duration) time.Duration {
	if r.Intervals == nil {
		return fallback
	}
	v, ok := r.Intervals[key]
	if !ok || v <= 0 {
		return fallback
	}
	return v
}

func DefaultServerConfig() ServerConfig {
	return ServerConfig{
		GRPCListen:        "0.0.0.0:9443",
		HTTPListen:        "0.0.0.0:9080",
		Retention:         24 * time.Hour,
		MaxSamplesPerNode: 500000,
		IngestQueueSize:   16384,
		PerNodeQueueSize:  4096,
		CommandTimeout:    15 * time.Second,
		HTTPReadTimeout:   10 * time.Second,
		HTTPWriteTimeout:  15 * time.Second,
		HTTPIdleTimeout:   30 * time.Second,
		Log: LogConfig{
			Level:  "info",
			Format: "console",
		},
	}
}

func DefaultAgentConfig() AgentConfig {
	return AgentConfig{
		ServerAddress:    "127.0.0.1:9443",
		ReconnectBackoff: 3 * time.Second,
		SendQueueSize:    4096,
		ControlTimeout:   10 * time.Second,
		Report: ReportConfig{
			Intervals: map[string]time.Duration{
				"cpu_ultra_fast": 100 * time.Millisecond,
				"cpu_medium":     1 * time.Second,
				"gpu_fast":       100 * time.Millisecond,
				"memory":         1 * time.Second,
				"storage":        5 * time.Second,
				"network":        5 * time.Second,
				"process":        5 * time.Second,
			},
			Heartbeat:   2 * time.Second,
			BatchFlush:  100 * time.Millisecond,
			MaxPerBatch: 64,
		},
		Log: LogConfig{
			Level:  "info",
			Format: "console",
		},
	}
}

func LoadServerConfig(path string) (ServerConfig, error) {
	cfg := DefaultServerConfig()
	if path == "" {
		return cfg, nil
	}
	b, err := os.ReadFile(path)
	if err != nil {
		return cfg, fmt.Errorf("read server config: %w", err)
	}
	if err := yaml.Unmarshal(b, &cfg); err != nil {
		return cfg, fmt.Errorf("parse server config: %w", err)
	}
	applyServerDefaults(&cfg)
	return cfg, nil
}

func LoadAgentConfig(path string) (AgentConfig, error) {
	cfg := DefaultAgentConfig()
	if path == "" {
		return cfg, nil
	}
	b, err := os.ReadFile(path)
	if err != nil {
		return cfg, fmt.Errorf("read agent config: %w", err)
	}
	if err := yaml.Unmarshal(b, &cfg); err != nil {
		return cfg, fmt.Errorf("parse agent config: %w", err)
	}
	applyAgentDefaults(&cfg)
	return cfg, nil
}

func applyServerDefaults(cfg *ServerConfig) {
	d := DefaultServerConfig()
	if cfg.GRPCListen == "" {
		cfg.GRPCListen = d.GRPCListen
	}
	if cfg.HTTPListen == "" {
		cfg.HTTPListen = d.HTTPListen
	}
	if cfg.Retention <= 0 {
		cfg.Retention = d.Retention
	}
	if cfg.MaxSamplesPerNode <= 0 {
		cfg.MaxSamplesPerNode = d.MaxSamplesPerNode
	}
	if cfg.IngestQueueSize <= 0 {
		cfg.IngestQueueSize = d.IngestQueueSize
	}
	if cfg.PerNodeQueueSize <= 0 {
		cfg.PerNodeQueueSize = d.PerNodeQueueSize
	}
	if cfg.CommandTimeout <= 0 {
		cfg.CommandTimeout = d.CommandTimeout
	}
	if cfg.HTTPReadTimeout <= 0 {
		cfg.HTTPReadTimeout = d.HTTPReadTimeout
	}
	if cfg.HTTPWriteTimeout <= 0 {
		cfg.HTTPWriteTimeout = d.HTTPWriteTimeout
	}
	if cfg.HTTPIdleTimeout <= 0 {
		cfg.HTTPIdleTimeout = d.HTTPIdleTimeout
	}
	if cfg.Log.Level == "" {
		cfg.Log.Level = d.Log.Level
	}
	if cfg.Log.Format == "" {
		cfg.Log.Format = d.Log.Format
	}
}

func applyAgentDefaults(cfg *AgentConfig) {
	d := DefaultAgentConfig()
	if cfg.ServerAddress == "" {
		cfg.ServerAddress = d.ServerAddress
	}
	if cfg.ReconnectBackoff <= 0 {
		cfg.ReconnectBackoff = d.ReconnectBackoff
	}
	if cfg.SendQueueSize <= 0 {
		cfg.SendQueueSize = d.SendQueueSize
	}
	if cfg.ControlTimeout <= 0 {
		cfg.ControlTimeout = d.ControlTimeout
	}
	if cfg.Report.Intervals == nil {
		cfg.Report.Intervals = map[string]time.Duration{}
	}
	for k, v := range d.Report.Intervals {
		if cfg.Report.Intervals[k] <= 0 {
			cfg.Report.Intervals[k] = v
		}
	}
	if cfg.Report.Heartbeat <= 0 {
		cfg.Report.Heartbeat = d.Report.Heartbeat
	}
	if cfg.Report.BatchFlush <= 0 {
		cfg.Report.BatchFlush = d.Report.BatchFlush
	}
	if cfg.Report.MaxPerBatch <= 0 {
		cfg.Report.MaxPerBatch = d.Report.MaxPerBatch
	}
	if cfg.Log.Level == "" {
		cfg.Log.Level = d.Log.Level
	}
	if cfg.Log.Format == "" {
		cfg.Log.Format = d.Log.Format
	}
}
