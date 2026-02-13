package agent

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"sync"
	"sync/atomic"
	"time"

	"github.com/rs/zerolog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	"telemetry/agent/collectors"
	"telemetry/agent/executor"
	"telemetry/agent/modules"
	cpuModule "telemetry/agent/modules/cpu"
	gpuModule "telemetry/agent/modules/gpu"
	memoryModule "telemetry/agent/modules/memory"
	networkModule "telemetry/agent/modules/network"
	processModule "telemetry/agent/modules/process"
	storageModule "telemetry/agent/modules/storage"
	"telemetry/api"
	pb "telemetry/api/pb"
	"telemetry/config"
	"telemetry/security"
)

type Agent struct {
	cfg config.AgentConfig
	log zerolog.Logger

	nodeID       string
	registration api.Registration

	modules  *modules.Registry
	executor *control.Executor

	metricsQueue chan api.MetricSample
	resultQueue  chan *api.CommandResult

	droppedMetrics atomic.Uint64
}

func New(cfg config.AgentConfig, logger zerolog.Logger) (*Agent, error) {
	basicInfo, err := collectors.CollectBasicInfo()
	if err != nil {
		return nil, err
	}

	nodeID := cfg.NodeID
	if nodeID == "" {
		nodeID = basicInfo.Hostname
	}
	if nodeID == "" {
		h, _ := os.Hostname()
		nodeID = h
	}

	cpuMod, err := cpuModule.New(cfg.Report)
	if err != nil {
		return nil, err
	}
	gpuMod, gpuErr := gpuModule.New(cfg.Report)
	if gpuErr != nil {
		logger.Warn().Err(gpuErr).Msg("gpu collector init failed, continue without GPU")
	}

	moduleRegistry, err := modules.NewRegistry(
		cpuMod,
		gpuMod,
		memoryModule.New(cfg.Report),
		storageModule.New(cfg.Report),
		networkModule.New(cfg.Report),
		processModule.New(cfg.Report),
	)
	if err != nil {
		return nil, fmt.Errorf("init module registry: %w", err)
	}

	agent := &Agent{
		cfg: cfg,
		log: logger.With().Str("component", "agent").Str("node_id", nodeID).Logger(),

		nodeID: nodeID,
		registration: api.Registration{
			NodeID:  nodeID,
			Basic:   basicInfo,
			Modules: moduleRegistry.ModuleMetadata(),
			At:      time.Now().UnixNano(),
		},

		modules:  moduleRegistry,
		executor: control.NewExecutor(moduleRegistry),

		metricsQueue: make(chan api.MetricSample, cfg.SendQueueSize),
		resultQueue:  make(chan *api.CommandResult, cfg.SendQueueSize),
	}

	agent.log.Info().
		Str("server_addr", cfg.ServerAddress).
		Int("send_queue_size", cfg.SendQueueSize).
		Dur("control_timeout", cfg.ControlTimeout).
		Dur("heartbeat", cfg.Report.Heartbeat).
		Dur("batch_flush", cfg.Report.BatchFlush).
		Int("max_per_batch", cfg.Report.MaxPerBatch).
		Msg("agent configuration loaded")

	return agent, nil
}

func (a *Agent) Run(ctx context.Context) error {
	a.log.Info().Str("server_addr", a.cfg.ServerAddress).Dur("reconnect_backoff", a.cfg.ReconnectBackoff).Msg("agent run loop started")
	for {
		if err := a.runOnce(ctx); err != nil {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			a.log.Error().Err(err).Msg("agent stream disconnected")
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(a.cfg.ReconnectBackoff):
			a.log.Debug().Dur("backoff", a.cfg.ReconnectBackoff).Msg("retrying server connection")
		}
	}
}

