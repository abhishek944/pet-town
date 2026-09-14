#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

npm ci
runtime_archive=""
case "$(uname -s):$(uname -m)" in
  Darwin:arm64) "$ROOT/scripts/prepare-pi-runtime.sh" macos-arm64; runtime_archive="$ROOT/bin/macos-arm64/pet-village-pi-runtime.tar.gz" ;;
  Darwin:x86_64) "$ROOT/scripts/prepare-pi-runtime.sh" macos-x64; runtime_archive="$ROOT/bin/macos-x64/pet-village-pi-runtime.tar.gz" ;;
esac
if [ -n "$runtime_archive" ]; then
  mkdir -p "$ROOT/src-tauri/resources"
  cp "$runtime_archive" "$ROOT/src-tauri/resources/pet-village-pi-runtime.tar.gz"
fi
npm run tauri build -- --no-bundle

case "$(uname -s):$(uname -m)" in
  Darwin:arm64) package_dir="$ROOT/bin/macos-arm64" ;;
  Darwin:x86_64) package_dir="$ROOT/bin/macos-x64" ;;
  *) package_dir="" ;;
esac

if [ -n "$package_dir" ]; then
  mkdir -p "$package_dir"
  install -m 755 "$ROOT/src-tauri/target/release/pet-village" "$package_dir/pet-village.bin"
  rm -f "$package_dir/pet-village"
  ln -s pet-village.bin "$package_dir/pet-village"
  "$ROOT/scripts/package-source-fingerprint.sh" > "$package_dir/pet-village.source.sha256"
  echo "packaged: $package_dir/pet-village"
fi

echo "built: $ROOT/src-tauri/target/release/pet-village"
