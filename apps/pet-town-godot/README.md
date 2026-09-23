# Grand Moonhaven Pet Town

A large Godot 4 Pet Town built from PolyForge’s purchased **Cozy Low Poly Island** source. The original five-house Hearthshore proof has grown into an approximately 10.6× land-area town with five connected districts, a relocated working harbor, lighthouse overlook, forests, markets, and gardens.

## What it includes

- **Grand Moonhaven:** a single expanded island roughly 3.25× wider and deeper than Moonhaven, or about 10.6× its land area.
- Five neighborhoods: Moonhaven Central, Pinewatch Commons, Harborlight Ward, Artisan Heights, and Lantern Garden.
- 32 fixed houses, with overlapping prototype houses archived in Blender.
- A grand south harbor, north lighthouse overlook, market, windmill, campsite, gardens, boats, forest groves, and a connected terrain-fitting road network.
- Dusk lighting, warm neighborhood lights, emissive materials, and a freely orbitable camera sized for the expanded town.
- One dynamic KayKit companion for every live Pet Town broker agent, with deterministic reuse of ten 3D appearances.
- Local town customization: users can add trees and edit saved trees, flower patches, houses, benches, lanterns, and other authored objects in the game. Changes persist across restarts.
- **Chill** opens the complete authored island with live pets and all current agent controls. **Build** opens the same authored terrain without town objects or visible pets. The mode buttons and object catalog are at the top right; each mode keeps its own saved layout.
- A Knight mayor called by “Hey Mayor” or “Hey” plus the mayor’s chosen name. The wake phrase creates the mayor if needed and moves the camera to them; ordinary conversation leaves the camera alone. A speaking wave appears at the bottom while the user talks.
- Baked navigation and collision, neighbor avoidance, and status-driven movement among the authored town activity markers.
- True fullscreen startup with **F** available to toggle back to a maximized window.

## Local paid-asset setup

The purchased source and generated town are intentionally ignored by Git. Do not commit or redistribute them.

Place the downloaded ZIP at `~/Downloads/Cozy Low Poly Island .zip`, then extract both source files locally:

```bash
mkdir -p apps/pet-town-godot/assets/cozy-island var/large-cozy-town/source
unzip -p "$HOME/Downloads/Cozy Low Poly Island .zip" \
  "Cozy Low Poly Island .glb" \
  > apps/pet-town-godot/assets/cozy-island/cozy-island.glb
unzip -p "$HOME/Downloads/Cozy Low Poly Island .zip" \
  "Cozy Low Poly Island .blend" \
  > var/large-cozy-town/source/cozy-island.blend
```

`main.tscn` contains a fixed `GrandMoonhaven` instance of `scenes/warm_island.tscn`, which inherits the original `assets/cozy-island/grand-moonhaven.glb`. Houses, terrain, and roads remain authored geometry. The 328 island trees are saved in four equal groups of 82 round, pine, fir, and orchard trees. Island props, reference garden trees and flower patches, and Godot decorations remain individually selectable or grouped by flower patch. In-game edits are local layout overrides and do not modify the Blender source assets. The previous construction script and sample pet code have been removed from the active project and archived locally in `var/large-cozy-town/retired-procedural-code-20260921-145248.tar.gz`.

## Static island authoring

- Editable terrain and layout: `var/large-cozy-town/grand-moonhaven-landscaped.blend`.
- Baked export copy: `var/large-cozy-town/grand-moonhaven-game-ready.blend`.
- Current GLB: `var/large-cozy-town/grand-moonhaven-game-ready.glb`, copied into the Godot asset path above.
- Godot lighting: `WoodlandEvening` and `EveningSun` in `main.tscn`, plus saved lights in `scenes/town_decorations.tscn`; the Environment resource is `assets/cozy-island/woodland-evening.tres`.

Edit placement in the authored Blender file. To export a revised copy in Blender 5.2:

