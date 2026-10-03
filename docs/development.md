# Developing and verifying Pet Town

[Back to the project overview](../README.md).

## Develop and build both towns

From the repository root:

```bash
pnpm run dev    # install dependencies, build frontend assets, launch native development
pnpm run build  # build the desktop app and DMG with the native Godot world
```

These desktop commands stop only this checkout's desktop and frontend processes,
so save work in those windows first. They preserve Cargo's
`apps/pet-town/src-tauri/target` cache. Development starts and waits for both Vite
servers: desktop on port 1420 and the retained Three.js source/browser server on
port 1422. **Open 3D Town** now launches or focuses the native Godot process.
Development uses `apps/pet-town-godot-sample` and the executable selected by
`PET_TOWN_GODOT_EXECUTABLE`, the repository's `var/godot-runtime/Godot.app`,
`/Applications/Godot.app`, or `godot` on PATH. Godot 4.7+ and the exported assets
are required. Starting the Vite servers does not verify native gameplay.

The desktop frontend build first builds `@pet-town/three-town`, then copies its
output into `apps/pet-town/dist/town` for the retained browser/source build.
`scripts/build.sh` also runs `scripts/prepare-godot-runtime.sh`: it checks the
source export with `scripts/validate-godot-export.py`, imports the Godot resources,
exports `PetTown.pck`, and stages the official engine app under Tauri's
`resources/godot`. Release **Open 3D Town** loads that bundled pack. Set
`GODOT_APP` to an official universal macOS Godot 4.7+ app when packaging.
The release executable is written to
`apps/pet-town/src-tauri/target/<rust-target>/release/pet-town` and copied into the
matching `bin/macos-*` plugin package directory. The same build produces
**Pet Town.app** and a drag-to-Applications DMG at `bin/macos-*/pet-town.dmg`.
Tagged release builds upload those installers as GitHub Release assets. The build
also bundles a pinned Node release and Pi package for the existing voice runtime.

The pnpm/Turborepo workspace contains the Tauri desktop in `apps/pet-town`, the
native Godot project in `apps/pet-town-godot-sample`, the retained Three.js game
(`@pet-town/three-town`) in `apps/pet-town-3d`, and the public
landing page in `apps/web`. Repository scripts, plugin metadata and documentation
remain at the root.

For first-time development, use Corepack to select pnpm 10.28.2, then run
`pnpm run dev`. Frontend watchers handle web edits; reopen the Godot process after
changing native scripts, scenes or exported assets. To work only on
the browser game, run `pnpm run dev:town`; `pnpm run dev:workshop` is an alias for
that standalone server. Browser gameplay does not connect agents or Mayor; use
**Open 3D Town** in the native desktop for that integration. Browser and native
Godot saves are separate: the browser retains legacy `bloomvale` storage keys;
Godot uses its isolated `Pet Town Godot Sample` user directory. The public build
continues to use `pet-town-public`. See the
[native guide](../apps/pet-town-godot-sample/README.md),
[Three.js guide](../apps/pet-town-3d/README.md) and
[extension APIs](../apps/pet-town-3d/ARCHITECTURE.md).

Start the landing page at `http://127.0.0.1:4173` with `pnpm run dev:web`.
Type-check and lint commands still use Turbo.

## Link for local development

While working on this repository, link the working tree instead of installing
from GitHub:

```bash
herdr plugin link "$PWD"
```

Linking does not run build commands and does not register against GitHub. The
startup hook runs when the Herdr server starts or hands off. Herdr stores the
renderer PID, exact executable path, process start time, and
session registry in its plugin state directory. The supervisor verifies all
process identity fields immediately before signaling and uses macOS `lockf` for
race-free control operations. Renderer output is discarded so it cannot grow an
unbounded background log.

## Checks

```bash
./scripts/check.sh
```

The checks cover declarative flow validation, deterministic choices, safe state interruption, edge-only direction changes, TypeScript and production frontend builds, and packaged arm64/x86_64 binaries. They also run ESLint and Prettier for web files, Clippy and rustfmt for Rust, Ruff for Python, ShellCheck and shfmt for shell scripts, actionlint for GitHub Actions, and Taplo for TOML. The repository intentionally uses non-unit validation scripts instead of checked-in unit tests or a Vitest dependency.

Use `pnpm run check:quality` for only formatting, linting, and type checks. Use `pnpm run format` to apply all configured formatters. GitHub Actions installs the non-Node quality tools and builds both macOS targets with the declared Rust 1.88 minimum.

`pnpm run check:lines` enforces a 199-line maximum for maintained source, including
Godot scripts and shaders. Scene serialization, styles, markup, documentation and
lockfiles retain the repository exemptions. Native Godot verification and current
limits are recorded under `var/godot-full-sync/`; builds and headless diagnostics
do not substitute for the live visual, ocean, terminal, focus and voice checks.

## Manual visual check

1. Run `./scripts/build.sh` and link the plugin.
2. Invoke `pet-town.village-on` while at least two Herdr agents exist.
3. Confirm citizens appear centered just above the Dock, empty window space passes clicks through, and clicking a pet focuses its exact Herdr agent pane.
4. Confirm each pet moves to a screen edge, turns only there, and continues in the direction it faces with its project name following above.
5. Change agents between working, blocked, done, idle, and unknown; confirm Idle and Unknown hide the complete pet, Running walks, and Blocked and Completed stay in place.
6. Confirm the Assets gallery contains exactly the six KayKit Adventurers and four KayKit Skeletons, and each character uses only its normal walk APNG.
7. Complete an agent and confirm its character remains visible with the same walk animation until its state changes or the completed-pet delay hides it.
8. Drag a pet horizontally, release it, and confirm it resumes movement from the drop point without focusing the agent.
9. Right-click several bundled characters and confirm no animation actions are offered.
10. Right-click a pet and choose **Preferences…**. Confirm one native Settings window opens for that character, every visible pet freezes, and the Pets page lists each state with its APNG and action. Select a state to preview it, including whether it walks or stays in place. Deselect that character from the random cast, Apply, close Settings, and confirm any visible copy is replaced while allowed pets keep their assignments.
11. Enable **Hide completed pets**, select a delay, and Apply. Confirm completed pets disappear after that delay, no longer affect crowd sizing or clicks, and return immediately if they begin working or become blocked.
12. Confirm reduced movement or hover pauses only horizontal travel while the pet keeps animating; also confirm closing Settings discards any unapplied draft and resumes current Herdr states.
13. Edit `~/.pet-town/preferences.json`, invoke `pet-town.reload-preferences`, and confirm valid changes load while invalid JSON is preserved and rejected.
14. Invoke `pet-town.village-off` and confirm the strip disappears.
