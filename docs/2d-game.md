# 2D game flow

**User goal:** See a live coding agent as a pet in the desktop village and open the agent by selecting the pet.

```text
Herdr or connected coding tool
  → Rust agent broker
  → public agent snapshot
  → Tauri WebView village
  → pet animation, label, movement, and interaction
```

1. The desktop app collects Herdr sessions and connected coding-tool events. The broker normalizes each live agent to an opaque ID, state, safe display label, and source. A validated Herdr-owned session appears once.
2. The village assigns an available pet appearance and reads its behavior pack. The current agent state selects a visible APNG and either `idle` or `walking` movement. Hidden states do not draw a pet.
3. A working pet walks horizontally and turns at screen edges. Blocked and completed pets stay in place. Names follow the visible pets. On macOS, the transparent pet strip remains visible above other apps' full-screen Spaces while letting clicks pass through outside pets. The village updates when the broker snapshot changes and removes a pet after the departure grace period.
4. Clicking a pet asks Rust to focus the current agent. Rust revalidates its private route first. Herdr can focus the exact pane; a standalone connection can activate an already-running matching application. A local Codex Desktop session with a valid thread UUID can also open its exact conversation using Codex's deep link. Dragging a pet changes its position in the village.

**Other outcomes:** When there are no visible live agents, the village has no agent pets to draw. An unavailable or stale focus route does not launch or resume an agent. Settings can change the visible cast and behavior assignments.

**Implementation and formats:** [Desktop architecture](../README.md#architecture), [behavior packs](behavior-packs.md), [agent connections](agent-connections.md), and [bundled pet folders](../apps/pet-town/src/pets/README.md).
