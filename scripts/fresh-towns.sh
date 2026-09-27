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

# Use the same Godot search order as the desktop's Open 3D Town action.
if [ -n "${PET_TOWN_GODOT_BIN:-}" ]; then
  godot=$PET_TOWN_GODOT_BIN
elif [ -x /Applications/Godot.app/Contents/MacOS/Godot ]; then
  godot=/Applications/Godot.app/Contents/MacOS/Godot
elif [ -x "$ROOT/var/godot-runtime/Godot.app/Contents/MacOS/Godot" ]; then
  godot="$ROOT/var/godot-runtime/Godot.app/Contents/MacOS/Godot"
elif [ -x "${HOME:-}/Applications/Godot.app/Contents/MacOS/Godot" ]; then
  godot="${HOME:-}/Applications/Godot.app/Contents/MacOS/Godot"
else
  godot=$(command -v godot || command -v Godot || true)
fi
if [ ! -x "$godot" ]; then
  echo "Godot 4 is required. Install it or set PET_TOWN_GODOT_BIN to its executable." >&2
  exit 1
fi
case "$godot" in
/*) ;;
*) godot="$ROOT/$godot" ;;
esac
project=${PET_TOWN_GODOT_PROJECT:-$ROOT/apps/pet-town-godot-next}
export PET_TOWN_GODOT_PROJECT="$project"
if [ ! -f "$project/project.godot" ] ||
  [ ! -f "$project/assets/world/world-base.glb" ] ||
  [ ! -f "$project/assets/world/ground-collision.res" ] ||
  [ ! -f "$project/assets/world/ground-navigation.res" ]; then
  echo "The new 3D town's island or navigation assets are missing." >&2
  exit 1
fi

# Both public commands stop only this checkout's desktop/Godot processes.
# Preserve Cargo's target directory so Rust builds can remain incremental.
python3 "$ROOT/scripts/stop-dev-towns.py"

export PET_TOWN_GODOT_BIN="$godot"
if [ "$mode" = build ]; then
  echo "Clearing generated frontend/Godot caches and app output (preserving Cargo target)..."
  rm -rf "$ROOT/apps/pet-town/dist" \
    "$ROOT/apps/pet-town/node_modules/.vite" \
    "$ROOT/node_modules/.vite" \
    "$project/.godot" \
    "$ROOT/.turbo"
fi

if [ "$mode" = build ] || [ ! -f "$project/.godot/uid_cache.bin" ] ||
  [ -n "${PET_TOWN_FORCE_IMPORT:-}" ] ||
  [ -n "$(find "$project/assets" -type f \( -name '*.glb' -o -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' \) -newer "$project/.godot/uid_cache.bin" -print -quit 2>/dev/null)" ]; then
  echo "Importing the 3D town from source..."
  "$godot" --headless --editor --path "$project" --quit
else
  echo "Using the existing Godot import cache."
fi

if [ "$mode" = dev ]; then
  pnpm install --frozen-lockfile
  # Tauri's compile-time context needs frontendDist even when dev uses Vite.
  pnpm --filter @pet-town/desktop run internal:build-frontend
  # Cargo normally launches target/debug/pet-town, which macOS labels "pet-town".
  # Run a debug-named copy so its Dock entry is distinct from the installed app.
  if [ "$(uname -s)" = Darwin ]; then
    case "$(uname -m)" in
    arm64) export CARGO_TARGET_AARCH64_APPLE_DARWIN_RUNNER="$ROOT/scripts/run-pet-town-debug.sh" ;;
    x86_64) export CARGO_TARGET_X86_64_APPLE_DARWIN_RUNNER="$ROOT/scripts/run-pet-town-debug.sh" ;;
    esac
  fi
  exec pnpm --filter @pet-town/desktop exec tauri dev
fi
exec "$ROOT/scripts/build.sh"
