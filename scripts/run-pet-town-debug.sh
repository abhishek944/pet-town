#!/bin/sh
set -eu

binary=$1
shift
source_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../apps/pet-town/src-tauri" && pwd)
bundle="$(dirname "$binary")/Pet Town Debug.app"
app_binary="$bundle/Contents/MacOS/pet-town"
stage_root=$(mktemp -d "$(dirname "$bundle")/.pet-town-debug.XXXXXX")
staged_bundle="$stage_root/Pet Town Debug.app"
staged_binary="$staged_bundle/Contents/MacOS/pet-town"
resources="$staged_bundle/Contents/Resources"
cleanup_stage() {
  rm -rf "$stage_root"
}
trap cleanup_stage EXIT

# A Rust rebuild can restart this runner before Launch Services finishes
# removing the previous instance. Wait before replacing its executable.
previous=$(pgrep -f "$app_binary" || true)
for pid in $previous; do
  kill "$pid" 2>/dev/null || true
done
attempt=0
while pgrep -f "$app_binary" >/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 50 ]; then
    echo "Pet Town Debug did not exit before rebuild" >&2
    exit 1
  fi
  sleep 0.2
done
sleep 1

mkdir -p "$(dirname "$staged_binary")" "$resources"
cp "$binary" "$staged_binary"
cp "$source_dir/icons/icon.icns" "$resources/icon.icns"
runtime_archive="$resources/pet-town-pi-runtime.tar.gz"
if [ -L "$runtime_archive" ]; then
  unlink "$runtime_archive"
fi
cp "$source_dir/resources/pet-town-pi-runtime.tar.gz" "$runtime_archive"
python3 - "$source_dir/Info.plist" "$staged_bundle/Contents/Info.plist" <<'PY'
import plistlib
import sys

with open(sys.argv[1], "rb") as source:
    info = plistlib.load(source)
for key in ("NSSpeechRecognitionUsageDescription", "NSMicrophoneUsageDescription"):
    if not isinstance(info.get(key), str) or not info[key].strip():
        raise SystemExit(f"Pet Town Info.plist is missing {key}")
info.update({
    "CFBundleName": "Pet Town Debug",
    "CFBundleDisplayName": "Pet Town Debug",
    "CFBundleIdentifier": "dev.pet.town.debug",
    "CFBundleExecutable": "pet-town",
    "CFBundlePackageType": "APPL",
    "CFBundleIconFile": "icon.icns",
    "CFBundleShortVersionString": "1.2.1",
    "NSHighResolutionCapable": True,
})
with open(sys.argv[2], "wb") as destination:
    plistlib.dump(info, destination)
PY

# The resource archive must be inside the bundle before macOS seals it.
# Keep the old app launchable until the replacement is fully signed.
# A stable development signature lets Keychain recognize the app after rebuilds.
signing_identity=${PET_TOWN_DEBUG_SIGNING_IDENTITY:-}
if [ -z "$signing_identity" ]; then
  signing_identity=$(security find-identity -v -p codesigning 2>/dev/null |
    sed -n 's/.*"\(Apple Development:[^"]*\)".*/\1/p' | head -n 1)
fi
if [ -z "$signing_identity" ]; then
  signing_identity=-
fi
codesign --force --sign "$signing_identity" --timestamp=none "$staged_bundle"
codesign --verify --deep --strict "$staged_bundle"
previous_bundle="$stage_root/previous.app"
if [ -d "$bundle" ]; then
  mv "$bundle" "$previous_bundle"
fi
if ! mv "$staged_bundle" "$bundle"; then
  if [ -d "$previous_bundle" ]; then
    mv "$previous_bundle" "$bundle"
  fi
  exit 1
fi
rm -rf "$previous_bundle"

stop_app() {
  pids=$(pgrep -f "$app_binary" || true)
  for pid in $pids; do
    kill "$pid" 2>/dev/null || true
  done
}
cleanup() {
  stop_app
  cleanup_stage
}
trap cleanup EXIT INT TERM
if [ "$#" -eq 0 ]; then
  open -n -W "$bundle"
else
  open -n -W "$bundle" --args "$@"
fi
