#!/bin/sh
set -eu
sample_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
repo_dir=$(CDPATH= cd -- "$sample_dir/../.." && pwd)
if [ -n "${GODOT_BIN:-}" ]; then
  godot_bin=$GODOT_BIN
elif command -v godot >/dev/null 2>&1; then
  godot_bin=$(command -v godot)
elif [ -x "$repo_dir/var/godot-runtime/Godot.app/Contents/MacOS/Godot" ]; then
  godot_bin="$repo_dir/var/godot-runtime/Godot.app/Contents/MacOS/Godot"
else
  echo "Install Godot 4.7 or newer, or set GODOT_BIN to its executable." >&2
  exit 1
fi
"$godot_bin" --headless --single-threaded-scene --path "$sample_dir" --editor --import --quit
exec "$godot_bin" --single-threaded-scene --path "$sample_dir" "$@"
