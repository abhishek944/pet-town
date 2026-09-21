#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

pnpm install --frozen-lockfile
package=${PACKAGE:-}
if [ -z "$package" ]; then
  case "$(uname -s):$(uname -m)" in
  Darwin:arm64) package=macos-arm64 ;;
  Darwin:x86_64) package=macos-x64 ;;
  esac
fi

case "$package" in
macos-arm64) rust_target=aarch64-apple-darwin ;;
macos-x64) rust_target=x86_64-apple-darwin ;;
*) rust_target="" ;;
esac

workspace=@pet-town/desktop
app_dir=pet-town
binary_name=pet-town
output_name=pet-town
product_name="Pet Town"

if [ -n "$rust_target" ]; then
  "$ROOT/scripts/prepare-pi-runtime.sh" "$package"
  runtime_archive="$ROOT/bin/$package/pet-town-pi-runtime.tar.gz"
  mkdir -p "$ROOT/apps/pet-town/src-tauri/resources"
  cp "$runtime_archive" "$ROOT/apps/pet-town/src-tauri/resources/pet-town-pi-runtime.tar.gz"

  release_dir="$ROOT/apps/$app_dir/src-tauri/target/$rust_target/release"
  rm -rf "$release_dir/bundle/macos" "$release_dir/bundle/dmg"
  pnpm --filter "$workspace" tauri build --target "$rust_target"

  binary="$release_dir/$binary_name"
  package_dir="$ROOT/bin/$package"
  mkdir -p "$package_dir"
  install -m 755 "$binary" "$package_dir/$output_name.bin"
  rm -f "$package_dir/$output_name"
  ln -s "$output_name.bin" "$package_dir/$output_name"
  "$ROOT/scripts/package-source-fingerprint.sh" >"$package_dir/$output_name.source.sha256"
  echo "packaged executable: $package_dir/$output_name"

  app_bundle="$release_dir/bundle/macos/$product_name.app"
  set -- "$release_dir"/bundle/dmg/*.dmg
  [ "$#" -eq 1 ] && [ -f "$1" ] || {
    echo "expected one DMG in $release_dir/bundle/dmg" >&2
    exit 1
  }
  [ -d "$app_bundle" ] || {
    echo "missing application bundle: $app_bundle" >&2
    exit 1
  }
  # Tauri cannot dress the DMG window on headless builders, so repackage
  # the signed app with dmgbuild, which writes the .DS_Store without Finder.
  python3 -c 'import dmgbuild' 2>/dev/null || {
    echo "dmgbuild is required: python3 -m pip install dmgbuild" >&2
    exit 1
  }
  rm -f "$package_dir/$output_name.dmg"
  python3 - "$app_bundle" "$package_dir/$output_name.dmg" \
    "$ROOT/apps/pet-town/src-tauri/dmg-background.png" \
    "$ROOT/apps/pet-town/src-tauri/icons/icon.icns" <<'PY'
import dmgbuild
import sys
app_bundle, destination, background, volume_icon = sys.argv[1:5]
dmgbuild.build_dmg(destination, "Pet Town", settings={
    "window_rect": ((10, 60), (660, 400)),
    "icon": volume_icon,
    "icon_size": 128,
    # Finder does not scale background images when its window is resized. This
    # oversized artwork extends beyond the opening viewport instead.
    "background": background,
    "scroll_position": (0.0, 0.0),
    "icon_locations": {
        "Pet Town.app": (180, 170),
        "Applications": (480, 170),
    },
    "symlinks": {"Applications": "/Applications"},
    "files": [app_bundle],
    "format": "UDZO",
})
PY
  "$ROOT/scripts/check-dmg.sh" "$package"
  echo "packaged installer: $package_dir/$output_name.dmg"
else
  pnpm --filter "$workspace" tauri build --no-bundle
  binary="$ROOT/apps/$app_dir/src-tauri/target/release/$binary_name"
fi

echo "built: $binary"
