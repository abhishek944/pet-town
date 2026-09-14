# Agent connections

Pet Village can show sessions from Herdr, Claude Code, Codex, OpenCode, Pi, Factory Droid, and Cursor in one village. Herdr is built in. The other tools use their normal hook or extension systems, so users keep launching each tool as usual.

## Setup

1. Open **Preferences…** and choose **Agents**.
2. Open an adapter card. The overview groups Factory Droid and Cursor, but each has its own control in the detail view.
3. Choose **Connect…** and review the confirmation.
4. Restart the coding tool or begin a new session so it reloads its global configuration. Pi can also reload extensions with `/reload`.
5. In Codex, open `/hooks` and verify the exact Pet Village hook definition. Codex skips new or changed non-managed hooks until they are trusted, but its trust hashes are not exposed to Pet Village, so Settings honestly remains **Verify in Codex**. If `[features] hooks = false` is set, enable hooks first. Pet Village checks Codex's Unix administrator files at `/etc/codex/requirements.toml` and `/etc/codex/managed_config.toml`; an enforced `allow_managed_hooks_only = true` policy blocks user hooks and must be changed by that administrator. Cloud-managed and macOS MDM policy still require confirmation in Codex.

The app installs only marked entries or a dedicated marked plugin file:

- Claude Code: global lifecycle hooks
- Codex: a marked block in the global TOML configuration
- OpenCode: a global JavaScript plugin
- Pi: a global TypeScript extension
- Factory Droid: global lifecycle hooks
- Cursor: global editor hooks

Setup preserves unrelated configuration, creates a private backup before replacing an existing file, and validates staged content before publishing each update with an exclusive atomic rename. **Remove…** deletes only entries or files marked as owned by Pet Village. If a dedicated plugin filename is already owned by another file, Settings reports **File in use** and does not overwrite it.

All hook entry points fail open. If Pet Village is stopped, unavailable, or receives an unsupported event, the coding tool continues normally.

## What is recorded

A hook sends its event to the local Pet Village process. The process stores only:

- the adapter name;
- a one-way opaque session key;
- a normalized activity state;
- a safe project-folder basename when available;
- the observation time;
- a small allow-listed application focus hint when available;
- an optional private Herdr ownership claim.

Prompts, code, tool arguments, output, credentials, transcript contents, full project paths, and raw harness session identifiers are not stored or sent to the web interface. Records expire after 24 hours if a harness cannot deliver its normal session-end event. The registry is time-bounded rather than count-capped: every valid live session and its end marker are retained during that window so high concurrency and delayed events cannot silently lose or resurrect pets.

## Duplicate prevention

When one of these harnesses runs inside Herdr, its event may carry a private claim for the hosting pane. The broker validates that claim against the current Herdr roster. A validated Herdr pet is authoritative and the standalone record is hidden. A stale or unvalidated claim never merges sessions.

## Focus behavior

A Herdr pet focuses its exact, revalidated pane. A standalone pet focuses the best already-running application known from the local hook environment. It does not start an application, choose an unverified terminal tab, or attach to a session. Attach and resume remain explicit actions in the coding tool.

## User-owned live check

These checks use real interactive harness sessions and are intentionally performed by the user:

1. Connect one adapter in Settings and start a new session for that tool in a disposable project.
2. Submit a harmless prompt. Confirm one pet appears with only the project-folder basename in its label.
3. Trigger a normal tool operation. Confirm the pet shows working activity.
4. For tools that expose permission events, trigger a safe permission prompt and confirm the pet waits without the hook changing the permission decision.
5. Let the turn settle. Confirm the pet reaches its completed behavior, then exit the harness and confirm the pet disappears.
6. Click the pet while the harness application is already running. Confirm the best existing application is focused and that no new application, terminal tab, or resumed session is created.
7. Start the same harness inside a Herdr pane. Confirm the village shows one Herdr-owned pet rather than a Herdr pet plus a duplicate standalone pet.
8. In Settings, choose **Remove…**. Confirm unrelated harness settings remain and a newly started session no longer appears.
9. Repeat for Claude Code, Codex, OpenCode, Pi, Factory Droid, and Cursor.

A pending user-owned live check is not treated as a failed build, and this document does not claim those interactive checks passed.
