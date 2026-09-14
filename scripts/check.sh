#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

npm run check:quality
npm run check:lines
npm run check:flow
npm run check:focus
npm run check:interactions
npm run check:preferences
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
sh scripts/check-packaged.sh