func (a *Agent) runOnce(ctx context.Context) error {
	tlsCfg, err := security.LoadClientTLSConfig(a.cfg.TLS)
	if err != nil {
		return err
	}

	dialCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	conn, err := grpc.DialContext(
		dialCtx,
		a.cfg.ServerAddress,
		grpc.WithTransportCredentials(credentials.NewTLS(tlsCfg)),
		grpc.WithBlock(),
	)
	if err != nil {
		return fmt.Errorf("dial grpc server: %w", err)
	}
	defer conn.Close()
	a.log.Info().Str("server_addr", a.cfg.ServerAddress).Msg("connected to grpc server")

	client := pb.NewTelemetryServiceClient(conn)
	stream, err := client.StreamTelemetry(ctx)
	if err != nil {
		return fmt.Errorf("open stream: %w", err)
	}

	if err := stream.Send(api.ToPBAgentMessage(&api.AgentMessage{
		Kind:         api.MessageKindRegister,
		Registration: &a.registration,
	})); err != nil {
		return fmt.Errorf("send registration: %w", err)
	}
	a.log.Info().Msg("registration sent")

	streamCtx, streamCancel := context.WithCancel(ctx)
	defer streamCancel()

	var wg sync.WaitGroup
	wg.Add(4)

	go func() {
		defer wg.Done()
		a.runCollectors(streamCtx)
	}()

	go func() {
		defer wg.Done()
		a.reportDroppedMetrics(streamCtx)
	}()

	errCh := make(chan error, 2)

	go func() {
		defer wg.Done()
		if err := a.senderLoop(streamCtx, stream); err != nil {
			errCh <- fmt.Errorf("sender loop: %w", err)
		}
	}()

	go func() {
		defer wg.Done()
		if err := a.receiverLoop(streamCtx, stream); err != nil {
			errCh <- fmt.Errorf("receiver loop: %w", err)
		}
	}()

	select {
	case <-ctx.Done():
		streamCancel()
		wg.Wait()
		return ctx.Err()
	case err := <-errCh:
		streamCancel()
		wg.Wait()
		return err
	}
}

func (a *Agent) reportDroppedMetrics(ctx context.Context) {
	const reportInterval = 5 * time.Second
	ticker := time.NewTicker(reportInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			dropped := a.droppedMetrics.Swap(0)
			if dropped > 0 {
				a.log.Warn().Uint64("dropped_samples", dropped).Dur("window", reportInterval).Msg("metrics dropped due to full send queue")
			}
			return
		case <-ticker.C:
			dropped := a.droppedMetrics.Swap(0)
			if dropped == 0 {
				continue
			}
			a.log.Warn().Uint64("dropped_samples", dropped).Dur("window", reportInterval).Msg("metrics dropped due to full send queue")
		}
	}
}

func (a *Agent) runCollectors(ctx context.Context) {
	emit := func(moduleName string, category api.MetricCategory, payload func() (api.MetricSample, error)) {
		sample, err := payload()
		if err != nil {
			a.log.Debug().Err(err).Str("module", moduleName).Str("category", string(category)).Msg("collect failed")
			return
		}
		if sample.Category == "" {
			sample.Category = category
		}
		if sample.At == 0 {
			sample.At = time.Now().UnixNano()
		}
		select {
		case a.metricsQueue <- sample:
		default:
			a.droppedMetrics.Add(1)
		}
	}

	startTicker := func(interval time.Duration, fn func()) *time.Ticker {
		t := time.NewTicker(interval)
		go func() {
			for {
				select {
				case <-ctx.Done():
					t.Stop()
					return
				case <-t.C:
					fn()
				}
			}
		}()
		return t
	}

	for _, collector := range a.modules.CollectorEntries() {
		c := collector
		if c.Interval <= 0 {
			a.log.Warn().Str("module", c.Module).Str("category", string(c.Category)).Msg("collector disabled due to non-positive interval")
			continue
		}
		startTicker(c.Interval, func() {
			at := time.Now()
			emit(c.Module, c.Category, func() (api.MetricSample, error) {
				return c.Collector(at)
			})
		})
	}

	<-ctx.Done()
}