1. Save a separate export copy, preserving the authored file.
2. Select visible meshes, then **Make Single User > Object & Data**. Linked copies must have independent mesh data before baking their different terrain deformations.
3. **Convert > Mesh** to bake the deformations.
4. Export GLB with **Visible Objects** and **Active Scene** enabled. Disable **Animation**, **Cameras**, **Punctual Lights**, and **Apply Modifiers**.
5. Replace the Godot GLB and reimport it.

The separate bake is necessary: this Blender exporter can use underlying mesh materials instead of object material overrides when Apply Modifiers is enabled. That produced brass-colored tree canopies and incorrect house materials. The corrected export preserves the source object's visible materials.

Verification of the current copy: 32 house bounds with no mutual overlap; no flagged foundation-ground gaps; no tree-root centers inside road meshes. These geometry checks do not replace agent navigation or collision testing.

## Run

The current saved scene was verified with Godot 4.7.2. From the repository root, perform the first import before launching:

```bash
GODOT="var/godot-runtime/Godot.app/Contents/MacOS/Godot"
"$GODOT" --headless --editor --path apps/pet-town-godot --quit
sh scripts/prepare-pet-town-godot-app.sh
"var/godot-runtime/Pet Town 3D.app/Contents/MacOS/Godot" --path apps/pet-town-godot
```

The portable runtime and branded macOS app are local and ignored by Git. The desktop launcher prepares the branded app automatically. If the portable runtime is not present, install Godot 4 and replace `GODOT` with the path to that executable. Start the Pet Town desktop app first so Godot can launch its privacy-safe `--town-bridge` helper. When launching Godot outside the desktop menu, set `PET_TOWN_BRIDGE_BIN` to the current Pet Town executable if it is not beside Godot or on `PATH`.

## Controls

### Island modes and object catalog

Choose **Chill** to keep the complete town and place any catalog object for free. Choose **Build** to start with empty land. The catalog currently offers 27 complete styles across trees, gardens, furniture, lights, homes, shops, waterfront objects, and landmarks. Buildings and garden objects place on land; boats place on the water. Build shows a price beside each object and charges only when placement is confirmed. Canceling placement costs nothing. Purchased objects can be moved, turned, resized, and removed; removing one does not refund its price.

For this first version, the Build wallet is a local editable file at `~/.pet-town/build-wallet.json`. The game creates it with zero usage totals. Edit its `usage` fields to enter accumulated `input_tokens`, `output_tokens`, `cache_hit_tokens`, and `estimated_cost_usd`; this version does not automatically import live Pi usage. Credits earned are `input_tokens + 2 × output_tokens + floor(cache_hit_tokens ÷ 4) + floor(estimated_cost_usd × 1000)`. Purchases increase `spent` while the original usage totals remain visible. The cost value is an estimate, not an API invoice. Build placement saves separately to `user://build_layout.json`; Chill keeps its existing `user://town_layout.json`.

Build mode hides the live agent controls and the existing roads, gardens, buildings, and decorations. The terrain is the original authored Blender landform. Moving large purchased objects currently changes their visual layout; pet collision and navigation still use the authored Chill layout when that mode is active.

- **Normal mouse or trackpad drag:** move across the town
- **Option-drag** (or right/middle drag): orbit and tilt the camera
- **Trackpad pinch or mouse wheel:** zoom across neighborhood and whole-town scales
- **Double-click a location:** focus it at neighborhood zoom
- **+ / −:** keyboard zoom fallback
- **A / D** or **Left / Right arrows:** rotate
- **W / S** or **Up / Down arrows:** tilt (when not driving an agent)
- **Click a live agent:** select and follow its town pet
- **C while following:** take or release control of that pet; **WASD / arrows** walk relative to the camera instead of rotating/tilting it. Walking stays on the baked paths. This does not control the underlying coding agent.
- **Right-click a live agent:** follow it and open the full-height details panel
- **T:** start placing a custom tree without opening the editing panel; click a town surface to place it
- **Double-click an object:** open its editing panel for move, rotation, size, or deletion. Trees show a gold canopy ring when selected.
- **Move:** click Move, point at a town surface, and click to place. **Right-click** or **Escape** cancels placement; **Close** or **Escape** closes editing.
- **Option+A:** follow the next live agent
- **Option+H:** open or close the controls board
- **Option+S:** open or close in-town 3D settings. The centered settings window has separate entries for each 3D pet; the pictured lighting, sounds, movement, and camera controls are deferred. Apply is disabled until there are editable settings. Tree editing stays in the main game and continues to save automatically.
- **Escape:** close settings if open, then help, then details, then release walking control, then release the follow camera
- **R:** reset to the whole-town overview
- **F:** toggle true fullscreen

