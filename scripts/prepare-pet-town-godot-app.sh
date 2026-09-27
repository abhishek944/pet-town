#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
source_app=${1:-"$root/var/godot-runtime/Godot.app"}
target_app="$root/var/godot-runtime/Pet Town 3D.app"
icon="$root/apps/pet-town-godot-next/branding/pet-town-icon.icns"

if [ ! -x "$source_app/Contents/MacOS/Godot" ] || [ ! -f "$icon" ]; then
  echo "Godot app or Pet Town icon is missing" >&2
  exit 1
fi
if [ -x "$target_app/Contents/MacOS/Godot" ] &&
  [ "$target_app" -nt "$source_app/Contents/MacOS/Godot" ] &&
  [ "$target_app" -nt "$icon" ]; then
  printf '%s\n' "$target_app/Contents/MacOS/Godot"
  exit 0
fi

mkdir -p "$(dirname -- "$target_app")"
temporary=$(mktemp -d "$root/var/godot-runtime/.pet-town-app.XXXXXX")
trap 'rm -rf "$temporary"' EXIT HUP INT TERM
staged="$temporary/Pet Town 3D.app"
ditto "$source_app" "$staged"
plist="$staged/Contents/Info.plist"
/usr/libexec/PlistBuddy -c 'Set :CFBundleName Pet Town 3D' "$plist"
/usr/libexec/PlistBuddy -c 'Add :CFBundleDisplayName string Pet Town 3D' "$plist" 2>/dev/null ||
  /usr/libexec/PlistBuddy -c 'Set :CFBundleDisplayName Pet Town 3D' "$plist"
/usr/libexec/PlistBuddy -c 'Set :CFBundleIdentifier dev.pettown.game' "$plist"
/usr/libexec/PlistBuddy -c 'Set :CFBundleIconFile PetTown.icns' "$plist"
cp "$icon" "$staged/Contents/Resources/PetTown.icns"
codesign --force --deep --sign - "$staged" >/dev/null
rm -rf "$target_app"
mv "$staged" "$target_app"
printf '%s\n' "$target_app/Contents/MacOS/Godot"
