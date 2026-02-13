package server

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
	"google.golang.org/protobuf/proto"

	"telemetry/api"
	pb "telemetry/api/pb"
)

const (
	wsDefaultClientQueue = 1024
	wsReadLimitBytes     = 1 << 20
	wsWriteTimeout       = 10 * time.Second
	wsPongWait           = 60 * time.Second
	wsPingPeriod         = 20 * time.Second
)

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(_ *http.Request) bool {
		return true
	},
}

type wsBroadcast struct {
	nodeID   string
	category string
	payload  []byte
}

type wsHub struct {
	log        zerolog.Logger
	register   chan *wsClient
	unregister chan *wsClient
	broadcast  chan wsBroadcast
	clients    map[*wsClient]struct{}
}

func newWSHub(logger zerolog.Logger) *wsHub {
	return &wsHub{
		log:        logger,
		register:   make(chan *wsClient, 256),
		unregister: make(chan *wsClient, 256),
		broadcast:  make(chan wsBroadcast, 8192),
		clients:    make(map[*wsClient]struct{}),
	}
}

func (h *wsHub) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			for c := range h.clients {
				close(c.send)
				_ = c.conn.Close()
			}
			return
		case c := <-h.register:
			h.clients[c] = struct{}{}
		case c := <-h.unregister:
			if _, ok := h.clients[c]; ok {
				delete(h.clients, c)
				close(c.send)
				_ = c.conn.Close()
			}
		case event := <-h.broadcast:
			for c := range h.clients {
				if !c.match(event.nodeID, event.category) {
					continue
				}
				select {
				case c.send <- event.payload:
				default:
					delete(h.clients, c)
					close(c.send)
					_ = c.conn.Close()
					h.log.Warn().Str("remote_addr", c.remoteAddr).Msg("ws client is too slow, dropped")
				}
			}
		}
	}
}

func (h *wsHub) Register(c *wsClient) {
	h.register <- c
}

func (h *wsHub) Unregister(c *wsClient) {
	h.unregister <- c
}

func (h *wsHub) PublishMetrics(nodeID string, samples []api.MetricSample) {
	for _, sample := range samples {
		msg := &pb.WSOutgoingMessage{
			Type: "metric",
			Metric: &pb.TimedSample{
				NodeId: nodeID,
				Sample: api.ToPBMetricSample(sample),
			},
		}
		payload, err := proto.Marshal(msg)
		if err != nil {
			continue
		}
		select {
		case h.broadcast <- wsBroadcast{nodeID: nodeID, category: string(sample.Category), payload: payload}:
		default:
			h.log.Warn().Str("node_id", nodeID).Msg("ws broadcast queue full, dropping realtime sample")
		}
	}
}

type wsClient struct {
	conn       *websocket.Conn
	send       chan []byte
	remoteAddr string

	mu         sync.RWMutex
	nodes      map[string]struct{}
	categories map[string]struct{}
}

func newWSClient(conn *websocket.Conn, remoteAddr string, nodes, categories map[string]struct{}, queueSize int) *wsClient {
	if queueSize <= 0 {
		queueSize = wsDefaultClientQueue
	}
	return &wsClient{
		conn:       conn,
		send:       make(chan []byte, queueSize),
		remoteAddr: remoteAddr,
		nodes:      nodes,
		categories: categories,
	}
}

func (c *wsClient) match(nodeID, category string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if len(c.nodes) > 0 {
		if _, ok := c.nodes[nodeID]; !ok {
			return false
		}
	}
	if len(c.categories) > 0 {
		if _, ok := c.categories[category]; !ok {
			return false
		}
	}
	return true
}

func (c *wsClient) setFilters(nodes, categories map[string]struct{}) {
	c.mu.Lock()
	c.nodes = nodes
	c.categories = categories
	c.mu.Unlock()
}

func (c *wsClient) writePump() {
	pingTicker := time.NewTicker(wsPingPeriod)
	defer pingTicker.Stop()

	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(wsWriteTimeout))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.BinaryMessage, msg); err != nil {
				return
			}
		case <-pingTicker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(wsWriteTimeout))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *wsClient) readPump() error {
	c.conn.SetReadLimit(wsReadLimitBytes)
	_ = c.conn.SetReadDeadline(time.Now().Add(wsPongWait))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(wsPongWait))
		return nil
	})

	for {
		msgType, payload, err := c.conn.ReadMessage()
		if err != nil {
			return err
		}
		if msgType != websocket.BinaryMessage || len(payload) == 0 {
			continue
		}
		var ctrl pb.WSClientControl
		if err := proto.Unmarshal(payload, &ctrl); err != nil {
			continue
		}
		if strings.EqualFold(ctrl.GetOp(), "subscribe") {
			c.setFilters(sliceToSet(ctrl.GetNodes()), sliceToSet(ctrl.GetCategories()))
		}
	}
}

func (s *Server) handleWSMetrics(w http.ResponseWriter, r *http.Request) {
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		s.log.Warn().Err(err).Msg("websocket upgrade failed")
		return
	}

	queueSize := wsDefaultClientQueue
	if raw := r.URL.Query().Get("queue"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v >= 64 && v <= 65536 {
			queueSize = v
		}
	}
	client := newWSClient(
		conn,
		r.RemoteAddr,
		csvToSet(r.URL.Query().Get("nodes")),
		csvToSet(r.URL.Query().Get("categories")),
		queueSize,
	)

	s.wsHub.Register(client)
	defer s.wsHub.Unregister(client)

	welcome, _ := proto.Marshal(&pb.WSOutgoingMessage{
		Type: "welcome",
		Welcome: &pb.WSWelcome{
			ServerTimeUnixNano: time.Now().UnixNano(),
			Nodes:              setToSortedSlice(client.nodes),
			Categories:         setToSortedSlice(client.categories),
		},
	})
	select {
	case client.send <- welcome:
	default:
	}

	go client.writePump()
	if err := client.readPump(); err != nil && !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
		s.log.Debug().Err(err).Str("remote_addr", r.RemoteAddr).Msg("ws client closed")
	}
}

func csvToSet(s string) map[string]struct{} {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make(map[string]struct{}, len(parts))
	for _, p := range parts {
		v := strings.TrimSpace(p)
		if v == "" {
			continue
		}
		out[v] = struct{}{}
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func sliceToSet(values []string) map[string]struct{} {
	if len(values) == 0 {
		return nil
	}
	out := make(map[string]struct{}, len(values))
	for _, v := range values {
		v = strings.TrimSpace(v)
		if v == "" {
			continue
		}
		out[v] = struct{}{}
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func setToSortedSlice(in map[string]struct{}) []string {
	if len(in) == 0 {
		return nil
	}
	out := make([]string, 0, len(in))
	for k := range in {
		out = append(out, k)
	}
	for i := 1; i < len(out); i++ {
		for j := i; j > 0 && out[j] < out[j-1]; j-- {
			out[j], out[j-1] = out[j-1], out[j]
		}
	}
	return out
}
