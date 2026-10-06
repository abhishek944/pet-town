#!/bin/sh
set -eu
repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
destination=${1:-"$repo_dir/var/godot-runtime/Pet Town.app"}
package=${2:-}
world_pack=${3:-}
case "$package" in
macos-arm64) architecture=arm64 ;;
macos-x64) architecture=x86_64 ;;
"") architecture="" ;;
*)
  echo "usage: $0 [destination/Pet Town.app] [macos-arm64|macos-x64 world.pck]" >&2
  exit 2
  ;;
esac
if [ -n "$architecture" ] && [ ! -s "$world_pack" ]; then
  echo "A nonempty world pack is required for the game-only release runtime." >&2
  exit 2
fi
source_app=$(sh "$repo_dir/scripts/prepare-godot-engine.sh")
case "$destination" in
*/"Pet Town.app") ;;
*)
  echo "The runtime destination must end in /Pet Town.app" >&2
  exit 1
  ;;
esac
mkdir -p "$(dirname "$destination")"
stage=$(mktemp -d "$(dirname "$destination")/.pet-town-runtime.XXXXXX")
trap 'rm -rf "$stage"' EXIT HUP INT TERM
app="$stage/Pet Town.app"
# Keep the official engine untouched; branding invalidates only this copy's signature.
ditto "$source_app" "$app"
if [ -n "$architecture" ]; then
  # Keep development on the editor, but ship only the matching game executable.
  release_binary=$(python3 "$repo_dir/scripts/prepare-godot-template.py" "$source_app/Contents/MacOS/Godot")
  codesign -d --entitlements - --xml "$source_app" >"$stage/entitlements.plist"
  lipo "$release_binary" -thin "$architecture" -output "$stage/Godot"
  rm -rf "$app/Contents/MacOS"
  mkdir -p "$app/Contents/MacOS"
  install -m 755 "$stage/Godot" "$app/Contents/MacOS/Godot"
  [ "$(lipo -archs "$app/Contents/MacOS/Godot")" = "$architecture" ]
  # Official 4.7+ templates disable --main-pack; use normal bundle discovery.
  cp "$world_pack" "$app/Contents/Resources/Godot.pck"
fi
cp "$repo_dir/apps/pet-town/src-tauri/icons/icon.icns" "$app/Contents/Resources/pet-town.icns"
python3 - "$app/Contents/Info.plist" "$source_app" "$destination" <<'PY'
import plistlib
import subprocess
import sys
from pathlib import Path

path = sys.argv[1]
source_app, destination = (Path(value).resolve() for value in sys.argv[2:])
if source_app == destination or destination in source_app.parents:
    raise SystemExit("The branded copy must not replace the source engine")
with open(path, "rb") as source:
    info = plistlib.load(source)
info.update({
    "CFBundleName": "Pet Town",
    "CFBundleDisplayName": "Pet Town",
    "CFBundleIdentifier": "dev.pet.town.native",
    "CFBundleIconFile": "pet-town.icns",
})
# A game runtime should not advertise the editor's document types or protocols.
for key in ("CFBundleDocumentTypes", "CFBundleURLTypes", "CFBundleIconName"):
    info.pop(key, None)
# Localized metadata can override the bundle name on some macOS installations.
for localized in Path(path).parent.glob("Resources/*.lproj/InfoPlist.strings"):
    values = {}
    if localized.stat().st_size:
        values = plistlib.loads(subprocess.check_output([
            "plutil", "-convert", "xml1", "-o", "-", str(localized),
        ]))
    values.update({"CFBundleName": "Pet Town", "CFBundleDisplayName": "Pet Town"})
    with localized.open("wb") as output:
        plistlib.dump(values, output)
with open(path, "wb") as destination:
    plistlib.dump(info, destination)
PY
# Preserve the engine's entitlements and hardened-runtime flags. Distribution
# signing/notarization can replace this local signature on the final app bundle.
if [ -n "$architecture" ]; then
  codesign --force --sign - --options runtime --entitlements "$stage/entitlements.plist" --timestamp=none "$app"
else
  codesign --force --sign - --preserve-metadata=entitlements,flags --timestamp=none "$app"
fi
codesign --verify --deep --strict "$app"
rm -rf "$destination"
mv "$app" "$destination"
printf '%s\n' "$destination"
