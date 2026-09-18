#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
app_choice=${PET_VILLAGE_APP:-v1}
case "$app_choice" in
v1)
  app_dir=pet-village
  artifact=pet-village
  binary_name=pet-village
  has_runtime=1
  ;;
v2)
  app_dir=pet-village-v2
  artifact=pet-village-v2
  binary_name=pet-village-v2
  has_runtime=0
  ;;
*)
  echo "PET_VILLAGE_APP must be v1 or v2, received: $app_choice" >&2
  exit 2
  ;;
esac
ARM="$ROOT/bin/macos-arm64/$artifact"
X64="$ROOT/bin/macos-x64/$artifact"
EXPECTED_SOURCE=$(PET_VILLAGE_APP="$app_choice" "$ROOT/scripts/package-source-fingerprint.sh")

[ -L "$ARM" ] && [ "$(readlink "$ARM")" = "$artifact.bin" ]
[ -L "$X64" ] && [ "$(readlink "$X64")" = "$artifact.bin" ]
[ -x "$ARM" ] && [ -x "$X64" ]
[ "$(cat "$ARM.source.sha256")" = "$EXPECTED_SOURCE" ]
[ "$(cat "$X64.source.sha256")" = "$EXPECTED_SOURCE" ]
file "$ARM" | grep -q 'Mach-O 64-bit executable arm64'
file "$X64" | grep -q 'Mach-O 64-bit executable x86_64'
if [ "$has_runtime" = 1 ]; then
  for item in "macos-arm64:arm64" "macos-x64:x64"; do
    package=${item%%:*}
    arch=${item#*:}
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
assert data['imageGenVersion']=='0.4.1'
assert data['nodeSha256']==sha('node')
assert data['launcherSha256']==sha('bin/pi')
assert data['entrypointSha256']==sha('package/node_modules/@earendil-works/pi-coding-agent/dist/cli.js')
assert data['imageWorkerSha256']==sha('package/pet-studio-image-worker.mjs')
assert data['imageLibrarySha256']==sha('package/node_modules/@abhishek944/pi-image-gen/dist/index.js')
assert all(sha(path)==digest for path,digest in data['files'].items())
actual={str(path.relative_to(root)) for path in root.rglob('*') if path.is_file()}
assert actual==set(data['files'])|{'runtime-manifest.json'}
assert not any(path.is_symlink() for path in root.rglob('*'))
esbuild=f"package/node_modules/@earendil-works/pi-coding-agent/node_modules/@esbuild/darwin-{sys.argv[2]}/bin/esbuild"
assert esbuild in actual
PY
    node --check "$runtime/package/pet-studio-image-worker.mjs"
    (cd "$runtime/package" && node --input-type=module -e \
      "import('@abhishek944/pi-image-gen').then((module) => { if (typeof module.generateImage !== 'function' || typeof module.runSpritePipeline !== 'function') process.exit(1) })")
    file "$runtime/node" | grep -q "$([ "$arch" = arm64 ] && echo arm64 || echo x86_64)"
    file "$runtime/package/node_modules/@earendil-works/pi-coding-agent/node_modules/@esbuild/darwin-$arch/bin/esbuild" | grep -q "$([ "$arch" = arm64 ] && echo arm64 || echo x86_64)"
    rm -rf "$runtime"
    trap - EXIT INT TERM
  done
fi

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

echo "packaged macOS $app_choice binaries: pass"
