# Multi-harness adapter architecture

Pet Village is a standalone desktop village whose agent sources are adapters. Herdr is an optional adapter and remains the authoritative source when it hosts another coding harness.

## Runtime boundary

The Rust backend owns a small broker:

```text
Herdr snapshot ─┐
                ├─ adapter broker ─ normalized snapshot ─ village renderer
hook events ────┘
```

Every public agent record contains only:

- an opaque ID;
- the normalized state (`working`, `blocked`, `idle`, `done`, or `unknown`);
- a sanitized display label;
- the adapter source name.

Raw session identifiers, full paths, prompts, tool inputs, and agent output never cross into the renderer.

## Hook event bridge

The packaged binary's private adapter-event mode is the shared fail-open bridge for Claude Code, Codex, OpenCode, Pi, Factory Droid, and Cursor. A short-lived relay reads the harness JSON event from standard input, keeps only approved fields in memory, and hands sanitized data to a detached recorder. Harnesses that support background hooks use them; the OpenCode and Pi integrations spawn the recorder detached. `scripts/agent-hook.sh` remains a portable non-blocking wrapper for manual integration and binds successive lifecycle events to its harness parent.

The binary accepts only the six approved standalone source names, extracts a session identifier and safe project basename, maps the lifecycle event into the village state model, and atomically updates a bounded local registry under `~/.pet-village/agent-sessions/`. Installed hooks carry a private installation epoch, so events from removed or replaced hook generations stay rejected after reconnect. Disable, event publication, and record purge share one registry lock. The stored session key is opaque. A session-end event removes its record; stale records are reclaimed after 24 hours as a crash fallback. The registry has a 24-hour retention bound but no count cap: existing or new valid live records are not evicted, and end markers remain for the full window so delayed events cannot resurrect a pet.

The Agents Settings tab now installs and manages each harness through its supported global integration: lifecycle hooks for Claude Code, Codex, Factory Droid, and Cursor; a JavaScript plugin for OpenCode; and a TypeScript extension for Pi. Every write is previewed through a confirmation, preserves unrelated configuration, creates a private backup before replacement, and uses an atomic rename. Removal targets only marked entries or dedicated marked files. Hook failures always exit successfully so this observation layer cannot interrupt the harness.

## Herdr-hosted duplicate prevention

A hook event that inherits Herdr's pane context asks the current Herdr session to resolve the hinted pane and native agent-session incarnation. A private owner claim is recorded only when both are currently valid. Environment presence alone does not merge sessions.

On every broker collection:

1. The Herdr adapter produces the current authoritative roster.
2. The broker checks whether the claimed canonical pane and opaque incarnation exist now.
3. If it exists, the Herdr record wins and the hook event does not create another pet.
4. If it does not exist, the event remains a standalone harness session.

This rule applies equally to Claude Code, Codex, OpenCode, Pi, Factory Droid, and Cursor. It prevents duplicates without losing agents manually launched from a shell that happens to carry stale Herdr context.

## Focus

Focus routes remain private backend data. The Herdr route validates the agent incarnation before focusing the exact pane. Standalone events retain only an allow-listed application bundle hint derived from the local terminal environment, with Cursor using its known application identity. A click activates an already-running matching application; it never launches one or invents an exact terminal tab from a session ID. Attach and resume remain explicit user actions.

## Adapter setup

All planned stages are represented behind the same broker boundary. The exact setup paths, privacy behavior, removal guarantees, focus limits, and user-owned live verification steps are documented in [Agent connections](agent-connections.md).

The approved implementation and visual contracts are recorded under `var/multi-harness-pets/`.
