package server

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	"telemetry/api"
	pb "telemetry/api/pb"
	"telemetry/config"
	"telemetry/security"
)

type nodeSession struct {
	nodeID string
	cmdQ   chan *api.Command
}

type ingestItem struct {
	nodeID  string
	samples []api.MetricSample
}

type Server struct {
	pb.UnimplementedTelemetryServiceServer

	cfg   config.ServerConfig
	log   zerolog.Logger
	store *Store
	wsHub *wsHub

	grpcServer *grpc.Server
	httpServer *http.Server

	sessionsMu sync.RWMutex
	sessions   map[string]*nodeSession

	pendingMu sync.Mutex
	pending   map[string]pendingEntry

	ingestQ chan ingestItem

	droppedIngest atomic.Uint64
}

type pendingEntry struct {
	nodeID string
	ch     chan *api.CommandResult
}

func New(cfg config.ServerConfig, logger zerolog.Logger) *Server {
	return &Server{
		cfg:      cfg,
		log:      logger.With().Str("component", "server").Logger(),
		store:    NewStore(),
		wsHub:    newWSHub(logger.With().Str("component", "server.ws").Logger()),
		sessions: make(map[string]*nodeSession),
		pending:  make(map[string]pendingEntry),
		ingestQ:  make(chan ingestItem, cfg.IngestQueueSize),
	}
}

func (s *Server) Run(ctx context.Context) error {
	s.log.Info().
		Str("grpc_listen", s.cfg.GRPCListen).
		Str("http_listen", s.cfg.HTTPListen).
		Dur("retention", s.cfg.Retention).
		Int("ingest_queue_size", s.cfg.IngestQueueSize).
		Int("per_node_queue_size", s.cfg.PerNodeQueueSize).
		Msg("server configuration loaded")

	tlsCfg, err := security.LoadServerTLSConfig(s.cfg.TLS)
	if err != nil {
		return err
	}
	grpcListener, err := net.Listen("tcp", s.cfg.GRPCListen)
	if err != nil {
		return fmt.Errorf("listen grpc: %w", err)
	}
	httpListener, err := net.Listen("tcp", s.cfg.HTTPListen)
	if err != nil {
		return fmt.Errorf("listen http: %w", err)
	}

	s.grpcServer = grpc.NewServer(grpc.Creds(credentials.NewTLS(tlsCfg)))
	pb.RegisterTelemetryServiceServer(s.grpcServer, s)

	go s.ingestLoop(ctx)
	go s.wsHub.Run(ctx)
	go s.reportDropStats(ctx)

	router := s.newRouter()
	s.httpServer = &http.Server{
		Handler:      router,
		ReadTimeout:  s.cfg.HTTPReadTimeout,
		WriteTimeout: s.cfg.HTTPWriteTimeout,
		IdleTimeout:  s.cfg.HTTPIdleTimeout,
	}

	errCh := make(chan error, 2)
	go func() {
		s.log.Info().Str("addr", s.cfg.GRPCListen).Msg("grpc server listening")
		errCh <- s.grpcServer.Serve(grpcListener)
	}()
	go func() {
		s.log.Info().Str("addr", s.cfg.HTTPListen).Msg("http server listening")
		errCh <- s.httpServer.Serve(httpListener)
	}()

	select {
	case <-ctx.Done():
		txCtx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
		defer cancel()
		s.grpcServer.GracefulStop()
		_ = s.httpServer.Shutdown(txCtx)
		return ctx.Err()
	case err := <-errCh:
		if err == nil || errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}

func (s *Server) ingestLoop(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case item := <-s.ingestQ:
			s.wsHub.PublishMetrics(item.nodeID, item.samples)
		}
	}
}

