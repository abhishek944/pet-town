# Pet Town

Pet Town turns live Herdr, Claude Code, Codex, OpenCode, Pi, Factory Droid,
and Cursor sessions into small animated citizens in a transparent village along
the bottom of your desktop.

![Pet Town demo — 13s from Screen Recording (1:17–1:30) showing 15 agents + village pets](assets/pets-demo.gif)

<p align="center">
  <a href="assets/pets-demo.mp4">MP4 (642 KB, 1280×832)</a> · GIF autoplays above (2.0 MB, 800×520, 12 fps) — full 13s clip at <code>1:17–1:30</code>
</p>

This is a **Tauri v2 application**, built from scratch with a Rust backend and a
TypeScript/CSS web interface. It uses one lightweight window for the whole
village—never one window per agent and never an arbitrary agent limit.

## Install

Pet Town is a standalone macOS desktop app. Download the DMG for your Mac,
open it, and drag **Pet Town.app** into **Applications**. Launching the app opens
Settings and starts the town; use **Show Town / Hide Town** in Settings, the app
menu, or the tray menu without quitting the monitor. The application bundle
includes the private Node/Pi runtime used by the optional voice orchestrator;
users do not install Node.js, Pi, or Rust. The village discovers configured
coding-agent connections without requiring Herdr.

Herdr users can additionally install the optional Herdr adapter:

```bash
herdr plugin install abhishek944/pet-town
```

That adapter starts the same desktop app with Herdr and contributes validated
Herdr sessions. Its optional actions remain available for village status,
Preferences, reload, and start/stop control. Marketplace plugins run with your
user permissions, so review their manifest and source before installing.

## What it does

- Polls every registered Herdr session once per second through safe Rust commands (no shell), with a two-second timeout and a 1 MiB output limit.
- Assigns agents from an approved cast of ten KayKit pets, with distinct packs reused only after every character has appeared.
- Runs each state's chosen APNG with either an idle or walking action while each name follows its pet.
- Turns characters only at screen edges and always faces them in their movement direction.
- Selects an APNG and action solely from agent state: Running walks; Blocked and Completed stay in place; Idle and Unknown are hidden. The voice assistant also has a separate Listening state.
- Keeps each pet's `flow.json` and APNG assets together in one self-contained folder; see [the behavior pack format](docs/behavior-packs.md).
- Uses no floating status symbols; the sprite animation communicates the current state.
- Waits for three missed polls before a departed citizen fades away.
- Shrinks citizens automatically for large crowds.
- Labels each character with its Herdr pane name when present, otherwise `{space-name}-{tab}` (for example `pet-town-1`), and uses the current folder name only when Herdr naming is unavailable.
- Focuses an exact revalidated Herdr pane when its pet is clicked, or the best already-running application known for a standalone harness without launching or resuming anything.
- Lets users drag a pet horizontally; it pauses while held and resumes its existing movement from the drop point.
- Keeps **Preferences…** in each pet's right-click menu; menu animation actions are retired.
- Opens a native macOS Settings window when the installed app launches, from **Preferences…** in a pet menu, or from the Herdr plugin action, with direct **Show Town / Hide Town** controls, per-character controls, a **Pet Studio**, and an **Agents** tab for atomic, reversible setup of all six standalone harness integrations.
- Lets users create or extend a pet by importing transparent looping APNGs in Settings and choosing an APNG and idle or walking action for each state. The Pets page shows those assignments.
- Adds a user-named Mayor using the bundled Knight and one persistent Firstmate primary in Herdr. Live mode uses GPT-Live for speech; Standard mode uses transcription and generated speech.
- Runs Firstmate with GPT-5.6 Luna at medium thinking by default, supports task interruption, and keeps Live voice transcripts ephemeral.
- Keeps the assistant independent from Pet Studio: its bundled Knight walk animation is fixed and cannot be replaced by user pet creation or extensions.
- Includes every character in random assignment by default, lets users deselect unwanted characters, and immediately replaces visible deselected pets after Apply while preserving allowed assignments.
- Optionally hides completed pets after 1, 5, 15, 30, or 60 minutes while continuing to monitor them and restoring them immediately when their state changes.
- Pauses the visible village while Settings edits a draft; **Apply** saves the complete versioned file at `~/.pet-town/preferences.json`, while closing discards unapplied changes and resumes current agent states.
- Keeps the window transparent, undecorated, always on top, and visible across
  macOS workspaces. Empty pixels are click-through while citizen pixels remain
  interactive.
- Runs directly as a standalone app; the optional Herdr adapter can also start and stop it through plugin actions.

## Architecture

```text
Standalone Tauri process
  ├─ Rust adapter broker: lifecycle records, Herdr discovery, and focus routes
  ├─ Rust orchestrator state: local wake bridge, GPT-Live session creation, and Firstmate lifecycle
  ├─ WebView: village, Settings, and ephemeral WebRTC voice conversation
  └─ dedicated Herdr pane: trusted Firstmate checkout → selected Pi model
       ↑
optional Herdr plugin adapter (herdr-plugin.toml + scripts/supervisor.sh)
```

The optional Herdr plugin is only an adapter and lifecycle convenience. Every
Herdr startup registers its session socket; the desktop process polls those
sessions in parallel and namespaces pane IDs before merging them. If Herdr is
unavailable, standalone harness pets continue normally.

