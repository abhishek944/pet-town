#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
godot_app="$repo_root/var/godot-runtime/Godot.app"
workshop_app="$repo_root/var/godot-runtime/Pet Town Workshop.app"
project_dir="$repo_root/apps/pet-town-godot-next"

if [ ! -x "$godot_app/Contents/MacOS/Godot" ]; then
  echo "Godot runtime missing at $godot_app" >&2
  exit 1
fi

if [ ! -x "$workshop_app/Contents/MacOS/Godot" ] ||
  [ "$(/usr/libexec/PlistBuddy -c 'Print :LSUIElement' "$workshop_app/Contents/Info.plist" 2>/dev/null || true)" != true ]; then
  ditto "$godot_app" "$workshop_app"
  python3 - "$workshop_app/Contents" "$project_dir/branding/pet-town-icon.icns" <<'PY'
import plistlib
import sys
from pathlib import Path

contents = Path(sys.argv[1])
icon = Path(sys.argv[2])
info_path = contents / "Info.plist"
info = plistlib.loads(info_path.read_bytes())
info["CFBundleIdentifier"] = "dev.pettown.workshop.debug"
info["CFBundleName"] = "Pet Town Workshop"
info["CFBundleDisplayName"] = "Pet Town Workshop"
# The desktop app owns the Dock entry; the auxiliary workshop is a window, not a second app icon.
info["LSUIElement"] = True
info["CFBundleIconFile"] = "PetTownIcon.icns"
info_path.write_bytes(plistlib.dumps(info))
(contents / "Resources" / "PetTownIcon.icns").write_bytes(icon.read_bytes())
PY
  codesign --force --deep --sign - "$workshop_app"
fi

exec "$workshop_app/Contents/MacOS/Godot" --path "$project_dir" "$@"
