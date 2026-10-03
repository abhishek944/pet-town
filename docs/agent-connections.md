# Agent connections

Pet Town can show sessions from Herdr, Claude Code, Codex, OpenCode, Pi, Factory Droid, and Cursor in one village. Herdr is built in. The other tools use their normal hook or extension systems, so users keep launching each tool as usual.

## Setup

1. Open **Preferences…** and choose **Agents**.
2. Open an adapter card. The overview groups Factory Droid and Cursor, but each has its own control in the detail view.
3. Choose **Connect…** and review the confirmation.
4. Restart the coding tool or begin a new session so it reloads its global configuration. Pi can also reload extensions with `/reload`.
5. In Codex, open `/hooks` and verify the exact Pet Town hook definition. Codex skips new or changed non-managed hooks until they are trusted, but its trust hashes are not exposed to Pet Town, so Settings honestly remains **Verify in Codex**. If `[features] hooks = false` is set, enable hooks first. Pet Town checks Codex's Unix administrator files at `/etc/codex/requirements.toml` and `/etc/codex/managed_config.toml`; an enforced `allow_managed_hooks_only = true` policy blocks user hooks and must be changed by that administrator. Cloud-managed and macOS MDM policy still require confirmation in Codex.

The app installs only marked entries or a dedicated marked plugin file:

- Claude Code: global lifecycle hooks
- Codex: a marked block in the global TOML configuration
- OpenCode: a global JavaScript plugin
- Pi: a global TypeScript extension
- Factory Droid: global lifecycle hooks
- Cursor: global editor hooks

Setup preserves unrelated configuration, creates a private backup before replacing an existing file, and validates staged content before publishing each update with an exclusive atomic rename. **Remove…** deletes only entries or files marked as owned by Pet Town. If a dedicated plugin filename is already owned by another file, Settings reports **File in use** and does not overwrite it.

All hook entry points fail open. If Pet Town is stopped, unavailable, or receives an unsupported event, the coding tool continues normally.

## What is recorded

A hook sends its event to the local Pet Town process. The process stores only:

- the adapter name;
- a one-way opaque session key;
- a normalized activity state;
- a safe project-folder basename when available;
- the observation time;
- a small allow-listed application focus hint when available;
- for Codex, a validated local UUID thread ID in the private, owner-only session record (never in the public agent snapshot), used solely to open that conversation;
- an optional private Herdr ownership claim.

Prompts, code, tool arguments, output, credentials, transcript contents, and full project paths are not stored or sent to the web interface. Except for the private Codex thread route, raw harness session identifiers are not stored; no raw identifiers are sent to the web interface. Records expire after 24 hours if a harness cannot deliver its normal session-end event. The registry is time-bounded rather than count-capped: every valid live session and its end marker are retained during that window so high concurrency and delayed events cannot silently lose or resurrect pets.

## Codex usage

The existing Codex hook integration also registers its supplied session transcript for local usage collection. Pet Town validates the transcript location, ownership, and session header; headers larger than 1 MiB are unsupported. Its private `~/.pet-town/codex-usage/` records contain the session identity and transcript path, opaque companion aliases, replay checkpoints, token counters, and recorded model names. These records are separate from the short-lived activity registry and remain after a session ends. This extends the private metadata boundary above; no transcript text, prompts, answers, credentials, or full paths cross into the town renderer or a remote service.

Opening the native town refreshes this collector through the blocking snapshot worker, independently of which companion is followed. The collector reads a bounded amount of new complete transcript records on each refresh. It replaces cumulative counters, retains input/cache/output/reasoning breakdowns, and attributes usage increments to the recorded model. Partial replay or missing transcripts are labeled as partial/unavailable rather than zero.

On restart, saved checkpoints allow missed records to be replayed, including sessions that finished while the collector was stopped. A known transcript moved to Codex's archive can be recovered by its exact filename and validated session header. Deleted transcripts cannot supply further readings; previously recorded measurements remain partial. New sessions require a valid hook event to register. Pet Town does not import the entire Codex history or include spawned subagents that have no separately registered transcript. Sessions with inherited fork history are tracked as unavailable and excluded from totals until their own usage can be safely separated.

