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
runtime=$(find "$app/Contents/Resources" -name pet-town-pi-runtime.tar.gz -type f -print -quit)
[ -d "$app" ] && [ -L "$mount/Applications" ] && [ -x "$executable" ]
[ -n "$runtime" ] && [ -f "$runtime" ]
file "$executable" | grep -q "$architecture"
if [ "${REQUIRE_SIGNED:-0}" = "1" ]; then
  [ "$(dwarfdump --uuid "$executable" | awk '{print $2}')" = "$(dwarfdump --uuid "$package_dir/pet-town.bin" | awk '{print $2}')" ]
else
  cmp "$executable" "$package_dir/pet-town.bin"
fi
cmp "$runtime" "$package_dir/pet-town-pi-runtime.tar.gz"
[ "$(plutil -extract CFBundleIdentifier raw "$app/Contents/Info.plist")" = dev.pet.town ]
[ "$(plutil -extract CFBundleShortVersionString raw "$app/Contents/Info.plist")" = "$expected_version" ]
if [ "${REQUIRE_SIGNED:-0}" = "1" ]; then
  [ -n "${EXPECTED_SIGNING_IDENTITY:-}" ]
  codesign --verify --deep --strict "$app"
  codesign -d --verbose=4 "$app" 2>&1 | grep -q "Authority=${EXPECTED_SIGNING_IDENTITY}"
  xcrun stapler validate "$app"
fi

echo "Pet Town $package DMG: pass"
