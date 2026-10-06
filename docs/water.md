# Water exploration

The Three.js town's water feature owns the ocean surface and exploration under `apps/pet-town-3d/src/water/`. Both the native desktop town and the public browser town include it. Live companions remain a desktop feature.

## Area and compatibility

`water/terrain/expand-ocean-terrain.js` wraps the land generator. Every existing block and terrain metadata field is copied into a larger grid at the same world coordinates. Land authoring stays in `world-expansion/`; the ocean wrapper adds its own seabed and an offshore island outside that grid.

`measure-ocean-area.js` counts wet columns connected to the map boundary, excluding enclosed lakes. The generated ocean is at least three times the pre-ocean connected area; the grid grows in whole 16-cell chunks. With the current stage-three land, the baseline is 38,770 columns and the expanded sea is 145,678 (3.76 times), in a 416-cell grid. These are base-terrain figures; player edits can change them. `context.terrain.ocean` exposes the measured baseline, actual area, ratio and target.

World edits from the original 128-cell town and the 256-cell land expansion remain compatible when height, water level and spawn match. Save coordinates do not shift. Existing storage namespaces stay unchanged. Browser and native saves remain separate; the public build also retains its separate namespace.

## Swimming and diving

Use WASD or arrows to swim, and Shift to swim faster. Hold **Control** to descend and **Space** to rise. Release both to stay at depth. Returning to the surface restores ordinary floating and water jumps. There is no oxygen timer. Existing terrain collision sweeps remain responsible for seabed, block and ceiling collisions; stepping over an underwater block keeps the avatar swimming.

Gamepad **X** descends and **A** rises. Touch devices show a hold-to-Dive button while swimming; the existing jump arrow rises. Control+Option voice recording does not trigger diving. The explorer and manually controlled companions share the physics. Releasing a companion clears its vertical input; opening the journal, switching away or hiding the document clears held controls.

The following camera can submerge once its focus is underwater. Underwater rendering keeps nearby companion, fish, coral and seabed colors clear; a crystal-blue distance fade starts at 28 m and reaches its far tone at 85 m. Its overhead tone is a stronger blue, and distant colors dim with the existing night-lighting weights. Gentle static caustics add floor detail without screen wobble, red absorption or a near-field fog veil. Underwater grading and depth-of-field blur no longer wash out the scene. Local-water activation and the partial-lens waterline mask remain; bubbles follow the submerged avatar. Pets do not cast a shadow above themselves on the water while diving.

The surface keeps the earlier palette, reflection selection and mesh detail footprint. Expanding the playable seabed preserves the original open-water treatment; only the new exploration destinations reveal their local seabed.

## Ocean destinations

Press **J**, or click **Journal**. **Experiences** contains illustrated land and ocean adventures with location hints, discovery requirements and swimming controls. **Places** lists destinations and distances; choose **Head this way** for an ocean destination to close the journal and set the compass. The compass appears only after an explicit choice, with cardinal direction and distance. **Collection** holds ocean and land stamps alongside fish, shells, flowers and wishes. See [the unified journal](journal.md).

**J/Escape** closes the journal; **H/P** hands off to settings/photo mode. The journal captures movement, building, scrolling and material shortcuts while open, and shows save failures. There is no separate Ocean Guide or O shortcut. Ocean headings guide the swim; land **Visit** controls retain safe travel with the original explorer.

Use **J → Places → Driftwood Camp** as a starting point with the original explorer. Walk west to the water. Controlled companions can walk and swim the route directly.

| Destination      | Position  | Experience                                                                                  | Discovery requirement       |
| ---------------- | --------- | ------------------------------------------------------------------------------------------- | --------------------------- |
| Dolphin Lagoon   | -94, 66   | Three dolphins roam, sometimes breach, approach a swimming avatar and guide toward the reef | Swim within the lagoon      |
| Coral Garden     | -112, 84  | Colourful coral, anemones and two fish schools                                              | Explore underwater          |
| Swaying Kelp     | -129, 108 | Kelp, a fish school and two sea turtles                                                     | Explore underwater          |
| Sunken Sailboat  | -140, 42  | An open broken boat and nearby coral on the seabed                                          | Explore underwater          |
| Pearlrest Island | -168, 80  | Stepped eastern landing, palms, picnic and beach shells                                     | Step onto dry island ground |

