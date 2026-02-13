.PHONY: run-server run-agent fmt test proto

run-server:
	go run ./cmd/telemetry-server -config configs/server.yaml

run-agent:
	go run ./cmd/telemetry-agent -config configs/agent.yaml

fmt:
	gofmt -w $(shell find . -name '*.go')

test:
	go test ./...

proto:
	PATH="$(PATH):$$(go env GOPATH)/bin" protoc -I . --go_out=paths=source_relative:. internal/agent/modules/cpu/pb/cpu.proto internal/agent/modules/gpu/pb/gpu.proto internal/agent/modules/memory/pb/memory.proto internal/agent/modules/storage/pb/storage.proto internal/agent/modules/network/pb/network.proto internal/agent/modules/process/pb/process.proto
	PATH="$(PATH):$$(go env GOPATH)/bin" protoc -I . --go_out=paths=source_relative:. --go-grpc_out=paths=source_relative:. internal/api/pb/telemetry.proto
	PATH="$(PATH):$$(go env GOPATH)/bin" protoc -I . --go_out=paths=source_relative:. internal/api/pb/http.proto
