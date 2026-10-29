#!/bin/sh
# Internal Settings component, not a standalone app installer.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
package=${1:-${PACKAGE:-}}
case "$package" in
macos-arm64)
  target=darwin-aarch64
  arch=arm64
  label=Apple-Silicon
  ;;
macos-x64)
  target=darwin-x86_64
  arch=x86_64
  label=Intel
  ;;
*)
  echo "usage: $0 macos-arm64|macos-x64" >&2
  exit 2
  ;;
esac
for value in APPLE_SIGNING_IDENTITY APPLE_ID APPLE_PASSWORD APPLE_TEAM_ID TAURI_SIGNING_PRIVATE_KEY; do
  printenv "$value" | grep -q . || {
    echo "Missing release credential: $value" >&2
    exit 1
  }
done
version=$(node -p 'JSON.parse(require("fs").readFileSync("apps/pet-town/src-tauri/tauri.conf.json")).version')
WORK=$(mktemp -d "${TMPDIR:-/tmp}/pet-town-component.XXXXXX")
. "$ROOT/scripts/macos-signing-keychain.sh"
cleanup() {
  cleanup_signing_keychain
  rm -rf "$WORK"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' HUP TERM
setup_signing_keychain
sh "$ROOT/scripts/prepare-godot-runtime.sh" "$package"
app="$WORK/Pet Town.app"
ditto "$ROOT/apps/pet-town/src-tauri/resources/godot/Pet Town.app" "$app"
python3 scripts/town-component-archive.py normalize "$app"
[ "$(lipo -archs "$app/Contents/MacOS/Godot")" = "$arch" ]
grep -aqF 'Option legend (this build = release export template)' "$app/Contents/MacOS/Godot"
codesign --force --sign "$APPLE_SIGNING_IDENTITY" --timestamp --options runtime \
  --preserve-metadata=entitlements,flags "$app"
codesign --verify --deep --strict "$app"
codesign -d --verbose=4 "$app" 2>&1 | grep -qF "TeamIdentifier=$APPLE_TEAM_ID"
ditto -c -k --keepParent "$app" "$WORK/notarize.zip"
xcrun notarytool submit "$WORK/notarize.zip" --wait \
  --apple-id "$APPLE_ID" --password "$APPLE_PASSWORD" --team-id "$APPLE_TEAM_ID" \
  --output-format json >"$WORK/notarization.json"
python3 - "$WORK/notarization.json" <<'PY'
import json, sys
if json.load(open(sys.argv[1]))["status"] != "Accepted":
    raise SystemExit("Native Town notarization was not accepted")
PY
xcrun stapler staple "$app"
xcrun stapler validate "$app"
codesign --verify --deep --strict "$app"
destination="$ROOT/bin/$package/Pet-Town-World-macOS-$label.tar.gz"
mkdir -p "$(dirname "$destination")"
python3 scripts/town-component-archive.py create "$app" "$WORK/component.tar.gz" "$version" "$target"
mkdir "$WORK/verify"
tar -xzf "$WORK/component.tar.gz" -C "$WORK/verify"
codesign --verify --deep --strict "$WORK/verify/Pet Town.app"
xcrun stapler validate "$WORK/verify/Pet Town.app"
# Sign the final compressed bytes, including the stapled app and embedded metadata.
pnpm --filter @pet-town/desktop exec tauri signer sign "$WORK/component.tar.gz"
[ -s "$WORK/component.tar.gz.sig" ]
mv "$WORK/component.tar.gz" "$destination"
mv "$WORK/component.tar.gz.sig" "$destination.sig"
echo "packaged optional component: $destination"
