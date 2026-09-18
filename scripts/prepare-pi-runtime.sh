#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TARGET=${1:-}
NODE_VERSION=22.21.1
PI_VERSION=0.85.1
IMAGE_GEN_VERSION=0.4.1

case "$TARGET" in
macos-arm64 | aarch64-apple-darwin)
  ARCH=arm64
  PACKAGE=macos-arm64
  ;;
macos-x64 | x86_64-apple-darwin)
  ARCH=x64
  PACKAGE=macos-x64
  ;;
*)
  echo "usage: $0 macos-arm64|macos-x64" >&2
  exit 2
  ;;
esac

DEST="$ROOT/bin/$PACKAGE/pet-village-pi-runtime.tar.gz"
CACHE="${TMPDIR:-/tmp}/pet-village-runtime-cache"
ARCHIVE="$CACHE/node-v$NODE_VERSION-darwin-$ARCH.tar.xz"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/pet-village-pi-runtime.XXXXXX")
trap 'rm -rf "$WORK"' EXIT INT TERM
mkdir -p "$CACHE" "$WORK/runtime/bin" "$WORK/runtime/package"

if [ ! -f "$ARCHIVE" ]; then
  curl --fail --location --silent --show-error \
    "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-darwin-$ARCH.tar.xz" \
    --output "$ARCHIVE.tmp"
  mv "$ARCHIVE.tmp" "$ARCHIVE"
fi

tar -xJf "$ARCHIVE" -C "$WORK"
NODE_ROOT="$WORK/node-v$NODE_VERSION-darwin-$ARCH"
install -m 755 "$NODE_ROOT/bin/node" "$WORK/runtime/node"
install -m 644 "$NODE_ROOT/LICENSE" "$WORK/runtime/NODE-LICENSE.txt"

cat >"$WORK/runtime/package/package.json" <<JSON
{"name":"pet-village-pi-runtime","private":true,"version":"0.0.0","dependencies":{"@abhishek944/pi-image-gen":"$IMAGE_GEN_VERSION","@earendil-works/pi-coding-agent":"$PI_VERSION"}}
JSON
cp "$ROOT/scripts/pi-runtime-package-lock.json" "$WORK/runtime/package/package-lock.json"
(cd "$WORK/runtime/package" &&
  npm_config_arch="$ARCH" npm_config_cpu="$ARCH" npm_config_platform=darwin npm ci \
    --omit=dev --ignore-scripts --no-audit --no-fund >/dev/null)
cat >"$WORK/runtime/bin/pi" <<'SH'
#!/bin/sh
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
exec "$ROOT/node" "$ROOT/package/node_modules/@earendil-works/pi-coding-agent/dist/cli.js" "$@"
SH
chmod 755 "$WORK/runtime/bin/pi"
install -m 600 "$ROOT/apps/pet-village/scripts/pet-studio-image-worker.mjs" \
  "$WORK/runtime/package/pet-studio-image-worker.mjs"

python3 - "$WORK/runtime" "$NODE_VERSION" "$PI_VERSION" "$IMAGE_GEN_VERSION" "$ARCH" <<'PY'
import hashlib,json,pathlib,sys
root=pathlib.Path(sys.argv[1])
def sha(path): return hashlib.sha256((root/path).read_bytes()).hexdigest()
files={str(path.relative_to(root)):sha(path.relative_to(root)) for path in sorted(root.rglob('*')) if path.is_file() and not path.is_symlink()}
manifest={"formatVersion":1,"architecture":sys.argv[5],"nodeVersion":sys.argv[2],
          "piVersion":sys.argv[3],"imageGenVersion":sys.argv[4],"nodeSha256":sha("node"),
          "launcherSha256":sha("bin/pi"),
          "entrypointSha256":sha("package/node_modules/@earendil-works/pi-coding-agent/dist/cli.js"),
          "imageWorkerSha256":sha("package/pet-studio-image-worker.mjs"),
          "imageLibrarySha256":sha("package/node_modules/@abhishek944/pi-image-gen/dist/index.js"),
          "files":files}
(root/"runtime-manifest.json").write_text(json.dumps(manifest,separators=(',',':'))+"\n")
PY
find "$WORK/runtime" -type l -delete
rm -f "$DEST.next"
python3 - "$WORK/runtime" "$DEST.next" <<'PY'
import gzip,pathlib,tarfile,sys
root=pathlib.Path(sys.argv[1])
with open(sys.argv[2],'wb') as raw, gzip.GzipFile(filename='',mode='wb',fileobj=raw,compresslevel=9,mtime=0) as zipped:
    with tarfile.open(fileobj=zipped,mode='w',format=tarfile.USTAR_FORMAT) as archive:
        for path in sorted(root.rglob('*')):
            info=archive.gettarinfo(str(path),str(path.relative_to(root)))
            info.uid=info.gid=0; info.uname=info.gname=''; info.mtime=0
            if path.is_file():
                with path.open('rb') as source: archive.addfile(info,source)
            else: archive.addfile(info)
PY
mv "$DEST.next" "$DEST"
rm -rf "$ROOT/bin/$PACKAGE/pet-village-pi-runtime"
echo "prepared: $DEST"
