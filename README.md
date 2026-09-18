# Pet Village

Pet Village turns live Herdr, Claude Code, Codex, OpenCode, Pi, Factory Droid,
and Cursor sessions into small animated citizens in a transparent village along
the bottom of your desktop.

![Pet Village demo — 13s from Screen Recording (1:17–1:30) showing 15 agents + village pets](assets/pets-demo.gif)

<p align="center">
  <a href="assets/pets-demo.mp4">MP4 (642 KB, 1280×832)</a> · GIF autoplays above (2.0 MB, 800×520, 12 fps) — full 13s clip at <code>1:17–1:30</code>
</p>

This is a **Tauri v2 application**, built from scratch with a Rust backend and a
TypeScript/CSS web interface. It uses one lightweight window for the whole
village—never one window per agent and never an arbitrary agent limit.

## Install

Pet Village is a standalone macOS desktop app. Download the release app for
your Mac, or keep the matching `bin/macos-*` package together and open its
`pet-village` executable. Each package includes the private Node/Pi runtime used
by the optional voice orchestrator; users do not install Node.js, Pi, or Rust.
The village discovers configured coding-agent connections without requiring
Herdr.

Herdr users can additionally install the optional Herdr adapter:

```bash
herdr plugin install abhishek944/pet-village
```

That adapter starts the same desktop app with Herdr and contributes validated
Herdr sessions. Its optional actions remain available for village status,
Preferences, reload, and start/stop control. Marketplace plugins run with your
user permissions, so review their manifest and source before installing.

## What it does

- Polls every registered Herdr session once per second through safe Rust commands (no shell), with a two-second timeout and a 1 MiB output limit.
- Assigns agents from an approved cast of twenty companions, with distinct packs reused only after every character has appeared.
- Runs state-authored sprite flows across the full screen while each name follows its character.
- Turns characters only at screen edges and always faces them in their movement direction.
- Selects a validated declarative behavior flow solely from agent state:
  - `working` → continuously move through distinct walk and action animations
  - `blocked` → waiting flow
  - `idle` → hidden through the pack's ordinary `hide` flow action
  - `unknown` → each pet's cautious fallback flow
  - `done` → celebrates once, then loops a clearly visible sleeping animation with floating Zs
- Keeps each pet's `flow.json` and APNG assets together in one self-contained folder; see [the behavior pack format](docs/behavior-packs.md).
- Gives the Viking a working cycle that alternates walking and hammering, plus a seated thinking animation when blocked.
- Uses no floating status symbols; the sprite animation communicates the current state.
- Waits for three missed polls before a departed citizen fades away.
- Shrinks citizens automatically for large crowds.
- Labels each character with its Herdr pane name when present, otherwise `{space-name}-{tab}` (for example `pet-village-1`), and uses the current folder name only when Herdr naming is unavailable.
- Focuses an exact revalidated Herdr pane when its pet is clicked, or the best already-running application known for a standalone harness without launching or resuming anything.
- Lets users drag a pet horizontally; it pauses while held and resumes its existing movement from the drop point.
- Builds each pet's right-click menu from validated `flow.json` actions; every bundled pet currently exposes **Wave**.
- Opens a native macOS Settings window from **Preferences…** in that menu or the Herdr plugin action, with per-character controls, a **Pet Studio**, and an **Agents** tab for atomic, reversible setup of all six standalone harness integrations.
- Lets users choose between creating a new pet and extending an existing pet. New pets can use a newly generated reference or an existing pet as their reference; animation generation uses one coherent 3-column × 2-row sheet, locally extracts six aligned frames, and keeps review and APNG approval explicit. Extensions can import or generate APNGs, optionally replace individual state animations, and add menu actions without modifying bundled assets or rebuilding.
- Adds a user-named voice assistant that uses the bundled Mossback tortoise, listens locally for “Hey, <name>,” starts GPT-Live 1 without opening another visible window, and delegates computer work to a persistent Pi agent in a dedicated Herdr pane.
- Runs that Pi agent with GPT-5.6 Luna at medium thinking, supports spoken task cancellation, and keeps voice transcripts ephemeral.
- Keeps the assistant independent from Pet Studio: its bundled Mossback walking and listening animations are fixed and cannot be replaced by user pet creation or extensions.
- Includes every character in random assignment by default, lets users deselect unwanted characters, and immediately replaces visible deselected pets after Apply while preserving allowed assignments.
- Optionally hides completed sleeping pets after 1, 5, 15, 30, or 60 minutes while continuing to monitor them and restoring them immediately when their state changes.
- Pauses the visible village while Settings edits a draft; **Apply** saves the complete versioned file at `~/.pet-village/preferences.json`, while closing discards unapplied changes and resumes current agent states.
- Keeps the window transparent, undecorated, always on top, and visible across
  macOS workspaces. Empty pixels are click-through while citizen pixels remain
  interactive.
- Runs directly as a standalone app; the optional Herdr adapter can also start and stop it through plugin actions.

## Architecture

