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
project="$ROOT/apps/pet-town-godot"
if [ ! -f "$project/assets/cozy-island/grand-moonhaven.glb" ] ||
  [ ! -f "$project/assets/cozy-island/reference-gardens.glb" ] ||
  [ ! -f "$project/navigation/town_walkable.res" ] ||
  [ ! -f "$project/navigation/town_collision.res" ] ||
  [ ! -d "$project/assets/cozy-island/render_sections" ]; then
  echo "The local 3D town's purchased island and baked assets are missing. See apps/pet-town-godot/README.md." >&2
  exit 1
fi

# Both public commands stop only this checkout's desktop/Godot processes.
# Preserve Cargo's target directory so Rust builds can remain incremental.
python3 "$ROOT/scripts/stop-dev-towns.py"

# Keep purchased GLBs, authored baked meshes, navigation/collision,
# dependencies, user preferences, the Godot runtime, and Cargo's build cache.
# Refresh generated frontend outputs and Godot import state without cleaning Rust.
echo "Clearing generated frontend/Godot caches and app output (preserving Cargo target)..."
rm -rf "$ROOT/apps/pet-town/dist" \
  "$ROOT/apps/pet-town/node_modules/.vite" \
  "$ROOT/node_modules/.vite" \
  "$ROOT/apps/pet-town-godot/.godot" \
  "$ROOT/.turbo"

export PET_TOWN_GODOT_BIN="$godot"
echo "Importing the 3D town from source..."
"$godot" --headless --editor --path "$project" --quit

if [ "$mode" = dev ]; then
  pnpm install --frozen-lockfile
  # Tauri's compile-time context needs frontendDist even when dev uses Vite.
  pnpm --filter @pet-town/desktop run internal:build-frontend
  exec pnpm --filter @pet-town/desktop exec tauri dev
fi
exec "$ROOT/scripts/build.sh"