## Current boundary

Authored trees and props are rendered as separate objects, and added trees live under `UserTrees`. Double-click a visible object to edit it. Positions, rotation, scale, and deletions are saved locally in `user://town_layout.json` and restored at startup. Overlap is intentionally allowed. Terrain and paths remain fixed. The baked collision/navigation resources reflect the original authored layout, so move large buildings and path obstacles in Blender/Godot and rebake navigation before relying on pet routing around their new positions.

The Pet Town desktop broker is the only agent authority and sends Godot only each agent's opaque ID, normalized state, safe display label, and source. A separate local mayor state supplies the chosen mayor name, speaking state, and wake focus event. Godot dynamically creates one companion per visible live record (idle and unknown stay hidden, matching the 2D town), reuses the ten KayKit appearances deterministically, and maps working, blocked, and done states to movement and animation. Private Herdr pane and session data never enter Godot; the details action sends the opaque ID back to Rust for current-route revalidation.

The desktop menu's **Open 3D Town** action launches the local project. While Godot is active, the desktop app suppresses the v1 bottom strip without changing the user's visibility preference. Switching away or closing Godot restores the strip when that preference is enabled.

## Companion authoring

- `scenes/town_life.tscn`: 12 saved interaction markers used as status-driven destinations. Move these in Godot when changing the layout. There are no hard-coded world destination lists in the runtime scripts.
- `scenes/companion.tscn`: reusable live-agent body, animation player, navigation agent, and safe display caption.
- `scripts/companion.gd`: normalized-status destination selection, navigation, animation, and retirement behavior.
- `scripts/main.gd`: broker bridge, roster reconciliation, camera interactions, full-height details with a rotatable 3D avatar, and the Option+H controls board.
- `scripts/interaction_spot.gd`: authored activity type and display metadata used for status-driven destinations.
- `navigation/town_walkable.res` and `town_collision.res`: saved navigation and collision derived from the static island. Runtime startup does not bake or rebuild the world.
- `assets/kaykit/License.txt`: original CC0 license from the KayKit Adventurers 2.0 FREE pack, covering the six Adventurer GLBs, textures, and shared animation GLBs.
- `assets/kaykit/skeletons/License.txt`: original CC0 license from the KayKit Skeletons 1.1 FREE pack, covering the four Skeleton GLBs and textures.

After editing the island mesh, regenerate navigation/collision and the shared animation library, then reposition affected markers in Godot:

```bash
"$GODOT" --headless --path apps/pet-town-godot --script res://tools/bake_town_navigation.gd
```

The offline bake reads the island and does not modify its meshes or placement. It includes terrain and gravel paths, with obstruction footprints for houses, trunks, rocks, and selected props. Characters follow the baked paths with collision capsules, gravity, and clearance-checked stepping over shallow gravel curbs. The harbor piers are not currently activity destinations; houses have no enterable interiors.

The retired autonomous-companion smoke script remains as historical navigation evidence, but it no longer represents the live broker-driven roster and is not part of the current verification flow. Verify live lifecycle and focus behavior with the desktop broker running.


## Town decoration and warm lighting

`scenes/town_decorations.tscn` contains 39 additional street lanterns, 16 benches, two additional campfire gathering areas, two festoon strings, and lights for the existing lanterns and cottage windows. These are static, editable Godot nodes, with no runtime placement code. The copied PolyForge meshes are stored locally under the ignored `assets/cozy-island/decor_meshes/` directory.

