# Bundled 2D pets

Each folder contains a `flow.json` plus the animated WebP files that its states reference. The folder name and `flow.json` ID must match. The build discovers these folders automatically. User pets are stored privately by Pet Studio and use the same state format.

Every pet maps each agent state to a WebP animation and one on-screen action: `idle` or `walking`. `idle` keeps the pet in place; `walking` moves it horizontally. Set `visible: false` for hidden states. The Mayor can also use `listening` and `speaking` states; regular agents never use them. The current app fixes the Mayor to Knight, so other pets' voice artwork is available in Settings previews, not live Mayor use. See [the behavior pack format](../../../../docs/behavior-packs.md) for an example.

## Roster

There are 30 bundled pets: ten KayKit pets and twenty restored original pets. The original PNGs were recovered unchanged from the revision before commit `1caaa1d`. Their old multi-step flows now use the current single-animation state mappings: Running uses the first movement clip, Blocked uses the first blocked clip, and Completed uses Sleep. Idle and Unknown stay hidden. In Standard, Listening and Speaking reuse the Blocked animation; Ocean has dedicated voice artwork. All original clips, including Wave and work animations, remain available in Settings even though right-click animation actions are retired.

The restored pets are Bao Panda Chef, Bigfoot Yeti, Brassbell Automaton Porter, Cat, Dog, Ember Fox Ronin, Fern Potted Plant, Gus Mail Carrier, Human Male, Jun Clockwork Apprentice, Kip Penguin Postman, Mira Dune Spear Scout, Mossback Turtle Monk, Nib Dragon Hatchling, Pebble Slime Knight, Pudge Hedgehog, Skiff Raccoon Sky Pirate, Sol Capybara, Viking, and Wisp Little Ghost.

## Ocean and KayKit artwork

Every bundled pet folder also contains five separate transparent Ocean-theme WebP animations (150 total): `ocean-rowing.webp` for Working, `ocean-blocked.webp` for Blocked, `ocean-done.webp` for Completed, `ocean-listening.webp` for Mayor Listening, and `ocean-speaking.webp` for Mayor Speaking. Idle and Unknown remain hidden. The App Pet Street theme chooses Ocean for all Ocean-enabled pets; with App Standard, these pets can independently choose between Standard behavior-pack APNGs and Ocean artwork. The Standard state animations are untouched. Bundled Ocean canvases are 384×384, with their original frame counts, exact timing, infinite loops and sRGB metadata preserved. The twenty restored originals have identity-preserving Ocean artwork in wooden rowboats, with six frames at 160 ms each (960 ms loops). Custom pets without bundled Ocean assets continue using Standard artwork even when the App theme is Ocean.

The bundled KayKit roster uses walking WebP animations. All ten bundled KayKit pets have `blocked.webp` (thought bubble to exclamation) and `sleep.webp` (growing Zs) for Blocked and Completed. Their walking APNG remains the Running animation. Each also has `listen.webp`, a stationary listening animation with a pulsing horizontal audio waveform above its head, and `speak.webp`, a stationary speaking animation with an animated chat bubble, for the Mayor's voice states. The generated source sheets and review copies are stored under `~/Desktop/pet-town-sprites/`; the copies in these folders are the runtime assets. To add artwork, add the file to the pet folder, add a named entry under `clips`, and point the desired state at that animation. Right-click animation actions are retired; **Preferences…** remains available.

After adding 512×512 Ocean artwork, run `python3 scripts/resize-ocean-assets.py`
from the repository root using Python with Pillow installed. It stages and validates
the complete conversion before replacing files, keeps exact original working-tree
backups under `var/download-size/ocean-384-assets/`, and leaves Standard artwork
untouched. Existing 384×384 files are not resized again.

Run `pnpm run check:flow` from the repository root after changing a pack.
