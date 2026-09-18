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

app_choice=${PET_VILLAGE_APP:-v1}
case "$app_choice" in
v1)
  workspace=@pet-village/desktop
  app_dir=pet-village
  binary_name=pet-village
  output_name=pet-village
  ;;
v2)
  workspace=@pet-village/desktop-v2
  app_dir=pet-village-v2
  binary_name=pet-village-v2
  output_name=pet-village-v2
  ;;
*)
  echo "PET_VILLAGE_APP must be v1 or v2, received: $app_choice" >&2
  exit 2
  ;;
esac

if [ -n "$rust_target" ]; then
  if [ "$app_choice" = v1 ]; then
    "$ROOT/scripts/prepare-pi-runtime.sh" "$package"
    runtime_archive="$ROOT/bin/$package/pet-village-pi-runtime.tar.gz"
    mkdir -p "$ROOT/apps/pet-village/src-tauri/resources"
    cp "$runtime_archive" "$ROOT/apps/pet-village/src-tauri/resources/pet-village-pi-runtime.tar.gz"
  fi
  pnpm --filter "$workspace" tauri build --no-bundle --target "$rust_target"
  binary="$ROOT/apps/$app_dir/src-tauri/target/$rust_target/release/$binary_name"
  package_dir="$ROOT/bin/$package"
  mkdir -p "$package_dir"
  install -m 755 "$binary" "$package_dir/$output_name.bin"
  rm -f "$package_dir/$output_name"
  ln -s "$output_name.bin" "$package_dir/$output_name"
  PET_VILLAGE_APP="$app_choice" "$ROOT/scripts/package-source-fingerprint.sh" >"$package_dir/$output_name.source.sha256"
  echo "packaged: $package_dir/$output_name"
else
  pnpm --filter "$workspace" tauri build --no-bundle
  binary="$ROOT/apps/$app_dir/src-tauri/target/release/$binary_name"
fi

echo "built: $binary"
