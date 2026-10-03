#!/bin/sh
set -eu
repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
runtime_dir="$repo_dir/var/godot-runtime"
if [ -n "${GODOT_APP:-}" ]; then
  test -x "$GODOT_APP/Contents/MacOS/Godot" || {
    echo "GODOT_APP must point to an executable official Godot macOS app." >&2
    exit 1
  }
  printf '%s\n' "$GODOT_APP"
  exit 0
fi
for candidate in "$runtime_dir/Godot.app" /Applications/Godot.app; do
  if [ -x "$candidate/Contents/MacOS/Godot" ]; then
    printf '%s\n' "$candidate"
    exit 0
  fi
done
version=4.7.2-stable
archive="Godot_v${version}_macos.universal.zip"
release="https://github.com/godotengine/godot-builds/releases/download/$version"
download_dir=$(mktemp -d)
trap 'rm -rf "$download_dir"' EXIT HUP INT TERM
curl --fail --location --retry 3 "$release/$archive" -o "$download_dir/$archive"
curl --fail --location --retry 3 "$release/SHA512-SUMS.txt" -o "$download_dir/checksums"
python3 - "$download_dir" "$archive" <<'PY'
import hashlib
import sys
from pathlib import Path

directory, name = Path(sys.argv[1]), sys.argv[2]
records = [line.split() for line in (directory / "checksums").read_text().splitlines()]
expected = [parts[0] for parts in records if len(parts) == 2 and parts[1].lstrip("*") == name]
actual = hashlib.sha512((directory / name).read_bytes()).hexdigest()
if expected != [actual]:
    raise SystemExit("Official Godot archive checksum mismatch")
PY
ditto -x -k "$download_dir/$archive" "$download_dir/unpacked"
test -x "$download_dir/unpacked/Godot.app/Contents/MacOS/Godot"
mkdir -p "$runtime_dir"
ditto "$download_dir/unpacked/Godot.app" "$runtime_dir/Godot.app"
printf '%s\n' "$runtime_dir/Godot.app"