`scenes/warm_island.tscn` applies window and lamp materials without modifying the original GLB or Blender layout. It also aligns the campfire flames with the relocated woodland stone ring. The warm materials are in `materials/window_amber.tres` and `materials/lantern_amber.tres`: soft cream and pale gold with restrained brightness. Street and house light pools use warm white, avoiding the earlier saturated orange treatment.

Decoration colliders are marked with `navigation_obstacle` metadata and included in the offline navigation bake. The retired autonomous simulation previously completed a four-minute furnishing check with zero failed routes; treat that only as historical navigation evidence. After moving furnishings in Godot, run the navigation bake again. The lighting-only color correction does not change navigation.


## Smooth follow camera

Physics interpolation is enabled for the companions, including their animation updates. The static island and render-frame camera opt out. The camera samples the followed character's interpolated transform, with frame-rate-independent horizontal damping and slower height damping to soften small curb steps. Spawning resets interpolation history.

Regression check (run without `--fixed-fps`, since it needs render frames between physics ticks):

```bash
"$GODOT" --headless --path apps/pet-town-godot --script res://tests/camera_follow_smoke.gd
```

This deliberately uses 10 physics ticks per second and checks smooth constant-speed tracking, switching companions, resetting to the overview, and releasing follow by panning. It also reports the old raw-position approach for comparison.


The island also has a static rendering scene in `scenes/island_render_sections.tscn`. Terrain and road surfaces remain batched by material and area; all 328 island trees are saved under `IslandRenderSections/EditableTrees`, and 1,160 authored object roots under `IslandRenderSections/EditableObjects`. The five original orchard wrappers carry their harvest apples. The hidden source scene continues to supply navigation and collision. Batch resources stay in the ignored local `assets/cozy-island/render_sections/` folder.

After replacing the Blender GLB, rebuild the saved rendering batches:

```bash
"$GODOT" --headless --path apps/pet-town-godot --script res://tools/partition_render_sections.gd
```

The apple-gather markers reference fruit nodes carried by `IslandRenderSections/EditableTrees/OrchardTree_000` and `OrchardTree_001`.


## Reference garden scene — 22 September 2026

The scene adds static Blender-authored cobblestones, cottage gardens, 225 woodland trees, fences, an entrance arch, four shoreline piers, a gazebo, market stalls, a fountain and a water garden. The editable source is `var/large-cozy-town/grand-moonhaven-reference-garden.blend`; its authoring collection is `REFERENCE - Gardens cobbles fences and village details`. The export preserves the named garden detail meshes and separates the 225 tree roots. To rebuild the locally ignored runtime GLB, run from the repository root:

```bash
blender -b var/large-cozy-town/grand-moonhaven-reference-garden.blend \
  --python apps/pet-town-godot/tools/export_editable_reference_gardens.py -- \
  --output apps/pet-town-godot/assets/cozy-island/reference-gardens-editable.glb
```

The Blender tool checks the expected tree geometry and verifies every static source mesh appears in the GLB. It also adds `Calm open ocean`, a static 240×240 water plane stored outside the optimized export collection, so creating the export scene does not silently drop it. Godot instances `scenes/reference_gardens.tscn` through `town_decorations.tscn`; saved collision shapes, warm-white lighting, and a fading lighthouse beam are unchanged. The existing broker and companion behavior are preserved.

The default desktop renderer is now Forward+ with Metal on macOS, 2x MSAA, ambient occlusion and restrained glow. Compatibility remains the mobile override. The final overview measured about 48 FPS at 3024x1898 on this machine; this is a single-view measurement, not a guaranteed frame rate.

The updated navigation bake passed all 132 directed routes among the 12 activity markers. Run `tests/reference_routes.gd` headlessly to repeat the connectivity check. `tools/reference_scene_review.gd` captures an isolated static visual review with the broker polling loop disabled only in that review tool. Normal gameplay still runs the full controller.

Actual Godot comparison image: `generated/reference-town-godot-review.png`. The image is a visual target; the recreated geometry is not a pixel-identical reconstruction of every detail in the reference.