The backend places Herdr and six standalone harness sources behind one adapter
broker. Reversible lifecycle hooks or plugins feed a 24-hour-retained, fail-open local
event bridge; validated Herdr ownership prevents duplicate pets. See the
[multi-harness adapter architecture](docs/multi-harness-adapters.md) and
[Agent connections guide](docs/agent-connections.md).

## Requirements

**To install and run:**

- macOS (arm64 or x86_64)
- Herdr 0.9 or newer when using the optional adapter or voice orchestrator

The optional plugin registers with `platforms = ["macos"]`. On a supported Mac,
nothing else is needed—the prebuilt standalone binaries are bundled with the
repository.

**To build from source instead** (for example, during development or to apply a
change to the bundled renderer), additionally need:

- Node.js 20.19 or newer
- pnpm 10.28.2 (Corepack can install the version declared in `package.json`)
- Rust 1.88 or newer
- Xcode Command Line Tools
- Ruff, ShellCheck, shfmt, actionlint, and Taplo (`brew install ruff shellcheck shfmt actionlint taplo`)

The window uses Tauri's macOS private API for transparency. That is suitable for
direct distribution but not for Apple's Mac App Store. Linux and Windows can be
added later; always-on-top behavior on Linux depends on the desktop compositor.

## Develop and build both towns

From the repository root, with Godot 4 and the local 3D island assets installed:

```bash
pnpm run dev    # refresh frontend/Godot state, preserve Rust cache, launch the app
pnpm run build  # refresh frontend/Godot state, preserve Rust cache, build app + DMG
```

These are the only supported desktop run/build commands. They validate the local Godot install and required island assets, then stop Pet Town and Godot processes from this checkout, clear generated frontend/Vite/Turbo/Godot import state, and reimport the 3D project. They preserve Cargo's `apps/pet-town/src-tauri/target` directory so Rust builds can reuse compiled artifacts and rebuild only changed crates. Save work in those windows before running either command; other Godot projects are left alone. Dependencies, user preferences, purchased island sources, saved rendering meshes, baked navigation/collision, and the Rust build cache are preserved. **dev** launches Tauri with live watchers; **build** produces the complete native desktop app and DMG. The **Open 3D Town** menu opens the freshly imported Godot project. Godot is imported but not exported as a separate installer (this project has no Godot export preset). CI uses Turbo's workspace tasks internally; there is no separate frontend-only desktop build command.

The release executable is written to
`apps/pet-town/src-tauri/target/<rust-target>/release/pet-town` and copied
into the matching `bin/macos-*` plugin package directory for the optional Herdr
adapter. The same build produces **Pet Town.app** and a standard drag-to-Applications
DMG at `bin/macos-*/pet-town.dmg`. Tagged release builds upload those installers as
GitHub Release assets, and the landing page links to the versioned release URLs rather
than storing large installers in the website bundle. The build also downloads a pinned
Node release and installs a pinned Pi package inside that architecture's application
bundle.

The repository is a pnpm workspace orchestrated by Turborepo. The production
Tauri desktop application lives in `apps/pet-town`, the Godot implementation
lives in `apps/pet-town-godot-next`, and the public landing page lives in `apps/web`.
Repository scripts, plugin metadata, documentation, and checked-in packages
remain at the root.

For first-time development, use Corepack to select pnpm 10.28.2, then run `pnpm run dev`. That command installs dependencies and starts the Tauri desktop app after the clean Godot import. Changes made while development is running use the normal dev watchers; rerunning the command refreshes generated frontend/Godot state while retaining Cargo's incremental build cache. Start the landing page at `http://127.0.0.1:4173` with `pnpm run dev:web`. Type-check and lint commands still use Turbo. Godot development is
documented in `apps/pet-town-godot-next/README.md`.

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

## Privacy

Ordinary village monitoring remains local. It does not send coding-agent prompts, code, tool arguments, output, credentials, full paths, or raw harness session IDs to OpenAI. Only opaque public IDs, normalized status, source names, and sanitized labels cross into the village interface.

Voice is off until the user starts Mayor in Settings. In Live mode, on-device recognition listens locally for the configured wake phrase; after the wake phrase is heard, microphone audio and ephemeral transcripts pass through GPT-Live 1 over WebRTC without opening another visible window. Delegated requests and completed Firstmate replies pass between GPT-Live and the selected Firstmate primary. In Standard mode, recorded speech is transcribed and sent to that same primary; completed replies use generated speech. Ending the conversation stops microphone capture immediately and clears app-held transcripts; five minutes without user speech also ends the paid Live session. The OpenAI API key stays in Rust memory and may come from `OPENAI_API_KEY` or the macOS Keychain item with service `pet-town.openai` and account `api-key`.

Pet Studio does not contact an image provider. Users supply their own APNGs, which are validated and stored locally under `~/.pet-town/`. Existing-pet extensions are stored separately under `~/.pet-town/pet-packs/extensions/` as validated, versioned overlays, so bundled pet files remain immutable. The OpenAI API key is used only by the optional voice assistant and is never placed in command arguments, preferences, frontend state, or logs.

## License

MIT
