#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_DIR="${ROOT_DIR}/web"
PROTO_ROOT="${WEB_DIR}/proto"

mkdir -p "${PROTO_ROOT}/api/pb"
mkdir -p "${PROTO_ROOT}/agent/modules/cpu/pb"
mkdir -p "${PROTO_ROOT}/agent/modules/gpu/pb"
mkdir -p "${PROTO_ROOT}/agent/modules/memory/pb"
mkdir -p "${PROTO_ROOT}/agent/modules/network/pb"
mkdir -p "${PROTO_ROOT}/agent/modules/process/pb"
mkdir -p "${PROTO_ROOT}/agent/modules/storage/pb"

cp "${ROOT_DIR}/api/pb/http.proto" "${PROTO_ROOT}/api/pb/http.proto"
cp "${ROOT_DIR}/api/pb/telemetry.proto" "${PROTO_ROOT}/api/pb/telemetry.proto"
cp "${ROOT_DIR}/agent/modules/cpu/pb/cpu.proto" "${PROTO_ROOT}/agent/modules/cpu/pb/cpu.proto"
cp "${ROOT_DIR}/agent/modules/gpu/pb/gpu.proto" "${PROTO_ROOT}/agent/modules/gpu/pb/gpu.proto"
cp "${ROOT_DIR}/agent/modules/memory/pb/memory.proto" "${PROTO_ROOT}/agent/modules/memory/pb/memory.proto"
cp "${ROOT_DIR}/agent/modules/network/pb/network.proto" "${PROTO_ROOT}/agent/modules/network/pb/network.proto"
cp "${ROOT_DIR}/agent/modules/process/pb/process.proto" "${PROTO_ROOT}/agent/modules/process/pb/process.proto"
cp "${ROOT_DIR}/agent/modules/storage/pb/storage.proto" "${PROTO_ROOT}/agent/modules/storage/pb/storage.proto"

mkdir -p "${WEB_DIR}/src/lib/proto"
cd "${WEB_DIR}"
pnpm exec pbjs -t static-module -w es6 -p proto -o src/lib/proto/telemetry.js proto/api/pb/http.proto
pnpm exec pbts -o src/lib/proto/telemetry.d.ts src/lib/proto/telemetry.js