func (a *Agent) senderLoop(ctx context.Context, stream pb.TelemetryService_StreamTelemetryClient) error {
	batch := make([]api.MetricSample, 0, a.cfg.Report.MaxPerBatch)
	flushTicker := time.NewTicker(a.cfg.Report.BatchFlush)
	heartbeatTicker := time.NewTicker(a.cfg.Report.Heartbeat)
	defer flushTicker.Stop()
	defer heartbeatTicker.Stop()

	sendBatch := func(force bool) error {
		if len(batch) == 0 && !force {
			return nil
		}
		msg := &api.AgentMessage{
			Kind: api.MessageKindMetrics,
			Metrics: &api.MetricsBatch{
				NodeID:  a.nodeID,
				Samples: append([]api.MetricSample(nil), batch...),
				SentAt:  time.Now().UnixNano(),
			},
		}
		if len(batch) == 0 {
			msg = nil
		}
		batch = batch[:0]
		if msg == nil {
			return nil
		}
		return stream.Send(api.ToPBAgentMessage(msg))
	}

	for {
		select {
		case <-ctx.Done():
			_ = sendBatch(true)
			return nil
		case sample := <-a.metricsQueue:
			batch = append(batch, sample)
			if len(batch) >= a.cfg.Report.MaxPerBatch {
				if err := sendBatch(false); err != nil {
					return err
				}
			}
		case res := <-a.resultQueue:
			if err := sendBatch(false); err != nil {
				return err
			}
			if err := stream.Send(api.ToPBAgentMessage(&api.AgentMessage{Kind: api.MessageKindCommandResult, Result: res})); err != nil {
				return err
			}
		case <-flushTicker.C:
			if err := sendBatch(false); err != nil {
				return err
			}
		case <-heartbeatTicker.C:
			if err := sendBatch(false); err != nil {
				return err
			}
			if err := stream.Send(api.ToPBAgentMessage(&api.AgentMessage{
				Kind:      api.MessageKindHeartbeat,
				Heartbeat: api.NewHeartbeat(a.nodeID),
			})); err != nil {
				return err
			}
		}
	}
}

func (a *Agent) receiverLoop(ctx context.Context, stream pb.TelemetryService_StreamTelemetryClient) error {
	dispatcher := newCommandDispatcher(a.nodeID, a.executor, a.cfg.ControlTimeout, func(result *api.CommandResult) {
		if result == nil {
			return
		}
		event := a.log.With().
			Str("command_id", result.CommandID).
			Str("command_type", string(result.Type)).
			Bool("success", result.Success).
			Logger()
		if result.Success {
			event.Info().Msg("command executed")
		} else {
			event.Warn().Str("error", result.Error).Msg("command failed")
		}
		select {
		case <-ctx.Done():
			return
		case a.resultQueue <- result:
		}
	})
	defer dispatcher.Close()

	for {
		pbMsg, err := stream.Recv()
		if err != nil {
			if errors.Is(err, io.EOF) {
				return io.EOF
			}
			return err
		}
		msg := api.FromPBServerMessage(pbMsg)
		if msg == nil {
			continue
		}
		if msg.Kind != api.MessageKindCommand || msg.Command == nil {
			continue
		}
		a.log.Info().
			Str("command_id", msg.Command.ID).
			Str("command_type", string(msg.Command.Type)).
			Msg("received command")
		if err := dispatcher.Submit(msg.Command); err != nil {
			a.log.Warn().
				Err(err).
				Str("command_id", msg.Command.ID).
				Str("command_type", string(msg.Command.Type)).
				Msg("failed to submit command")
			result := &api.CommandResult{
				CommandID:  msg.Command.ID,
				NodeID:     a.nodeID,
				Type:       msg.Command.Type,
				Success:    false,
				Error:      err.Error(),
				FinishedAt: time.Now().UnixNano(),
			}
			select {
			case <-ctx.Done():
				return nil
			case a.resultQueue <- result:
			}
		}
	}
}