func (s *Server) StreamTelemetry(stream pb.TelemetryService_StreamTelemetryServer) error {
	firstPB, err := stream.Recv()
	if err != nil {
		return err
	}
	first := api.FromPBAgentMessage(firstPB)
	if first == nil {
		return fmt.Errorf("first stream message is invalid")
	}
	if first.Kind != api.MessageKindRegister || first.Registration == nil {
		return fmt.Errorf("first stream message must be registration")
	}

	reg := first.Registration
	nodeID := reg.NodeID
	if nodeID == "" {
		return fmt.Errorf("registration node_id is empty")
	}

	session := &nodeSession{nodeID: nodeID, cmdQ: make(chan *api.Command, s.cfg.PerNodeQueueSize)}
	s.store.SetNodeRegistration(reg)
	s.registerSession(session)
	if snapshot, err := s.store.GetNodeSnapshot(nodeID); err == nil {
		s.wsHub.PublishNodeSnapshot(toPBNodeSnapshot(snapshot))
	}
	defer s.unregisterSession(nodeID)

	if err := stream.Send(api.ToPBServerMessage(&api.ServerMessage{
		Kind: api.MessageKindAck,
		Ack:  &api.ServerAck{NodeID: nodeID, At: time.Now().UnixNano()},
	})); err != nil {
		return err
	}

	s.log.Info().Str("node_id", nodeID).Msg("node connected")

	ctx, cancel := context.WithCancel(stream.Context())
	defer cancel()
	errCh := make(chan error, 2)

	go func() {
		for {
			select {
			case <-ctx.Done():
				errCh <- nil
				return
			case cmd := <-session.cmdQ:
				if err := stream.Send(api.ToPBServerMessage(&api.ServerMessage{Kind: api.MessageKindCommand, Command: cmd})); err != nil {
					errCh <- err
					return
				}
			}
		}
	}()

	go func() {
		for {
			msgPB, err := stream.Recv()
			if err != nil {
				if errors.Is(err, io.EOF) {
					errCh <- io.EOF
				} else {
					errCh <- err
				}
				return
			}
			msg := api.FromPBAgentMessage(msgPB)
			if msg == nil {
				continue
			}
			s.handleAgentMessage(nodeID, msg)
		}
	}()

	err = <-errCh
	if err != nil && !errors.Is(err, io.EOF) {
		s.log.Warn().Err(err).Str("node_id", nodeID).Msg("node stream closed with error")
	} else {
		s.log.Info().Str("node_id", nodeID).Msg("node disconnected")
	}
	return err
}

func (s *Server) handleAgentMessage(nodeID string, msg *api.AgentMessage) {
	switch msg.Kind {
	case api.MessageKindMetrics:
		if msg.Metrics != nil {
			if n := len(msg.Metrics.Samples); n > 0 {
				s.store.TouchNode(nodeID, msg.Metrics.Samples[n-1].At)
			}
			select {
			case s.ingestQ <- ingestItem{nodeID: nodeID, samples: msg.Metrics.Samples}:
			default:
				s.droppedIngest.Add(uint64(len(msg.Metrics.Samples)))
			}
		}
	case api.MessageKindHeartbeat:
		if msg.Heartbeat != nil {
			s.store.TouchNode(nodeID, msg.Heartbeat.At)
			if snapshot, err := s.store.GetNodeSnapshot(nodeID); err == nil {
				s.wsHub.PublishNodeSnapshot(toPBNodeSnapshot(snapshot))
			}
		}
	case api.MessageKindCommandResult:
		if msg.Result != nil {
			s.resolvePending(msg.Result)
		}
	}
}

func (s *Server) registerSession(session *nodeSession) {
	s.sessionsMu.Lock()
	defer s.sessionsMu.Unlock()
	s.sessions[session.nodeID] = session
	s.store.SetNodeConnected(session.nodeID, true)
	if snapshot, err := s.store.GetNodeSnapshot(session.nodeID); err == nil {
		s.wsHub.PublishNodeSnapshot(toPBNodeSnapshot(snapshot))
	}
}

func (s *Server) unregisterSession(nodeID string) {
	s.sessionsMu.Lock()
	delete(s.sessions, nodeID)
	s.sessionsMu.Unlock()
	s.failPendingByNode(nodeID)
	s.store.SetNodeConnected(nodeID, false)
	if snapshot, err := s.store.GetNodeSnapshot(nodeID); err == nil {
		s.wsHub.PublishNodeSnapshot(toPBNodeSnapshot(snapshot))
	}
}

func (s *Server) getSession(nodeID string) (*nodeSession, bool) {
	s.sessionsMu.RLock()
	defer s.sessionsMu.RUnlock()
	sess, ok := s.sessions[nodeID]
	return sess, ok
}

