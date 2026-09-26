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
if [ "$project" = "$ROOT/apps/pet-town-godot" ]; then
  if [ ! -f "$project/assets/cozy-island/grand-moonhaven.glb" ] ||
    [ ! -f "$project/assets/cozy-island/reference-gardens.glb" ] ||
    [ ! -f "$project/navigation/town_walkable.res" ] ||
    [ ! -f "$project/navigation/town_collision.res" ] ||
    [ ! -d "$project/assets/cozy-island/render_sections" ]; then
    echo "The old 3D town's baked assets are missing. See apps/pet-town-godot/README.md." >&2
    exit 1
  fi
elif [ ! -f "$project/project.godot" ] ||
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

if [ "$project" = "$ROOT/apps/pet-town-godot" ]; then
if [ ! -f "$project/navigation/town_ground.res" ] ||
  [ "$project/tools/bake_town_navigation.gd" -nt "$project/navigation/town_ground.res" ] ||
  [ "$project/assets/cozy-island/grand-moonhaven.glb" -nt "$project/navigation/town_ground.res" ]; then
  echo "Baking the 3D town's ground and navigation surfaces..."
  "$godot" --headless --path "$project" --script res://tools/bake_town_navigation.gd
fi

render_source="$project/scenes/island_render_sections.tscn"
render_binary="$project/scenes/island_render_sections.scn"
render_builder="$project/tools/partition_render_sections.gd"
mesh_reuse="$project/tools/reuse_mesh_resources.gd"
shadow_budget="$project/scripts/town_shadow_budget.gd"
if [ ! -f "$render_source" ] || [ "$render_builder" -nt "$render_source" ] ||
  [ "$mesh_reuse" -nt "$render_source" ] ||
  [ "$project/scenes/warm_island.tscn" -nt "$render_source" ] ||
  [ "$project/assets/cozy-island/grand-moonhaven.glb" -nt "$render_source" ] ||
  [ "$shadow_budget" -nt "$render_source" ]; then
  echo "Refreshing the authored island render sections..."
  "$godot" --headless --path "$project" --script res://tools/partition_render_sections.gd
fi
if [ ! -f "$render_binary" ] || [ "$render_source" -nt "$render_binary" ]; then
  echo "Compiling the authored island scene for faster 3D startup..."
  "$godot" --headless --path "$project" --script "$ROOT/scripts/compile-island-scene.gd"
fi

reference_source="$project/assets/cozy-island/reference-gardens-editable.glb"
reference_binary="$project/scenes/reference_gardens_trimmed.scn"
reference_compiler="$project/tools/compile_reference_gardens.gd"
if [ ! -f "$reference_binary" ] || [ "$reference_source" -nt "$reference_binary" ] ||
  [ "$reference_compiler" -nt "$reference_binary" ] ||
  [ "$shadow_budget" -nt "$reference_binary" ]; then
  echo "Compiling the reference gardens without redundant sea tiles..."
  "$godot" --headless --path "$project" --script res://tools/compile_reference_gardens.gd
fi
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
