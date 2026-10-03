#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

case "${1:-}" in
dev | build) mode=$1 ;;
*)
  echo "usage: pnpm run dev | pnpm run build" >&2
  exit 2
  ;;
esac
if [ "$#" -ne 1 ]; then
  echo "usage: pnpm run dev | pnpm run build" >&2
  exit 2
fi

# Stop only this checkout's desktop and frontend processes.
# Preserve Cargo's target directory so Rust builds remain incremental.
python3 "$ROOT/scripts/stop-dev-towns.py"

if [ "$mode" = build ]; then
  echo "Clearing generated frontend caches and app output (preserving Cargo target)..."
  rm -rf "$ROOT/apps/pet-town/dist" \
    "$ROOT/apps/pet-town-3d/dist" \
    "$ROOT/apps/pet-town/node_modules/.vite" \
    "$ROOT/apps/pet-town-3d/node_modules/.vite" \
    "$ROOT/node_modules/.vite" \
    "$ROOT/.turbo"
  exec "$ROOT/scripts/build.sh"
fi

pnpm install --frozen-lockfile
if [ "$(uname -s)" = Darwin ]; then
  GODOT_APP=$(sh "$ROOT/scripts/prepare-godot-engine.sh")
  export GODOT_BIN="$GODOT_APP/Contents/MacOS/Godot"
  export PET_TOWN_GODOT_EXECUTABLE="$GODOT_BIN"
  python3 "$ROOT/scripts/validate-godot-export.py"
  "$GODOT_BIN" --headless --single-threaded-scene --path "$ROOT/apps/pet-town-godot-sample" --editor --import --quit
fi
# Tauri's compile-time context needs frontendDist even when dev uses Vite.
pnpm --filter @pet-town/desktop run internal:build-frontend
# The frontend hook starts and owns both Vite servers (1420 and 1422).
if [ "$(uname -s)" = Darwin ]; then
  case "$(uname -m)" in
  arm64) export CARGO_TARGET_AARCH64_APPLE_DARWIN_RUNNER="$ROOT/scripts/run-pet-town-debug.sh" ;;
  x86_64) export CARGO_TARGET_X86_64_APPLE_DARWIN_RUNNER="$ROOT/scripts/run-pet-town-debug.sh" ;;
  esac
fi
exec pnpm --filter @pet-town/desktop exec tauri dev
