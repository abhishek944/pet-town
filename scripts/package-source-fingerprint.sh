#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
python3 - "$ROOT" <<'PY'
import hashlib
import os
import sys
from pathlib import Path

root = Path(sys.argv[1])
app_choice = os.environ.get("PET_VILLAGE_APP", "v1")
if app_choice not in {"v1", "v2"}:
    raise SystemExit("PET_VILLAGE_APP must be v1 or v2")
app = root / "apps" / ("pet-village-v2" if app_choice == "v2" else "pet-village")
files = []
directories = [app / "src", app / "src-tauri", app / "public"]
if app_choice == "v2":
    directories.append(root / "packages" / "pet-village-core" / "src")
for directory in directories:
    for path in directory.rglob("*"):
        relative = path.relative_to(root).parts
        if not path.is_file() or "target" in relative or "resources" in relative:
            continue
        files.append(path)
for path in (
    app / "index.html",
    app / "settings.html",
    app / "assistant.html",
    app / "playroom.html",
    app / "package.json",
    app / "tsconfig.json",
    app / "vite.config.ts",
    app / "scripts" / "pet-studio-image-worker.mjs",
    root / "package.json",
    root / "pnpm-lock.yaml",
    root / "pnpm-workspace.yaml",
    root / "turbo.json",
    root / "scripts" / "build.sh",
    root / "scripts" / "check-packaged.sh",
    root / "scripts" / "select-desktop-app.mjs",
    root / "scripts" / "prepare-pi-runtime.sh",
    root / "scripts" / "pi-runtime-package-lock.json",
    root / "packages" / "pet-village-core" / "package.json" if app_choice == "v2" else root / ".missing",
    root / "packages" / "pet-village-core" / "tsconfig.json" if app_choice == "v2" else root / ".missing",
):
    if path.is_file():
        files.append(path)
digest = hashlib.sha256()
for path in sorted(set(files), key=lambda item: item.relative_to(root).as_posix()):
    relative = path.relative_to(root).as_posix().encode()
    digest.update(relative + b"\0")
    digest.update(oct(os.stat(path).st_mode & 0o777).encode() + b"\0")
    digest.update(path.read_bytes())
    digest.update(b"\0")
print(digest.hexdigest())
PY