func (s *Server) registerPending(commandID, nodeID string) chan *api.CommandResult {
	ch := make(chan *api.CommandResult, 1)
	s.pendingMu.Lock()
	s.pending[commandID] = pendingEntry{
		nodeID: nodeID,
		ch:     ch,
	}
	s.pendingMu.Unlock()
	return ch
}

func (s *Server) resolvePending(result *api.CommandResult) {
	s.pendingMu.Lock()
	entry, ok := s.pending[result.CommandID]
	if ok {
		delete(s.pending, result.CommandID)
	}
	s.pendingMu.Unlock()
	if ok {
		entry.ch <- result
		close(entry.ch)
	}
}

func (s *Server) clearPending(commandID string) {
	s.pendingMu.Lock()
	delete(s.pending, commandID)
	s.pendingMu.Unlock()
}

func (s *Server) failPendingByNode(nodeID string) {
	s.pendingMu.Lock()
	pending := make(map[string]pendingEntry, 16)
	for commandID, entry := range s.pending {
		if entry.nodeID != nodeID {
			continue
		}
		pending[commandID] = entry
		delete(s.pending, commandID)
	}
	s.pendingMu.Unlock()

	now := time.Now().UnixNano()
	for commandID, entry := range pending {
		result := &api.CommandResult{
			CommandID:  commandID,
			NodeID:     nodeID,
			Success:    false,
			Error:      "node disconnected before command completion",
			FinishedAt: now,
		}
		select {
		case entry.ch <- result:
		default:
		}
		close(entry.ch)
	}
}

func (s *Server) dispatchCommand(ctx context.Context, nodeID string, cmd *api.Command) (*api.CommandResult, error) {
	sess, ok := s.getSession(nodeID)
	if !ok {
		return nil, fmt.Errorf("node %s is offline", nodeID)
	}

	if cmd.ID == "" {
		cmd.ID = uuid.NewString()
	}
	cmd.NodeID = nodeID
	cmd.IssuedAt = time.Now().UnixNano()
	s.log.Info().
		Str("node_id", nodeID).
		Str("command_id", cmd.ID).
		Str("command_type", string(cmd.Type)).
		Msg("dispatching command")

	resultCh := s.registerPending(cmd.ID, nodeID)

	select {
	case sess.cmdQ <- cmd:
	case <-ctx.Done():
		s.clearPending(cmd.ID)
		return nil, ctx.Err()
	}

	select {
	case res := <-resultCh:
		if res == nil {
			return nil, fmt.Errorf("command result channel closed")
		}
		if !res.Success {
			s.log.Warn().
				Str("node_id", nodeID).
				Str("command_id", cmd.ID).
				Str("command_type", string(cmd.Type)).
				Str("error", res.Error).
				Msg("command failed")
			return res, fmt.Errorf(res.Error)
		}
		s.log.Info().
			Str("node_id", nodeID).
			Str("command_id", cmd.ID).
			Str("command_type", string(cmd.Type)).
			Msg("command succeeded")
		return res, nil
	case <-ctx.Done():
		s.clearPending(cmd.ID)
		s.log.Warn().
			Err(ctx.Err()).
			Str("node_id", nodeID).
			Str("command_id", cmd.ID).
			Str("command_type", string(cmd.Type)).
			Msg("command wait canceled or timed out")
		return nil, ctx.Err()
	}
}

func (s *Server) reportDropStats(ctx context.Context) {
	const reportInterval = 5 * time.Second
	ticker := time.NewTicker(reportInterval)
	defer ticker.Stop()

	logOnce := func() {
		droppedIngest := s.droppedIngest.Swap(0)
		wsDropped, wsSlowClients := s.wsHub.SwapDropStats()
		if droppedIngest == 0 && wsDropped == 0 && wsSlowClients == 0 {
			return
		}
		s.log.Warn().
			Uint64("ingest_dropped_samples", droppedIngest).
			Uint64("ws_dropped_samples", wsDropped).
			Uint64("ws_slow_clients_dropped", wsSlowClients).
			Dur("window", reportInterval).
			Msg("drop summary")
	}

	for {
		select {
		case <-ctx.Done():
			logOnce()
			return
		case <-ticker.C:
			logOnce()
		}
	}
}