The town's price display is an **estimated standard-credit equivalent**, using published Codex rates verified on October 2, 2026. Cached input is already included in input, and reasoning is already included in output. Estimates respect recorded model changes; unknown rates or incomplete model attribution produce an unavailable estimate. This is not billed cost, Fast-mode pricing, subscription allowance, or an API dollar charge. See [Codex pricing](https://learn.chatgpt.com/docs/pricing#token-rates). The [transcript format is not a stable hook interface](https://learn.chatgpt.com/docs/hooks#common-input-fields), so unsupported records may require a collector update.

For local diagnostics, run the installed binary with `--usage-snapshot`. It refreshes registered sessions and prints only the same public readings used by the town. Each invocation performs bounded replay; large histories need multiple refreshes to catch up. `PET_TOWN_USAGE_DIRECTORY` can point to an absolute private child directory for isolated diagnostics without changing the standard store. Disconnecting Codex suppresses usage collection and display; it does not erase retained measurements.

## Duplicate prevention

When one of these harnesses runs inside Herdr, its event may carry a private claim for the hosting pane. The broker validates that claim against the current Herdr roster. A validated Herdr pet is authoritative and the standalone record is hidden. A stale or unvalidated claim never merges sessions.

## Focus behavior

Implementation changes must preserve the [documented pet focus flow](pet-focus.md), including the separate 2D helper, nonactivating macOS panel state, helper event-loop servicing, and exact running-app identity for Codex links. That guide includes the user-confirmed regression baseline and live checks.

A Herdr pet focuses its exact, revalidated pane. A Codex pet first focuses the already-running Codex desktop app and, for a validated local UUID thread, opens `codex://threads/<id>` to select its conversation. Remote/SSH threads may not resolve in Codex Desktop. If Codex Desktop is not running, the pet falls back to its known running terminal/editor app. Successfully focusing Codex Desktop changes a completed standalone Codex pet to idle immediately; a fallback focus does not. Other standalone pets focus the best already-running application known from the local hook environment. Pet Town does not start an application, choose an unverified terminal tab, or attach to a session. Attach and resume remain explicit actions in the coding tool.

The local Three.js town uses the same broker through the desktop app's **Open 3D Town** window. Its `get_town_snapshot` and `town_action` commands require the native town window and its allowed local URL. The snapshot contains only public agent fields and the Mayor's public presentation state; private focus routes stay in Rust. Choosing **Open agent** or **Open in Herdr** sends only an opaque ID. Rust recollects the roster and revalidates the route through the existing focus helper before acting. While the town window has focus, the desktop app temporarily suppresses the 2D strip; switching away or closing restores the strip without changing the user's saved visibility preference.

The Three.js roster hides idle and unknown ordinary agents and keeps Mayor separate from its owned Firstmate session. Selecting or controlling a companion only affects the game; **Open agent** is the explicit desktop focus action. The standalone browser version supports world gameplay but cannot read desktop agent state or invoke these native commands. Open the town from the desktop app to connect agents and Mayor. See [3D game flow](3d-game.md) for roster, camera and voice controls.

## User-owned live check

These checks use real interactive harness sessions and are intentionally performed by the user:

1. Connect one adapter in Settings and start a new session for that tool in a disposable project.
2. Submit a harmless prompt. Confirm one pet appears with only the project-folder basename in its label.
3. Trigger a normal tool operation. Confirm the pet shows working activity.
4. For tools that expose permission events, trigger a safe permission prompt and confirm the pet waits without the hook changing the permission decision.
5. Let the turn settle. Confirm the pet reaches its completed behavior, then exit the harness and confirm the pet disappears.
6. Click the pet while the harness application is already running. Confirm the best existing application is focused and that no new application, terminal tab, or resumed session is created. For a local Codex Desktop thread, confirm clicking its pet selects the exact conversation; for a remote thread, confirm Codex opens but note that Codex's remote deep-link support may not navigate. Click a completed Codex pet before five minutes have passed and confirm it changes to idle after Codex Desktop opens; without a click, confirm it changes to idle after five minutes.
7. Start the same harness inside a Herdr pane. Confirm the village shows one Herdr-owned pet rather than a Herdr pet plus a duplicate standalone pet.
8. In Settings, choose **Remove…**. Confirm unrelated harness settings remain and a newly started session no longer appears.
9. Repeat for Claude Code, Codex, OpenCode, Pi, Factory Droid, and Cursor.

A pending user-owned live check is not treated as a failed build, and this document does not claim those interactive checks passed.