Discoveries save before showing their stamp. An unreadable record is preserved instead of overwritten. Ocean discovery storage is separate from land activities and block edits. Marine models hide or reseat when edited terrain no longer supports their habitat.

## Harbor launch

The Harbor launch replaces the decorative passing ships. A wooden dock and sloping gangway stand west of Driftwood Camp, near (-82, 73); the initial boat mooring is (-85.7, 73). **J → Experiences → Take the harbor launch** and **J → Places → Harbor launch → Head this way** find its current position, including after a saved voyage.

Walk down the gangway and use **F / Board boat**, or swim to the side ladder and use **F / Climb aboard**. On deck, walk near the wheel and use **F / Take helm**. **W/S** moves forward/reverse and **A/D** steers; **F / Leave helm** stops the boat and returns to walking. Away from the helm, **F / Step ashore** chooses a clear supported landing; **Swim off** appears when only clear water is available. A visible button offers the same contextual action. Gamepad Y interacts and the left stick steers; touch steering buttons appear at the helm.

The hull, cabin, benches and rails own collision shapes. Yaw-oriented solid boxes preserve the narrow deck passage while the boat turns. A pre-player extension phase moves the boat before explorer and companion physics; fixed-step body hooks carry grounded passengers using their local deck coordinates. Deck support and solid shapes follow the same vertical water sample. Shore, edited blocks and scenery are checked across the inflated hull before translation or rotation. Camera queries use the rendered boat and dock meshes. Building is blocked aboard, and the boat action takes priority over the creature-petting F prompt.

The boat position saves separately under the existing native/public storage prefix; corrupt records are preserved. If a saved mooring is obstructed, the boat returns to its original harbor when that water remains clear. Original world blocks are not changed. The dock approach clears only nearby generated foliage. Blur, hidden documents, modals and selection changes release held helm inputs; gamepad input must return to neutral before resuming.

The three fish schools retain 54 individually posed fish, now with distinct handcrafted silhouettes and markings: orange-and-cream Clementine clownfish, tall blue-and-cream Sailfin moonfish, and slender mint reef darts. Browser instances and native GLBs share the same procedural models. To regenerate only the native fish after model changes, run `node apps/pet-town-godot-sample/tools/export-ocean-fish.mjs`, import Godot resources, then reopen the native town. Native fish keep a mesh named `Tail` for hinge animation and carry painted vertex colors into their instance batches.

At night, glowing plankton still follows the swimming avatar. Marine wildlife and the sunken wreck remain decoration without collision bodies.

## User-owned live review

1. Open the town, finish the welcome screen, and press **J → Places** to visit **Driftwood Camp**. Walk west, reopen **J**, choose Dolphin Lagoon's heading, and follow the compass. No compass should appear before choosing a heading.
2. Swim with the explorer. Hold Control, release to hover, rise with Space, then climb back onto land. Repeat around seabed steps and under player-built blocks. Check the camera transitions and bubbles.
3. Select a real companion, enable control, and repeat diving in third person and first person. Hold Control+Option for Mayor recording while swimming; confirm it does not descend.
4. Watch dolphins and fish, dive into the reef/kelp/wreck, then swim to Pearlrest's eastern beach. Inspect scenery, step ashore and check discovery stamps.
5. Board the Harbor launch from both dock and water. Take the helm, steer/reverse toward shore and saved block obstacles, leave the helm, walk/jump around the deck and get off safely. Repeat with a controlled companion, both camera modes, gamepad and touch. Check held input across blur/journal/settings and boat save/reload. Return after dusk for plankton. Review smoothness on the native WebView and public browser build.
6. Hold movement/dive, open the journal, close it, switch windows, and repeat with a gamepad or touch device. Controls should release cleanly. Try H/P and switching journal pages; hidden pages should not receive keyboard focus.
7. Edit seabed or island support; scenery and wildlife should hide in invalid areas. Reopen the town and inspect old/new saved blocks and discoveries. Check journal layout in a small window or beside an open terminal dock.

Build/lint/data audits do not establish these live interactions or visual acceptance.
