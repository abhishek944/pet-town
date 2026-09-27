# Bundled 2D pets

Each folder contains a `flow.json` plus the APNGs that its states reference. The folder name and `flow.json` ID must match. The build discovers these folders automatically. User pets are stored privately by Pet Studio and use the same state format.

Every pet maps each agent state to an APNG and one on-screen action: `idle` or `walking`. `idle` keeps the pet in place; `walking` moves it horizontally. Set `visible: false` for hidden states. The voice assistant can also use the `listening` state. See [the behavior pack format](../../../../docs/behavior-packs.md) for an example.

The bundled KayKit roster uses walking APNGs. All ten bundled KayKit pets have `blocked.png` (thought bubble to exclamation) and `sleep.png` (growing Zs) for Blocked and Completed. Their walking APNG remains the Running animation. The generated source sheets and review copies are stored under `~/Desktop/pet-town-sprites/`; the copies in these folders are the runtime assets. To add artwork, add the file to the pet folder, add a named entry under `clips`, and point the desired state at that animation. Right-click animation actions are retired; **Preferences…** remains available.

Run `pnpm run check:flow` from the repository root after changing a pack.
