# Bundled 2D pets

Each folder contains a `flow.json` plus the APNGs that its states reference. The folder name and `flow.json` ID must match. The build discovers these folders automatically. User pets are stored privately by Pet Studio and use the same state format.

Every pet maps each agent state to an APNG and one on-screen action: `idle` or `walking`. `idle` keeps the pet in place; `walking` moves it horizontally. Set `visible: false` for hidden states. The Mayor can also use `listening` and `speaking` states; regular agents never use them. See [the behavior pack format](../../../../docs/behavior-packs.md) for an example.

Each bundled folder also contains five separate transparent Ocean-theme APNGs: `ocean-rowing.png` for Working, `ocean-blocked.png` for Blocked, `ocean-done.png` for Completed, `ocean-listening.png` for Mayor Listening, and `ocean-speaking.png` for Mayor Speaking. Idle and Unknown remain hidden. The App 2D strip theme chooses Ocean for all bundled pets; with App Standard, each pet can independently choose between Standard behavior-pack APNGs and Ocean artwork. The Standard state animations are untouched. Custom pets have no bundled Ocean option.

The bundled KayKit roster uses walking APNGs. All ten bundled KayKit pets have `blocked.png` (thought bubble to exclamation) and `sleep.png` (growing Zs) for Blocked and Completed. Their walking APNG remains the Running animation. Each also has `listen.png`, a stationary listening APNG with a pulsing horizontal audio waveform above its head, and `speak.png`, a stationary speaking APNG with an animated chat bubble, for the Mayor's voice states. The generated source sheets and review copies are stored under `~/Desktop/pet-town-sprites/`; the copies in these folders are the runtime assets. To add artwork, add the file to the pet folder, add a named entry under `clips`, and point the desired state at that animation. Right-click animation actions are retired; **Preferences…** remains available.

Run `pnpm run check:flow` from the repository root after changing a pack.
