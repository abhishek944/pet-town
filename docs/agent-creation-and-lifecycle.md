# Agent creation and lifecycle

**User goal:** Start an agent in a coding tool and see one pet that reflects its current activity until the session ends.

Pet Town observes ordinary agent sessions; the user normally starts them in Herdr, Claude Code, Codex, OpenCode, Pi, Factory Droid, or Cursor. The explicit [onboarding Test](onboarding.md) is a narrow exception: it can create one app-owned sample session in a temporary demo folder, preserving the tool's approvals. It never creates an agent simply by opening onboarding. The voice assistant is a separate path that can launch its own Pi agent; see the [orchestrator flow](orchestrator.md).

```text
User starts an agent in Herdr or a connected tool
  → Herdr snapshot or tool lifecycle event
  → Rust broker merges and normalizes live sessions
  → Pet Street and Pet Town receive public records
  → session ends or expires → pet leaves
```

## Creation and observation

1. Herdr is built in. For a standalone coding tool, the user first connects it in **Preferences… → Agents**, reviews the setup, and starts or reloads a tool session so its hook or extension becomes active. The coding tool continues to own the actual agent.
2. Herdr reports its current agents when the broker collects a snapshot. A connected standalone tool emits lifecycle events. Pet Town accepts supported sources, derives an opaque session key, keeps a safe label and normalized state, and stores a time-bounded local record.
3. The broker merges both sources. If a standalone event has a currently validated Herdr owner, Herdr wins and only one pet is shown. It sends the renderers only an opaque ID, normalized state, safe label, source, and optional numeric output-token activity; private focus routes stay in Rust. A validated hosted harness may add token activity to the existing Herdr pet without changing its state or creating another pet.
4. [Pet Street](2d-game.md) or [Pet Town](3d-game.md) chooses a pet appearance for each public record. The pet's behavior follows the normalized state, not the agent's prompt or tool output.

## State changes and end of life

| Normalized state | Typical meaning                              | Pet behavior source                     |
| ---------------- | -------------------------------------------- | --------------------------------------- |
| `idle`           | Session exists but is not doing work         | The selected pet's idle assignment      |
| `working`        | Agent is running                             | The selected pet's working assignment   |
| `blocked`        | Agent needs input or permission              | The selected pet's blocked assignment   |
| `done`           | A turn finished; the session may still exist | The selected pet's completed assignment |
| `unknown`        | Source has no usable activity state          | The selected pet's unknown assignment   |

An event can move a standalone session between these states. Herdr's current snapshot supplies its own state. For standalone Codex, `done` lasts up to five minutes after the completion event, then appears as `idle` on the next snapshot even without another hook. Clicking a completed Codex pet also marks it `idle` immediately when Codex Desktop is successfully focused; focusing a fallback terminal or failing to focus Codex does not. A new event can change its state sooner. This change does not extend the stored session's expiry. A `done` state is not a session-end signal: the pet can remain until the agent exits, a later event changes its state, or a visibility preference hides completed pets.

On a normal standalone session-end event, the local record is removed. If that event never arrives, the record expires after 24 hours. A Herdr pet leaves when it no longer appears in the collected roster. Pet Street waits for three missed polls before fading a departed pet; Pet Town reconciles its companion roster against the latest bridge snapshot.

**Failure path:** An unavailable hook does not block the coding tool. A disconnected source cannot supply fresh state; the views should show their existing connection or availability feedback rather than invent an agent. Focus requests always revalidate the current private route before opening an existing application or Herdr pane.

**Implementation and setup:** [Agent connections](agent-connections.md), [multi-harness adapter architecture](multi-harness-adapters.md), and the [Rust broker](../packages/pet-town-agent-broker/src/lib.rs).
