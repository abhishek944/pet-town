#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ARM="$ROOT/bin/macos-arm64/pet-village"
X64="$ROOT/bin/macos-x64/pet-village"
EXPECTED_SOURCE=$("$ROOT/scripts/package-source-fingerprint.sh")

[ -L "$ARM" ] && [ "$(readlink "$ARM")" = "pet-village.bin" ]
[ -L "$X64" ] && [ "$(readlink "$X64")" = "pet-village.bin" ]
[ -x "$ARM" ] && [ -x "$X64" ]
[ "$(cat "$ARM.source.sha256")" = "$EXPECTED_SOURCE" ]
[ "$(cat "$X64.source.sha256")" = "$EXPECTED_SOURCE" ]
file "$ARM" | grep -q 'Mach-O 64-bit executable arm64'
file "$X64" | grep -q 'Mach-O 64-bit executable x86_64'
for item in "macos-arm64:arm64" "macos-x64:x64"; do
  package=${item%%:*}; arch=${item#*:}
  archive="$ROOT/bin/$package/pet-village-pi-runtime.tar.gz"
  [ -f "$archive" ]
  runtime_hash=$(shasum -a 256 "$archive" | cut -d' ' -f1)
  strings "$ROOT/bin/$package/pet-village" | grep -F "$runtime_hash" >/dev/null
  runtime=$(mktemp -d "${TMPDIR:-/tmp}/pet-village-runtime-check.XXXXXX")
  trap 'rm -rf "$runtime"' EXIT INT TERM
  tar -xzf "$archive" -C "$runtime"
  [ -x "$runtime/node" ] && [ -x "$runtime/bin/pi" ]
  python3 - "$runtime" "$arch" <<'PY'
import hashlib,json,pathlib,sys
root=pathlib.Path(sys.argv[1]); data=json.loads((root/'runtime-manifest.json').read_text())
def sha(path): return hashlib.sha256((root/path).read_bytes()).hexdigest()
assert data['formatVersion']==1 and data['architecture']==sys.argv[2]
assert data['nodeVersion']=='22.21.1' and data['piVersion']=='0.85.1'
assert data['nodeSha256']==sha('node')
assert data['launcherSha256']==sha('bin/pi')
assert data['entrypointSha256']==sha('package/node_modules/@earendil-works/pi-coding-agent/dist/cli.js')
assert all(sha(path)==digest for path,digest in data['files'].items())
actual={str(path.relative_to(root)) for path in root.rglob('*') if path.is_file()}
assert actual==set(data['files'])|{'runtime-manifest.json'}
assert not any(path.is_symlink() for path in root.rglob('*'))
esbuild=f"package/node_modules/@earendil-works/pi-coding-agent/node_modules/@esbuild/darwin-{sys.argv[2]}/bin/esbuild"
assert esbuild in actual
PY
  file "$runtime/node" | grep -q "$( [ "$arch" = arm64 ] && echo arm64 || echo x86_64 )"
  file "$runtime/package/node_modules/@earendil-works/pi-coding-agent/node_modules/@esbuild/darwin-$arch/bin/esbuild" | grep -q "$( [ "$arch" = arm64 ] && echo arm64 || echo x86_64 )"
  rm -rf "$runtime"
  trap - EXIT INT TERM
done

if [ "${CHECK_PACKAGED_SKIP_BINARY_COMPARE:-0}" != 1 ]; then
  case "$(uname -m)" in
    arm64)
      native="$ROOT/src-tauri/target/aarch64-apple-darwin/release/pet-village"
      [ -x "$native" ] || native="$ROOT/src-tauri/target/release/pet-village"
      cmp "$native" "$ARM"
      ;;
    x86_64)
      native="$ROOT/src-tauri/target/x86_64-apple-darwin/release/pet-village"
      [ -x "$native" ] || native="$ROOT/src-tauri/target/release/pet-village"
      cmp "$native" "$X64"
      ;;
  esac
  if [ -x "$ROOT/src-tauri/target/x86_64-apple-darwin/release/pet-village" ]; then
    cmp "$ROOT/src-tauri/target/x86_64-apple-darwin/release/pet-village" "$X64"
  fi
  if [ -x "$ROOT/src-tauri/target/aarch64-apple-darwin/release/pet-village" ]; then
    cmp "$ROOT/src-tauri/target/aarch64-apple-darwin/release/pet-village" "$ARM"
  fi
fi

echo "packaged macOS binaries: pass"
