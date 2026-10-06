#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
package=${1:-}
case "$package" in
macos-arm64) architecture=arm64 ;;
macos-x64) architecture=x86_64 ;;
*)
  echo "usage: $0 macos-arm64|macos-x64" >&2
  exit 2
  ;;
esac

package_dir="$ROOT/bin/$package"
dmg="$package_dir/pet-town.dmg"
expected_version=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$ROOT/apps/pet-town/src-tauri/tauri.conf.json")
[ -s "$dmg" ]
hdiutil verify "$dmg" >/dev/null
mount=$(mktemp -d "${TMPDIR:-/tmp}/pet-town-dmg.XXXXXX")
cleanup() {
  hdiutil detach "$mount" >/dev/null 2>&1 || true
  rmdir "$mount" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
hdiutil attach -readonly -nobrowse -mountpoint "$mount" "$dmg" >/dev/null
app="$mount/Pet Town.app"
executable="$app/Contents/MacOS/pet-town"
native="$app/Contents/Resources/resources/godot/Pet Town.app"
runtime=$(find "$app/Contents/Resources" -name pet-town-pi-runtime.tar.gz -type f -print -quit)
[ -d "$app" ] && [ -L "$mount/Applications" ] && [ -x "$executable" ]
[ -n "$runtime" ] && [ -f "$runtime" ]
[ -x "$native/Contents/MacOS/Godot" ]
[ "$(lipo -archs "$native/Contents/MacOS/Godot")" = "$architecture" ] || {
  echo "Native game runtime must contain only $architecture, not a universal editor." >&2
  exit 1
}
grep -aqF 'Option legend (this build = release export template)' "$native/Contents/MacOS/Godot" || {
  echo "Native game executable is not a Godot release export template." >&2
  exit 1
}
[ ! -e "$app/Contents/Resources/resources/godot/Godot.app" ]
[ ! -e "$app/Contents/Resources/resources/godot/world" ]
[ -s "$native/Contents/Resources/Godot.pck" ]
[ "$(plutil -extract CFBundleName raw "$native/Contents/Info.plist")" = "Pet Town" ]
[ "$(plutil -extract CFBundleIdentifier raw "$native/Contents/Info.plist")" = dev.pet.town.native ]
codesign --verify --deep --strict "$native"
file "$executable" | grep -q "$architecture"
if [ "${REQUIRE_SIGNED:-0}" = "1" ]; then
  [ "$(dwarfdump --uuid "$executable" | awk '{print $2}')" = "$(dwarfdump --uuid "$package_dir/pet-town.bin" | awk '{print $2}')" ]
else
  cmp "$executable" "$package_dir/pet-town.bin"
fi
cmp "$runtime" "$package_dir/pet-town-pi-runtime.tar.gz"
[ "$(plutil -extract CFBundleIdentifier raw "$app/Contents/Info.plist")" = dev.pet.town ]
[ "$(plutil -extract CFBundleShortVersionString raw "$app/Contents/Info.plist")" = "$expected_version" ]
[ -f "$mount/.background.png" ]
cmp "$mount/.background.png" "$ROOT/apps/pet-town/src-tauri/dmg-background.png"
background_size=$(sips -g pixelWidth -g pixelHeight "$mount/.background.png" | awk '/pixelWidth|pixelHeight/ {print $2}')
[ "$background_size" = "$(printf '660\n400')" ] || {
  echo "Installer background must match the 660x400 Finder window; found: $background_size" >&2
  exit 1
}
[ -f "$mount/.DS_Store" ]
if [ "${REQUIRE_SIGNED:-0}" = "1" ]; then
  [ -n "${EXPECTED_SIGNING_IDENTITY:-}" ]
  codesign --verify --deep --strict "$app"
  codesign -d --verbose=4 "$app" 2>&1 | grep -q "Authority=${EXPECTED_SIGNING_IDENTITY}"
  codesign -d --verbose=4 "$native" 2>&1 | grep -qF "Authority=${EXPECTED_SIGNING_IDENTITY}"
  xcrun stapler validate "$app"
fi

echo "Pet Town $package DMG: pass"
