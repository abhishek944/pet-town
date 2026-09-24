#!/bin/sh
set -eu

binary=$1
shift
source_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../apps/pet-town/src-tauri" && pwd)
bundle="$(dirname "$binary")/Pet Town Debug.app"
app_binary="$bundle/Contents/MacOS/pet-town"
resources="$bundle/Contents/Resources"

# A Rust rebuild can restart this runner before Launch Services finishes
# removing the previous instance. Wait before replacing its executable.
previous=$(pgrep -f "$app_binary" || true)
if [ -n "$previous" ]; then kill $previous 2>/dev/null || true; fi
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

mkdir -p "$(dirname "$app_binary")" "$resources"
cp "$binary" "$app_binary"
cp "$source_dir/icons/icon.icns" "$resources/icon.icns"
ln -sf "$source_dir/resources/pet-town-pi-runtime.tar.gz" "$resources/pet-town-pi-runtime.tar.gz"
cat > "$bundle/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Pet Town Debug</string>
  <key>CFBundleDisplayName</key><string>Pet Town Debug</string>
  <key>CFBundleIdentifier</key><string>dev.pet.town.debug</string>
  <key>CFBundleExecutable</key><string>pet-town</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleIconFile</key><string>icon.icns</string>
  <key>CFBundleShortVersionString</key><string>0.1.8</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST

stop_app() {
  pids=$(pgrep -f "$app_binary" || true)
  if [ -n "$pids" ]; then kill $pids 2>/dev/null || true; fi
}
trap stop_app EXIT INT TERM
if [ "$#" -eq 0 ]; then
  open -n -W "$bundle"
else
  open -n -W "$bundle" --args "$@"
fi
