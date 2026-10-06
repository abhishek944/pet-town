#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"

# The desktop window opens the native Godot process. The standalone Three.js
# browser game ships through apps/web and the development servers, so the
# desktop build must not depend on it or leave stale output behind.
rm -rf "$repo_root/apps/pet-town/dist/town"
pnpm --filter @pet-town/desktop exec vite build
echo "Desktop frontend built without the browser-game bundle."
