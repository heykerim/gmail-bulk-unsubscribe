#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="$ROOT/dist/gmail-bulk-unsubscribe-v1.0.0.zip"

rm -rf "$ROOT/dist"
mkdir -p "$ROOT/dist"

(
  cd "$ROOT/extension"
  zip -qr "$OUTPUT" . \
    -x '*.DS_Store' \
    -x '__MACOSX/*'
)

unzip -Z1 "$OUTPUT" | grep -qx 'manifest.json'

echo "Built $OUTPUT"
