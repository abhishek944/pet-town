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

DEST="$ROOT/bin/$PACKAGE/pet-town-pi-runtime.tar.gz"
CACHE="${TMPDIR:-/tmp}/pet-town-runtime-cache"
ARCHIVE="$CACHE/node-v$NODE_VERSION-darwin-$ARCH.tar.xz"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/pet-town-pi-runtime.XXXXXX")
SIGN_KEYCHAIN=""
ORIGINAL_KEYCHAINS="$WORK/original-keychains.txt"
cleanup() {
  if [ -n "$SIGN_KEYCHAIN" ]; then
    if [ -f "$ORIGINAL_KEYCHAINS" ]; then
      python3 - "$ORIGINAL_KEYCHAINS" <<'PY' || true
import shlex,subprocess,sys
keychains=shlex.split(open(sys.argv[1],encoding="utf-8").read())
subprocess.run(["security","list-keychains","-d","user","-s",*keychains],check=False)
PY
    fi
    security delete-keychain "$SIGN_KEYCHAIN" >/dev/null 2>&1 || true
  fi
  rm -rf "$WORK"
}
trap cleanup EXIT INT TERM
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
{"name":"pet-town-pi-runtime","private":true,"version":"0.0.0","dependencies":{"@abhishek944/pi-image-gen":"$IMAGE_GEN_VERSION","@earendil-works/pi-coding-agent":"$PI_VERSION"}}
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
install -m 600 "$ROOT/apps/pet-town/scripts/pet-studio-image-worker.mjs" \
  "$WORK/runtime/package/pet-studio-image-worker.mjs"

if [ -n "${APPLE_SIGNING_IDENTITY:-}" ]; then
  if security find-identity -v -p codesigning 2>/dev/null | grep -qF "$APPLE_SIGNING_IDENTITY"; then
    echo "using installed signing identity: $APPLE_SIGNING_IDENTITY" >&2
  elif [ -n "${APPLE_CERTIFICATE:-}" ]; then
    [ -n "${APPLE_CERTIFICATE_PASSWORD:-}" ] || {
      echo "APPLE_CERTIFICATE_PASSWORD is required when APPLE_CERTIFICATE is set" >&2
      exit 1
    }
    SIGN_KEYCHAIN="$WORK/runtime-signing.keychain-db"
    sign_keychain_password=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
    sign_p12="$WORK/runtime-signing.p12"
    printf '%s' "$APPLE_CERTIFICATE" | base64 -d >"$sign_p12"
    chmod 600 "$sign_p12"
    security create-keychain -p "$sign_keychain_password" "$SIGN_KEYCHAIN"
    security set-keychain-settings -lut 21600 "$SIGN_KEYCHAIN"
    security unlock-keychain -p "$sign_keychain_password" "$SIGN_KEYCHAIN"
    security import "$sign_p12" -k "$SIGN_KEYCHAIN" \
      -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign
    security set-key-partition-list -S apple-tool:,apple:,codesign: -s \
      -k "$sign_keychain_password" "$SIGN_KEYCHAIN" >/dev/null
    security list-keychains -d user >"$ORIGINAL_KEYCHAINS"
    python3 - "$ORIGINAL_KEYCHAINS" "$SIGN_KEYCHAIN" <<'PY'
import shlex,subprocess,sys
keychains=shlex.split(open(sys.argv[1],encoding="utf-8").read())
subprocess.run(["security","list-keychains","-d","user","-s",sys.argv[2],*keychains],check=True)
PY
    rm -f "$sign_p12"
    security find-identity -v -p codesigning "$SIGN_KEYCHAIN" | grep -qF "$APPLE_SIGNING_IDENTITY" || {
      echo "APPLE_SIGNING_IDENTITY was not found in APPLE_CERTIFICATE" >&2
      exit 1
    }
  else
    echo "APPLE_SIGNING_IDENTITY is missing and APPLE_CERTIFICATE was not provided" >&2
    exit 1
  fi

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
fi

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
rm -rf "$ROOT/bin/$PACKAGE/pet-town-pi-runtime"
echo "prepared: $DEST"
