package server

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"google.golang.org/protobuf/proto"

	cpupb "telemetry/agent/modules/cpu/pb"
	gpupb "telemetry/agent/modules/gpu/pb"
	processpb "telemetry/agent/modules/process/pb"
	"telemetry/api"
	pb "telemetry/api/pb"
)

const maxProtoPayloadBytes = 1 << 20

func (s *Server) newRouter() http.Handler {
	r := chi.NewRouter()

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeProto(w, http.StatusOK, &pb.HealthzResponse{Status: "ok", TimeUnixNano: time.Now().UnixNano()})
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/nodes", s.handleListNodes)
		r.Get("/nodes/{nodeID}", s.handleGetNode)
		r.Get("/nodes/{nodeID}/modules", s.handleGetNodeModules)
		r.Get("/nodes/{nodeID}/samples", s.handleGetSamples)
		r.Get("/ws/metrics", s.handleWSMetrics)

		r.Post("/nodes/{nodeID}/commands", s.handleDispatchCommand)
		r.Post("/nodes/{nodeID}/commands/{commandType}", s.handleDispatchCommandByType)
	})

	return r
}

func (s *Server) handleListNodes(w http.ResponseWriter, _ *http.Request) {
	snapshots := s.store.ListNodeSnapshots()
	out := &pb.ListNodesResponse{
		Nodes: make([]*pb.NodeSnapshot, 0, len(snapshots)),
	}
	for _, snapshot := range snapshots {
		out.Nodes = append(out.Nodes, toPBNodeSnapshot(snapshot))
	}
	writeProto(w, http.StatusOK, out)
}

func (s *Server) handleGetNode(w http.ResponseWriter, r *http.Request) {
	nodeID := chi.URLParam(r, "nodeID")
	snapshot, err := s.store.GetNodeSnapshot(nodeID)
	if err != nil {
		writeError(w, http.StatusNotFound, err)
		return
	}
	writeProto(w, http.StatusOK, toPBNodeSnapshot(snapshot))
}

func (s *Server) handleGetNodeModules(w http.ResponseWriter, r *http.Request) {
	nodeID := chi.URLParam(r, "nodeID")
	snapshot, err := s.store.GetNodeSnapshot(nodeID)
	if err != nil {
		writeError(w, http.StatusNotFound, err)
		return
	}
	modules := make([]*pb.ModuleRegistration, 0, 8)
	if regPB := api.ToPBRegistration(snapshot.Registration); regPB != nil {
		modules = append(modules, regPB.GetModules()...)
	}
	writeProto(w, http.StatusOK, &pb.NodeModulesResponse{Modules: modules})
}

func (s *Server) handleGetSamples(w http.ResponseWriter, r *http.Request) {
	nodeID := chi.URLParam(r, "nodeID")
	since := int64(0)
	if rawSince := r.URL.Query().Get("since"); rawSince != "" {
		if v, err := strconv.ParseInt(rawSince, 10, 64); err == nil {
			since = v
		}
	}
	limit := 500
	if rawLimit := r.URL.Query().Get("limit"); rawLimit != "" {
		if v, err := strconv.Atoi(rawLimit); err == nil && v > 0 {
			limit = v
		}
	}
	category := r.URL.Query().Get("category")
	samples, err := s.store.QuerySamples(nodeID, since, category, limit)
	if err != nil {
		writeError(w, http.StatusNotFound, err)
		return
	}

	out := &pb.SamplesResponse{
		Samples: make([]*pb.TimedSample, 0, len(samples)),
	}
	for _, sample := range samples {
		out.Samples = append(out.Samples, toPBTimedSample(sample))
	}
	writeProto(w, http.StatusOK, out)
}

func (s *Server) handleDispatchCommand(w http.ResponseWriter, r *http.Request) {
	nodeID := chi.URLParam(r, "nodeID")

	var pbCmd pb.Command
	if err := decodeProto(r, &pbCmd); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if pbCmd.GetType() == "" {
		writeError(w, http.StatusBadRequest, fmt.Errorf("missing command type"))
		return
	}
	cmd := api.FromPBCommand(&pbCmd)
	if cmd == nil {
		writeError(w, http.StatusBadRequest, fmt.Errorf("invalid command payload"))
		return
	}
	cmd.Type = api.CommandType(pbCmd.GetType())
	s.executeCommand(w, r, nodeID, cmd)
}

