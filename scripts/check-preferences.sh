#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TMP=$(mktemp -d "${TMPDIR:-/tmp}/pet-town-preferences.XXXXXX")
trap 'rm -rf "$TMP"' EXIT INT TERM
cd "$ROOT/apps/pet-town"

pnpm exec esbuild src/renderer-preferences.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/renderer-preferences.cjs"
cp "$ROOT/scripts/preference-checks/check.cjs" "$TMP/check.cjs"
node "$TMP/check.cjs"

pnpm exec esbuild src/village.ts src/renderer-preferences.ts --bundle --platform=node --format=cjs \
  --loader:.png=dataurl --define:import.meta.glob=globalThis.__testGlob \
  --log-level=error --outdir="$TMP/cast"
cp "$ROOT/scripts/preference-checks/cast-check.cjs" "$TMP/cast-check.cjs"
node "$TMP/cast-check.cjs"

pnpm exec esbuild src/renderer.ts --bundle --platform=node --format=cjs --loader:.png=dataurl \
  --define:import.meta.glob=globalThis.__testGlob --log-level=error --outfile="$TMP/renderer.cjs"
cp "$ROOT/scripts/preference-checks/renderer-check.cjs" "$TMP/renderer-check.cjs"
node "$TMP/renderer-check.cjs"

pnpm exec esbuild src/settings-preview.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/settings-preview.cjs"
cp "$ROOT/scripts/preference-checks/preview.cjs" "$TMP/preview.cjs"
node "$TMP/preview.cjs"

pnpm exec esbuild src/pet-freeze.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/pet-freeze.cjs"
cp "$ROOT/scripts/preference-checks/freeze.cjs" "$TMP/freeze.cjs"
node "$TMP/freeze.cjs"

pnpm exec esbuild src/village-preferences.ts --bundle --platform=node --format=cjs \
  --external:@tauri-apps/api/core --external:@tauri-apps/api/event \
  --log-level=error --outfile="$TMP/village-preferences.cjs"
cp "$ROOT/scripts/preference-checks/village-preferences-check.cjs" "$TMP/village-preferences-check.cjs"
node "$TMP/village-preferences-check.cjs"

pnpm exec esbuild src/settings-apply.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/settings-apply.cjs"
node "$ROOT/scripts/preference-checks/settings-apply-check.cjs" "$TMP/settings-apply.cjs"

pnpm exec esbuild src/settings-startup.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/settings-startup.cjs"
node "$ROOT/scripts/preference-checks/settings-startup-check.cjs" "$TMP/settings-startup.cjs"

. "$ROOT/scripts/preference-checks/static.sh"
