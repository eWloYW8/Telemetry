package agent

import (
	"fmt"
	"sync"
	"time"

	control "telemetry/agent/executor"
	"telemetry/api"
)

type commandDispatcher struct {
	nodeID   string
	executor *control.Executor
	emit     func(*api.CommandResult)
	timeout  time.Duration

	mu      sync.Mutex
	workers map[api.CommandType]*commandWorker
}

type commandWorker struct {
	dispatcher *commandDispatcher
	cmdType    api.CommandType

	mu     sync.Mutex
	cond   *sync.Cond
	queued *api.Command
	closed bool
}

func newCommandDispatcher(nodeID string, executor *control.Executor, timeout time.Duration, emit func(*api.CommandResult)) *commandDispatcher {
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	return &commandDispatcher{
		nodeID:   nodeID,
		executor: executor,
		emit:     emit,
		timeout:  timeout,
		workers:  make(map[api.CommandType]*commandWorker, 8),
	}
}

func (d *commandDispatcher) Submit(cmd *api.Command) error {
	if d == nil {
		return fmt.Errorf("command dispatcher is nil")
	}
	if cmd == nil {
		return fmt.Errorf("command is nil")
	}

	w := d.getOrCreateWorker(cmd.Type)
	w.enqueue(cmd)
	return nil
}

func (d *commandDispatcher) getOrCreateWorker(cmdType api.CommandType) *commandWorker {
	d.mu.Lock()
	defer d.mu.Unlock()

	if w, ok := d.workers[cmdType]; ok {
		return w
	}
	w := &commandWorker{
		dispatcher: d,
		cmdType:    cmdType,
	}
	w.cond = sync.NewCond(&w.mu)
	d.workers[cmdType] = w
	go w.run()
	return w
}

func (d *commandDispatcher) Close() {
	d.mu.Lock()
	workers := make([]*commandWorker, 0, len(d.workers))
	for _, w := range d.workers {
		workers = append(workers, w)
	}
	d.mu.Unlock()

	for _, w := range workers {
		w.close()
	}
}

func (w *commandWorker) enqueue(cmd *api.Command) {
	var superseded *api.Command

	w.mu.Lock()
	if w.closed {
		w.mu.Unlock()
		return
	}
	if w.queued != nil {
		superseded = w.queued
	}
	w.queued = cmd
	w.cond.Signal()
	w.mu.Unlock()

	if superseded != nil {
		w.dispatcher.emit(w.supersededResult(superseded))
	}
}

func (w *commandWorker) run() {
	for {
		cmd := w.next()
		if cmd == nil {
			return
		}
		w.dispatcher.emit(w.executeWithTimeout(cmd))
	}
}

func (w *commandWorker) executeWithTimeout(cmd *api.Command) *api.CommandResult {
	timeout := w.dispatcher.timeout
	if timeout <= 0 {
		return w.dispatcher.executor.Execute(w.dispatcher.nodeID, cmd)
	}

	resultCh := make(chan *api.CommandResult, 1)
	go func() {
		resultCh <- w.dispatcher.executor.Execute(w.dispatcher.nodeID, cmd)
	}()

	timer := time.NewTimer(timeout)
	defer timer.Stop()

	select {
	case result := <-resultCh:
		return result
	case <-timer.C:
		commandID := ""
		commandType := w.cmdType
		if cmd != nil {
			commandID = cmd.ID
			commandType = cmd.Type
		}
		return &api.CommandResult{
			CommandID:  commandID,
			NodeID:     w.dispatcher.nodeID,
			Type:       commandType,
			Success:    false,
			Error:      "command execution timeout",
			FinishedAt: time.Now().UnixNano(),
		}
	}
}

func (w *commandWorker) next() *api.Command {
	w.mu.Lock()
	defer w.mu.Unlock()

	for !w.closed && w.queued == nil {
		w.cond.Wait()
	}
	if w.closed {
		return nil
	}
	cmd := w.queued
	w.queued = nil
	return cmd
}

func (w *commandWorker) close() {
	w.mu.Lock()
	if w.closed {
		w.mu.Unlock()
		return
	}
	w.closed = true
	w.cond.Broadcast()
	remaining := w.queued
	w.queued = nil
	w.mu.Unlock()

	if remaining != nil {
		w.dispatcher.emit(w.supersededResult(remaining))
	}
}

func (w *commandWorker) supersededResult(cmd *api.Command) *api.CommandResult {
	commandID := ""
	commandType := w.cmdType
	if cmd != nil {
		commandID = cmd.ID
		commandType = cmd.Type
	}
	return &api.CommandResult{
		CommandID:  commandID,
		NodeID:     w.dispatcher.nodeID,
		Type:       commandType,
		Success:    false,
		Error:      "superseded by newer command of same type",
		FinishedAt: time.Now().UnixNano(),
	}
}