func (s *Server) handleDispatchCommandByType(w http.ResponseWriter, r *http.Request) {
	nodeID := chi.URLParam(r, "nodeID")
	commandType := chi.URLParam(r, "commandType")
	if commandType == "" {
		writeError(w, http.StatusBadRequest, fmt.Errorf("missing command type"))
		return
	}

	raw, err := readRawProto(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	payload, err := parseCommandPayloadPB(api.CommandType(commandType), raw)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	s.executeCommand(w, r, nodeID, &api.Command{
		Type:    api.CommandType(commandType),
		Payload: payload,
	})
}

func parseCommandPayloadPB(commandType api.CommandType, raw []byte) (any, error) {
	switch commandType {
	case "cpu_scaling_range":
		var payload cpupb.ScalingRangeCommand
		if err := proto.Unmarshal(raw, &payload); err != nil {
			return nil, fmt.Errorf("decode cpu_scaling_range payload: %w", err)
		}
		return &payload, nil
	case "cpu_governor":
		var payload cpupb.GovernorCommand
		if err := proto.Unmarshal(raw, &payload); err != nil {
			return nil, fmt.Errorf("decode cpu_governor payload: %w", err)
		}
		return &payload, nil
	case "cpu_uncore_range":
		var payload cpupb.UncoreRangeCommand
		if err := proto.Unmarshal(raw, &payload); err != nil {
			return nil, fmt.Errorf("decode cpu_uncore_range payload: %w", err)
		}
		return &payload, nil
	case "cpu_power_cap":
		var payload cpupb.PowerCapCommand
		if err := proto.Unmarshal(raw, &payload); err != nil {
			return nil, fmt.Errorf("decode cpu_power_cap payload: %w", err)
		}
		return &payload, nil
	case "gpu_clock_range":
		var payload gpupb.ClockRangeCommand
		if err := proto.Unmarshal(raw, &payload); err != nil {
			return nil, fmt.Errorf("decode gpu_clock_range payload: %w", err)
		}
		return &payload, nil
	case "gpu_power_cap":
		var payload gpupb.PowerCapCommand
		if err := proto.Unmarshal(raw, &payload); err != nil {
			return nil, fmt.Errorf("decode gpu_power_cap payload: %w", err)
		}
		return &payload, nil
	case "process_signal":
		var payload processpb.SignalCommand
		if err := proto.Unmarshal(raw, &payload); err != nil {
			return nil, fmt.Errorf("decode process_signal payload: %w", err)
		}
		return &payload, nil
	default:
		return nil, fmt.Errorf("unsupported command type %s", commandType)
	}
}

func (s *Server) executeCommand(w http.ResponseWriter, r *http.Request, nodeID string, cmd *api.Command) {
	ctx := context.WithoutCancel(r.Context())
	var cancel context.CancelFunc
	if s.cfg.CommandTimeout > 0 {
		ctx, cancel = context.WithTimeout(ctx, s.cfg.CommandTimeout)
		defer cancel()
	}
	res, err := s.dispatchCommand(ctx, nodeID, cmd)
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	writeProto(w, http.StatusOK, api.ToPBCommandResult(res))
}

func decodeProto(r *http.Request, dst proto.Message) error {
	if dst == nil {
		return fmt.Errorf("nil protobuf target")
	}
	raw, err := readRawProto(r)
	if err != nil {
		return err
	}
	if len(raw) == 0 {
		return fmt.Errorf("empty protobuf payload")
	}
	if err := proto.Unmarshal(raw, dst); err != nil {
		return fmt.Errorf("decode protobuf payload: %w", err)
	}
	return nil
}

func readRawProto(r *http.Request) ([]byte, error) {
	defer r.Body.Close()
	payload, err := io.ReadAll(io.LimitReader(r.Body, maxProtoPayloadBytes))
	if err != nil {
		return nil, err
	}
	return payload, nil
}

func writeProto(w http.ResponseWriter, code int, msg proto.Message) {
	if msg == nil {
		w.WriteHeader(code)
		return
	}
	payload, err := proto.Marshal(msg)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/x-protobuf")
	w.WriteHeader(code)
	_, _ = w.Write(payload)
}

func writeError(w http.ResponseWriter, code int, err error) {
	writeProto(w, code, &pb.ErrorResponse{
		Error:        err.Error(),
		TimeUnixNano: time.Now().UnixNano(),
	})
}

func toPBNodeSnapshot(snapshot api.NodeSnapshot) *pb.NodeSnapshot {
	out := &pb.NodeSnapshot{
		NodeId:           snapshot.NodeID,
		Connected:        snapshot.Connected,
		LastSeenUnixNano: snapshot.LastSeen,
		Registration:     api.ToPBRegistration(snapshot.Registration),
	}

	if len(snapshot.Latest) == 0 {
		return out
	}

	keys := make([]string, 0, len(snapshot.Latest))
	for category := range snapshot.Latest {
		keys = append(keys, category)
	}
	sort.Strings(keys)

	out.Latest = make([]*pb.MetricSample, 0, len(keys))
	for _, category := range keys {
		timed := snapshot.Latest[category]
		c := timed.Category
		if c == "" {
			c = api.MetricCategory(category)
		}
		out.Latest = append(out.Latest, api.ToPBMetricSample(api.MetricSample{
			Category: c,
			At:       timed.At,
			Payload:  timed.Payload,
		}))
	}
	return out
}

func toPBTimedSample(sample api.TimedSample) *pb.TimedSample {
	return &pb.TimedSample{
		NodeId: sample.NodeID,
		Sample: api.ToPBMetricSample(api.MetricSample{
			Category: sample.Category,
			At:       sample.At,
			Payload:  sample.Payload,
		}),
	}
}
