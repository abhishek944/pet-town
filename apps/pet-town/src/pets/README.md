# Bundled 2D pets

Each folder contains a `flow.json` plus the animated WebP files that its states reference, and may add its own activity artwork. The folder name and `flow.json` ID must match. The build discovers these folders automatically. User pets are stored privately by Pet Studio and use the same state format.

Every pet maps each agent state to a WebP animation and one on-screen action: `idle` or `walking`. `idle` keeps the pet in place; `walking` moves it horizontally. Set `visible: false` for hidden states. The Mayor can also use `listening` and `speaking` states; regular agents never use them. The current app fixes the Mayor to Knight, so other pets' voice artwork is available in Settings previews, not live Mayor use. See [the behavior pack format](../../../../docs/behavior-packs.md) for an example.

## Roster

There are 30 bundled pets: ten KayKit pets and twenty restored original pets. The original PNGs were recovered unchanged from the revision before commit `1caaa1d`. Their old multi-step flows now use the current single-animation state mappings: Running uses the first movement clip, Blocked uses the first blocked clip, and Completed uses Sleep. Idle and Unknown stay hidden. In Standard, Listening and Speaking reuse the Blocked animation; Ocean has dedicated voice artwork. All original clips, including Wave and work animations, remain available in Settings even though right-click animation actions are retired.

The restored pets are Bao Panda Chef, Bigfoot Yeti, Brassbell Automaton Porter, Cat, Dog, Ember Fox Ronin, Fern Potted Plant, Gus Mail Carrier, Human Male, Jun Clockwork Apprentice, Kip Penguin Postman, Mira Dune Spear Scout, Mossback Turtle Monk, Nib Dragon Hatchling, Pebble Slime Knight, Pudge Hedgehog, Skiff Raccoon Sky Pirate, Sol Capybara, Viking, and Wisp Little Ghost.

## Activity artwork

A bundled folder may publish the nine Pet Street action loops for Rollercoaster, Gold Mine and Tiny Railway. Each loop is `activity-<theme>-<state>.webp` for the `working`, `blocked` and `done` states, and `activity.json` describes them:

```json
{
  "formatVersion": 1,
  "clips": {
    "rollercoaster-working": {
      "asset": "activity-rollercoaster-working.webp",
      "durationMs": 960,
      "scale": 1.3,
      "anchorNormalized": [0.311, 0.6997]
    }
  }
}
```

The sidecar must contain exactly those nine keys. `durationMs` equals the encoded loop duration, `scale` is the canvas width relative to the shared 44px citizen size, and `anchorNormalized` is the measured support pixel in the full square canvas: hips/seat for Rollercoaster, feet or grounded-knee support for Gold Mine and Tiny Railway. The build validates every entry and URL at build time; the runtime aligns the sprite on the theme support line through the anchor, plays the loop in place, and omits the detached pickaxe or wrench prop when the sprite already holds it. Missing or invalid metadata falls back to the state clips. Installed Pet Studio extensions keep their own clips and state assignments.

## Moonlit Canopy artwork

Moonlit Canopy keeps its accepted action in `../moonlit-assets/`, separately from the exact-nine `activity.json` schema. Cat has six unchanged 512×512 transparent PNG poses at 150ms each and the accepted 900ms APNG for Settings previews. Other bundled pets have dedicated generated six-frame climbing loops under `../moonlit-assets/climbers/<id>/`: `frame-01.png` through `frame-06.png`, `climb.apng` for Settings, and `climb.json` with six normalized hand/paw grips, a resting-frame index, foot support and 150ms frame duration. The live renderer selects character-specific PNG frames on its existing shared clock and uses measured grip anchors on the mild vine. Blocked and completed pets hold their resting pose on inward leaf nooks. The `*-perch.png` files are first frames extracted from each original bundled `walk.webp`, not climbing substitutes: pets without dedicated climbing art keep their own identity on leaf nooks, including while Working. Installed extensions retain their own state art and do not inherit bundled actions. Generated art still requires user visual acceptance for identity, anatomy and acting; deterministic validation does not establish those qualities.

## Ocean and KayKit artwork

Every bundled pet folder also contains five separate transparent Ocean-theme WebP animations (150 total): `ocean-rowing.webp` for Working, `ocean-blocked.webp` for Blocked, `ocean-done.webp` for Completed, `ocean-listening.webp` for Mayor Listening, and `ocean-speaking.webp` for Mayor Speaking. Idle and Unknown remain hidden. The App Pet Street theme chooses Ocean for all Ocean-enabled pets; with App Standard, these pets can independently choose between Standard behavior-pack APNGs and Ocean artwork. The Standard state animations are untouched. Bundled Ocean canvases are 384×384, with their original frame counts, exact timing, infinite loops and sRGB metadata preserved. The twenty restored originals have identity-preserving Ocean artwork in wooden rowboats, with six frames at 160 ms each (960 ms loops). Custom pets without bundled Ocean assets continue using Standard artwork even when the App theme is Ocean.

The bundled KayKit roster uses walking WebP animations. All ten bundled KayKit pets have `blocked.webp` (thought bubble to exclamation) and `sleep.webp` (growing Zs) for Blocked and Completed. Their walking APNG remains the Running animation. Each also has `listen.webp`, a stationary listening animation with a pulsing horizontal audio waveform above its head, and `speak.webp`, a stationary speaking animation with an animated chat bubble, for the Mayor's voice states. The generated source sheets and review copies are stored under `~/Desktop/pet-town-sprites/`; the copies in these folders are the runtime assets. To add artwork, add the file to the pet folder, add a named entry under `clips`, and point the desired state at that animation. Right-click animation actions are retired; **Preferences…** remains available.

After adding 512×512 Ocean artwork, run `python3 scripts/resize-ocean-assets.py`
from the repository root using Python with Pillow installed. It stages and validates
the complete conversion before replacing files, keeps exact original working-tree
backups under `var/download-size/ocean-384-assets/`, and leaves Standard artwork
untouched. Existing 384×384 files are not resized again.

Run `pnpm run check:flow` from the repository root after changing a pack.
