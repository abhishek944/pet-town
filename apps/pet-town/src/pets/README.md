# Bundled 2D pets

Each folder contains a `flow.json` plus the APNGs that its states reference. The folder name and `flow.json` ID must match. The build discovers these folders automatically. User pets are stored privately by Pet Studio and use the same state format.

Every pet maps each agent state to an APNG and one on-screen action: `idle` or `walking`. `idle` keeps the pet in place; `walking` moves it horizontally. Set `visible: false` for hidden states. The Mayor can also use `listening` and `speaking` states; regular agents never use them. The current app fixes the Mayor to Knight, so other pets' voice artwork is available in Settings previews, not live Mayor use. See [the behavior pack format](../../../../docs/behavior-packs.md) for an example.

## Roster

There are 30 bundled pets: ten KayKit pets and twenty restored original pets. The original PNGs were recovered unchanged from the revision before commit `1caaa1d`. Their old multi-step flows now use the current single-animation state mappings: Running uses the first movement clip, Blocked uses the first blocked clip, and Completed uses Sleep. Idle and Unknown stay hidden. In Standard, Listening and Speaking reuse the Blocked animation; Ocean has dedicated voice artwork. All original clips, including Wave and work animations, remain available in Settings even though right-click animation actions are retired.

The restored pets are Bao Panda Chef, Bigfoot Yeti, Brassbell Automaton Porter, Cat, Dog, Ember Fox Ronin, Fern Potted Plant, Gus Mail Carrier, Human Male, Jun Clockwork Apprentice, Kip Penguin Postman, Mira Dune Spear Scout, Mossback Turtle Monk, Nib Dragon Hatchling, Pebble Slime Knight, Pudge Hedgehog, Skiff Raccoon Sky Pirate, Sol Capybara, Viking, and Wisp Little Ghost.

## Ocean and KayKit artwork

Every bundled pet folder also contains five separate transparent Ocean-theme APNGs (150 total): `ocean-rowing.png` for Working, `ocean-blocked.png` for Blocked, `ocean-done.png` for Completed, `ocean-listening.png` for Mayor Listening, and `ocean-speaking.png` for Mayor Speaking. Idle and Unknown remain hidden. The App 2D strip theme chooses Ocean for all Ocean-enabled pets; with App Standard, these pets can independently choose between Standard behavior-pack APNGs and Ocean artwork. The Standard state animations are untouched. The twenty restored originals have identity-preserving Ocean artwork in wooden rowboats, with six frames at 160 ms each (960 ms loops). Custom pets without bundled Ocean assets continue using Standard artwork even when the App theme is Ocean.

The bundled KayKit roster uses walking APNGs. All ten bundled KayKit pets have `blocked.png` (thought bubble to exclamation) and `sleep.png` (growing Zs) for Blocked and Completed. Their walking APNG remains the Running animation. Each also has `listen.png`, a stationary listening APNG with a pulsing horizontal audio waveform above its head, and `speak.png`, a stationary speaking APNG with an animated chat bubble, for the Mayor's voice states. The generated source sheets and review copies are stored under `~/Desktop/pet-town-sprites/`; the copies in these folders are the runtime assets. To add artwork, add the file to the pet folder, add a named entry under `clips`, and point the desired state at that animation. Right-click animation actions are retired; **Preferences…** remains available.

Run `pnpm run check:flow` from the repository root after changing a pack.
