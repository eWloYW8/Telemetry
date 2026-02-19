.PHONY: run-server run-agent fmt test proto ui-build ui-install

run-server:
	go run ./cmd/telemetry-server -config configs/server.yaml

run-agent:
	go run ./cmd/telemetry-agent -config configs/agent.yaml

fmt:
	gofmt -w $(shell find . -name '*.go')

test:
	go test ./...

ui-install:
	cd web && pnpm install

ui-build:
	cd web && pnpm run proto:gen && pnpm build
	mkdir -p server/ui_dist
	rsync -a --delete web/out/ server/ui_dist/

proto:
	PATH="$(PATH):$$(go env GOPATH)/bin" protoc -I . --go_out=paths=source_relative:. agent/modules/cpu/pb/cpu.proto agent/modules/gpu/pb/gpu.proto agent/modules/memory/pb/memory.proto agent/modules/storage/pb/storage.proto agent/modules/network/pb/network.proto agent/modules/infiniband/pb/infiniband.proto agent/modules/process/pb/process.proto
	PATH="$(PATH):$$(go env GOPATH)/bin" protoc -I . --go_out=paths=source_relative:. --go-grpc_out=paths=source_relative:. api/pb/telemetry.proto
	PATH="$(PATH):$$(go env GOPATH)/bin" protoc -I . --go_out=paths=source_relative:. api/pb/http.proto