```text
Standalone Tauri process
  ├─ Rust adapter broker: lifecycle records, Herdr discovery, and focus routes
  ├─ Rust orchestrator state: local wake bridge, GPT-Live session creation, and Pi lifecycle
  ├─ WebView: village, Settings, and ephemeral WebRTC voice conversation
  └─ dedicated Herdr pane: bundled Pi → GPT-5.6 Luna / medium → Herdr skill
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

## Build

```bash
./scripts/build.sh
```

The release executable is written to
`apps/pet-village/src-tauri/target/<rust-target>/release/pet-village` and copied
into the matching `bin/macos-*` plugin package directory. The build also downloads a
pinned Node release and installs a pinned Pi package into that architecture's
bundled runtime directory.

The repository is a pnpm workspace orchestrated by Turborepo. The released
v1 desktop application lives in `apps/pet-village`; the greenfield Excalibur
v2 application lives separately in `apps/pet-village-v2`, and its headless
contracts live in `packages/pet-village-core`. The public landing page lives in
`apps/web`; repository scripts, plugin metadata, documentation, and checked-in
packages remain at the root.

For development:

```bash
corepack prepare pnpm@10.28.2 --activate
pnpm install --frozen-lockfile
pnpm run tauri dev
```

Run the v1 desktop frontend with `pnpm run dev` or the v2 frontend with
`pnpm run dev:v2`. The selector defaults to v1; set `PET_VILLAGE_APP=v2` for
`build:desktop`, `build:desktop:frontend`, `tauri`, or `./scripts/build.sh` to
select v2. Each selected binary contains only that implementation. Start the
landing page at `http://127.0.0.1:4173` with `pnpm run dev:web`. Root build,
type-check, and lint commands are delegated through Turbo to the workspaces.

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
2. Invoke `pet-village.village-on` while at least two Herdr agents exist.
3. Confirm citizens appear centered just above the Dock, empty window space passes clicks through, and clicking a pet focuses its exact Herdr agent pane.
4. Confirm each pet moves to a screen edge, turns only there, and continues in the direction it faces with its project name following above.
5. Change agents between working, blocked, done, idle, and unknown; confirm idle flows hide the complete citizen while the other states restore it.
6. Watch working pets use distinct movement and action animations. Confirm the Viking hammers, Ember practices with a sword, Mossback bows, Skiff scans, Mira checks her route map and drills with a spear, Jun repairs his bird, Brassbell sorts parcels, and Pebble blocks and flourishes its spoon.
7. Complete an agent and confirm its pet celebrates once, then continues sleeping with animated Zs until its state changes.
8. Drag a pet horizontally, release it, and confirm it resumes movement from the drop point without focusing the agent.
9. Right-click several pets, choose **Wave**, and confirm each waves once before resuming its exact prior behavior. Change an agent's state during Wave and confirm the new state interrupts it.
10. Right-click a pet and choose **Preferences…**. Confirm one native Settings window opens for that character, every visible pet freezes, the preview reflects walking speed and reduced movement, and hovering the preview pauses its travel when **Stop walking while hovered** is enabled. Deselect that character from the random cast, Apply, close Settings, and confirm any visible copy is replaced while allowed pets keep their assignments.
11. Enable **Hide completed pets**, select a delay, and Apply. Confirm completed pets disappear after that delay, no longer affect crowd sizing or clicks, and return immediately if they begin working or become blocked.
12. Confirm reduced movement or hover pauses only horizontal travel while the pet keeps animating; also confirm closing Settings discards any unapplied draft and resumes current Herdr states.
13. Edit `~/.pet-village/preferences.json`, invoke `pet-village.reload-preferences`, and confirm valid changes load while invalid JSON is preserved and rejected.
14. Invoke `pet-village.village-off` and confirm the strip disappears.

## Privacy

Ordinary village monitoring remains local. It does not send coding-agent prompts, code, tool arguments, output, credentials, full paths, or raw harness session IDs to OpenAI. Only opaque public IDs, normalized status, source names, and sanitized labels cross into the village interface.

Voice is off until the user chooses **Start assistant** in Settings, and **Stop assistant** turns it off again. On-device recognition listens locally for the configured wake phrase; after the wake phrase is heard, microphone audio and ephemeral transcripts pass through GPT-Live 1 over WebRTC without opening another visible window. Only delegated conversation context and the concise Pi result are routed between GPT-Live and the dedicated Pi agent. Ending the conversation stops microphone capture immediately and clears app-held transcripts; five minutes without user speech also ends the paid Live session. The OpenAI API key stays in Rust memory and may come from `OPENAI_API_KEY` or the macOS Keychain item with service `pet-village.openai` and account `api-key`.

Pet Studio makes an OpenAI request only after the user presses a generation button; imported APNGs stay local. That request contains the Studio prompt and, when creating an animation, the character reference the user approved. Animation generation makes one provider request for a coherent 3-column × 2-row sheet, then `pi-image-gen` extracts and validates the six frames locally. API charges may apply. Rust passes the OpenAI API key to the private local Node worker only through its process environment; the key is sent only to the fixed OpenAI endpoint and is never placed in command arguments, request JSON, preferences, frontend state, or logs. Generated references, sheets, frames, APNGs, preferences, and short-lived event records remain under `~/.pet-village/` unless the user exports them. Existing-pet extensions are stored separately under `~/.pet-village/pet-packs/extensions/` as validated, versioned overlays, so bundled pet files remain immutable.

## License

MIT
