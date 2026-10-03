#!/bin/sh
set -eu
repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
world_dir="$repo_dir/apps/pet-town-godot-sample"
resource_dir="$repo_dir/apps/pet-town/src-tauri/resources/godot"
godot_app=$(sh "$repo_dir/scripts/prepare-godot-engine.sh")
python3 "$repo_dir/scripts/validate-godot-export.py"
mkdir -p "$resource_dir/world"
diagnostics=$(mktemp)
trap 'rm -f "$diagnostics"' EXIT HUP INT TERM
if ! "$godot_app/Contents/MacOS/Godot" --headless --single-threaded-scene --path "$world_dir" --editor --import --quit >"$diagnostics" 2>&1; then
  cat "$diagnostics"
  exit 1
fi
if grep -Eq '^SCRIPT ERROR:|^ERROR:' "$diagnostics"; then
  cat "$diagnostics"
  exit 1
fi
if ! "$godot_app/Contents/MacOS/Godot" --headless --single-threaded-scene --path "$world_dir" \
  --export-pack "Pet Town world pack" "$resource_dir/world/PetTown.pck" >"$diagnostics" 2>&1; then
  cat "$diagnostics"
  exit 1
fi
if grep -Eq '^SCRIPT ERROR:|^ERROR:' "$diagnostics"; then
  cat "$diagnostics"
  exit 1
fi
test -s "$resource_dir/world/PetTown.pck"
# Stage the official engine app together with the immutable source-derived world.
# ditto preserves the existing signed universal runtime and its app metadata.
ditto "$godot_app" "$resource_dir/Godot.app"
echo "Native Godot runtime and full town pack prepared."
