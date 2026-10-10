#!/bin/sh
set -eu
repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
world_dir="$repo_dir/apps/pet-town-godot-sample"
resource_dir="$repo_dir/apps/pet-town/src-tauri/resources/godot"
package=${1:-${PACKAGE:-}}
case "$package" in
macos-arm64 | macos-x64) ;;
*)
  echo "usage: $0 macos-arm64|macos-x64" >&2
  exit 2
  ;;
esac
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
# Derived native data is content-addressed; build it before the pack is exported.
if ! "$godot_app/Contents/MacOS/Godot" --headless --single-threaded-scene --path "$world_dir" \
  --script res://tools/prepare-native.gd >"$diagnostics" 2>&1; then
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
# Share identical texture/data payloads without changing any resource path or byte.
python3 "$repo_dir/scripts/deduplicate-godot-pack.py" "$resource_dir/world/PetTown.pck"
# Preserve the branded app path, but ship a target-specific game-only runtime.
GODOT_APP="$godot_app" sh "$repo_dir/scripts/prepare-pet-town-runtime.sh" \
  "$resource_dir/Pet Town.app" "$package" "$resource_dir/world/PetTown.pck"
# The signed native app now owns the pack; do not bundle another copy.
rm -rf "$resource_dir/Godot.app" "$resource_dir/world"
echo "Native Godot release runtime ($package) and full town pack prepared."
