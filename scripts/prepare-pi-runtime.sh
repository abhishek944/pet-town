#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TARGET=${1:-}
NATIVE_APP=${2:-}
NODE_VERSION=22.21.1
PI_VERSION=0.85.1

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

DEST="$ROOT/bin/$PACKAGE/pet-town-pi-runtime.tar.gz"
CACHE="${TMPDIR:-/tmp}/pet-town-runtime-cache"
ARCHIVE="$CACHE/node-v$NODE_VERSION-darwin-$ARCH.tar.xz"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/pet-town-pi-runtime.XXXXXX")
SIGN_KEYCHAIN=""
. "$ROOT/scripts/macos-signing-keychain.sh"
cleanup() {
  cleanup_signing_keychain
  rm -rf "$WORK"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' HUP TERM
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
{"name":"pet-town-pi-runtime","private":true,"version":"0.0.0","dependencies":{"@earendil-works/pi-coding-agent":"$PI_VERSION"}}
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

if [ -n "${APPLE_SIGNING_IDENTITY:-}" ]; then
  setup_signing_keychain

  echo "signing nested runtime binaries" >&2
  find "$WORK/runtime" -type f >"$WORK/runtime-files.txt"
  while IFS= read -r candidate; do
    case "$(file -b "$candidate")" in
    *Mach-O*) ;;
    *) continue ;;
    esac
    relative_candidate=${candidate#"$WORK/runtime/"}
    entitlements=""
    if [ "$relative_candidate" = node ]; then
      entitlements="$ROOT/scripts/node-runtime-entitlements.plist"
    fi
    echo "signing runtime binary: $relative_candidate" >&2
    python3 - "$candidate" "$APPLE_SIGNING_IDENTITY" "$entitlements" <<'PY'
import subprocess,sys
candidate,identity,entitlements=sys.argv[1:]
command=["/usr/bin/codesign","--sign",identity,"--timestamp","--options","runtime","--force"]
if entitlements:
    command.extend(["--entitlements",entitlements])
command.append(candidate)
try:
    result=subprocess.run(command,timeout=120)
except subprocess.TimeoutExpired:
    print(f"codesign timed out after 120 seconds: {candidate}",file=sys.stderr)
    raise SystemExit(124)
raise SystemExit(result.returncode)
PY
  done <"$WORK/runtime-files.txt"
  # Preserve the optional legacy development caller. Release packaging signs
  # and notarizes Town independently via package-town-component.sh.
  if [ -n "$NATIVE_APP" ]; then
    codesign --force --sign "$APPLE_SIGNING_IDENTITY" --timestamp --options runtime \
      --preserve-metadata=entitlements,flags "$NATIVE_APP"
    codesign --verify --deep --strict "$NATIVE_APP"
  fi
elif [ "${REQUIRE_SIGNED:-0}" = 1 ]; then
  echo "APPLE_SIGNING_IDENTITY is required for signed runtime preparation" >&2
  exit 1
fi

python3 - "$WORK/runtime" "$NODE_VERSION" "$PI_VERSION" "$ARCH" <<'PY'
import hashlib,json,pathlib,sys
root=pathlib.Path(sys.argv[1])
def sha(path): return hashlib.sha256((root/path).read_bytes()).hexdigest()
files={str(path.relative_to(root)):sha(path.relative_to(root)) for path in sorted(root.rglob('*')) if path.is_file() and not path.is_symlink()}
manifest={"formatVersion":1,"architecture":sys.argv[4],"nodeVersion":sys.argv[2],
          "piVersion":sys.argv[3],"nodeSha256":sha("node"),
          "launcherSha256":sha("bin/pi"),
          "entrypointSha256":sha("package/node_modules/@earendil-works/pi-coding-agent/dist/cli.js"),
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
rm -rf "$ROOT/bin/$PACKAGE/pet-town-pi-runtime"
echo "prepared: $DEST"
