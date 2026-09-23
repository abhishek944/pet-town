# 3D game flow

**User goal:** Open the authored town, follow live agents as 3D companions, and personalize it with decorative trees.

```text
Open 3D Town
  → Godot process and local bridge
  → Rust broker's public agent snapshot
  → Godot companion roster
  → status-driven animation and movement on baked navigation
```

1. The user chooses **Open 3D Town** in the desktop app. The app starts the local Godot project and its private bridge. While Godot is active, the desktop app suppresses the 2D strip temporarily.
2. The Rust broker remains the authority for live agents. Godot receives only the public ID, normalized state, safe label, and source. It reconciles that snapshot into one companion per visible live agent (idle and unknown stay hidden, matching the 2D town) and reuses the available KayKit appearances.
3. Companion scripts choose behavior from each normalized state. They move between saved activity markers using baked navigation and collision. Terrain, buildings, roads, navigation, and companion collision remain static authored content; tree geometry is exposed separately as visual-only, individually editable nodes.
4. Tree editing is hidden at startup. The user presses **T** to place a new decorative tree without opening the editor, then clicks a raycast town surface to place it. Double-clicking any tree opens its editor panel; it can be moved, rotated, resized, or deleted. The panel closes with **Close** or **Escape**. Trees are visual-only: overlaps are allowed and they do not change navigation or companion collision. New-tree placement and authored-tree overrides/deletions are saved to `user://town_layout.json` and restored locally at startup. Tree editing stays in the main game and auto-saves; it is not part of Settings Apply.
5. **Option+S** opens a centered 3D Settings shell in the town with individual entries for the ten 3D pet appearances. Town, Companions, Camera & comfort, and Decorations sections are present, but the design-preview lighting, sounds, pet movement, and camera controls are deferred. Apply is disabled while there are no editable settings. Opening Settings suspends an unfinished tree placement without saving or cancelling it; closing resumes placement. Escape or Option+S closes Settings.
6. The user can select or follow a companion and open its details. While following, **C** toggles local walking control: WASD or arrow keys move the pet relative to the camera within the baked walkable area. Releasing control restores status-driven movement; it does not control the underlying coding agent. An action that opens the underlying agent sends only the opaque ID back to Rust, which checks the current private focus route before acting.
7. A separate mayor state supplies the mayor's name, listening state, and wake-focus event. Leaving Godot restores the desktop strip according to the saved visibility preference.

**Other outcomes:** If the bridge is unavailable, Godot shows a connection notice and retries. An empty live roster leaves no ordinary agent companions. A departed agent is removed during roster reconciliation.

**Implementation and authoring:** [Godot guide](../apps/pet-town-godot/README.md), [agent connections](agent-connections.md), and [adapter architecture](multi-harness-adapters.md).
