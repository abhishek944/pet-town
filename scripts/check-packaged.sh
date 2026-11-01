#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
app_dir=pet-town
artifact=pet-town
binary_name=pet-town
ARM="$ROOT/bin/macos-arm64/$artifact"
X64="$ROOT/bin/macos-x64/$artifact"
EXPECTED_SOURCE=$("$ROOT/scripts/package-source-fingerprint.sh")

[ -L "$ARM" ] && [ "$(readlink "$ARM")" = "$artifact.bin" ]
[ -L "$X64" ] && [ "$(readlink "$X64")" = "$artifact.bin" ]
[ -x "$ARM" ] && [ -x "$X64" ]
[ "$(cat "$ARM.source.sha256")" = "$EXPECTED_SOURCE" ]
[ "$(cat "$X64.source.sha256")" = "$EXPECTED_SOURCE" ]
file "$ARM" | grep -q 'Mach-O 64-bit executable arm64'
file "$X64" | grep -q 'Mach-O 64-bit executable x86_64'
if [ "${CHECK_PACKAGED_SKIP_BINARY_COMPARE:-0}" != 1 ]; then
  case "$(uname -m)" in
  arm64)
    native="$ROOT/apps/$app_dir/src-tauri/target/aarch64-apple-darwin/release/$binary_name"
    [ -x "$native" ] || native="$ROOT/apps/$app_dir/src-tauri/target/release/$binary_name"
    cmp "$native" "$ARM"
    ;;
  x86_64)
    native="$ROOT/apps/$app_dir/src-tauri/target/x86_64-apple-darwin/release/$binary_name"
    [ -x "$native" ] || native="$ROOT/apps/$app_dir/src-tauri/target/release/$binary_name"
    cmp "$native" "$X64"
    ;;
  esac
  if [ -x "$ROOT/apps/$app_dir/src-tauri/target/x86_64-apple-darwin/release/$binary_name" ]; then
    cmp "$ROOT/apps/$app_dir/src-tauri/target/x86_64-apple-darwin/release/$binary_name" "$X64"
  fi
  if [ -x "$ROOT/apps/$app_dir/src-tauri/target/aarch64-apple-darwin/release/$binary_name" ]; then
    cmp "$ROOT/apps/$app_dir/src-tauri/target/aarch64-apple-darwin/release/$binary_name" "$ARM"
  fi
fi

echo "packaged macOS binaries: pass"
