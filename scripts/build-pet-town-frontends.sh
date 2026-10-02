#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"

pnpm --filter @pet-town/three-town run build
pnpm --filter @pet-town/desktop exec vite build
mkdir -p "$repo_root/apps/pet-town/dist/town"
cp -R "$repo_root/apps/pet-town-3d/dist/." "$repo_root/apps/pet-town/dist/town/"
echo "Three.js town included in desktop assets: dist/town/index.html"
