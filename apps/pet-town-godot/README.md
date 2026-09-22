# Grand Moonhaven Pet Town

A large Godot 4 Pet Town built from PolyForge’s purchased **Cozy Low Poly Island** source. The original five-house Hearthshore proof has grown into an approximately 10.6× land-area town with five connected districts, a relocated working harbor, lighthouse overlook, forests, markets, and gardens.

## What it includes

- **Grand Moonhaven:** a single expanded island roughly 3.25× wider and deeper than Moonhaven, or about 10.6× its land area.
- Five neighborhoods: Moonhaven Central, Pinewatch Commons, Harborlight Ward, Artisan Heights, and Lantern Garden.
- 32 fixed houses, with overlapping prototype houses archived in Blender.
- A grand south harbor, north lighthouse overlook, market, windmill, campsite, gardens, boats, forest groves, and a connected terrain-fitting road network.
- Dusk lighting, warm neighborhood lights, emissive materials, and a freely orbitable camera sized for the expanded town.
- One dynamic KayKit companion for every live Pet Town broker agent, with deterministic reuse of ten 3D appearances.
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

`main.tscn` contains a fixed `GrandMoonhaven` instance of `scenes/warm_island.tscn`, which inherits the original `assets/cozy-island/grand-moonhaven.glb`. Houses, trees, terrain, and roads are authored geometry; the game does not generate or place them at runtime. The previous construction script and sample pet code have been removed from the active project and archived locally in `var/large-cozy-town/retired-procedural-code-20260921-145248.tar.gz`. The island stays static. Scripts now control the camera and the separate companion behavior layer; they do not generate or place island assets.

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
"$GODOT" --path apps/pet-town-godot
```

The portable runtime is local and ignored by Git. If it is not present, install Godot 4 and replace `GODOT` with the path to that executable. Start the Pet Town desktop app first so Godot can launch its privacy-safe `--town-bridge` helper. When launching Godot outside the desktop menu, set `PET_TOWN_BRIDGE_BIN` to the current Pet Town executable if it is not beside Godot or on `PATH`.

## Controls

- **Normal mouse or trackpad drag:** move across the town
- **Option-drag** (or right/middle drag): orbit and tilt the camera
- **Trackpad pinch or mouse wheel:** zoom across neighborhood and whole-town scales
- **Double-click a location:** focus it at neighborhood zoom
- **+ / −:** keyboard zoom fallback
- **A / D** or **Left / Right arrows:** rotate
- **W / S** or **Up / Down arrows:** tilt
- **Click a live agent:** select and follow its town pet
- **Right-click a live agent:** follow it and open the full-height details panel
- **Option+A:** follow the next live agent
- **Option+H:** open or close the controls board
- **Escape:** close help, then details, then release the follow camera
- **R:** reset to the whole-town overview
- **F:** toggle true fullscreen

## Current boundary

The island remains static. The Pet Town desktop broker is the only agent authority and sends Godot only each agent's opaque ID, normalized state, safe display label, and source. Godot dynamically creates one companion per live record, reuses the ten KayKit appearances deterministically, and maps working, blocked, idle, done, and unknown states to movement and animation. Private Herdr pane and session data never enter Godot; the details action sends the opaque ID back to Rust for current-route revalidation.

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


The island also has a static rendering-only batch in `scenes/island_render_sections.tscn`. It combines 7,703 original meshes into 1,427 material-and-area batches, preserving all 574,569 source triangles. Forty orchard apple meshes remain individually visible and interactive. Original Blender-authored nodes remain in the scene but are hidden for rendering; navigation and collision still use the originals. Batch resources stay in the ignored local `assets/cozy-island/render_sections/` folder. The per-object light limit returns to eight instead of evaluating 64 lights across the entire terrain.

After replacing the Blender GLB, rebuild the saved rendering batches:

```bash
"$GODOT" --headless --path apps/pet-town-godot --script res://tools/partition_render_sections.gd
```

Harvest markers reference the individually rendered apples under `IslandRenderSections/HarvestApples`.


## Reference garden scene — 22 September 2026

The current scene adds static Blender-authored cobblestones, cottage gardens, 225 woodland trees, fences, an entrance arch, four shoreline piers, a gazebo, market stalls, a fountain and a water garden. The editable source is `var/large-cozy-town/grand-moonhaven-reference-garden.blend`; its authoring collection is `REFERENCE - Gardens cobbles fences and village details`. A separate hidden `EXPORT - Optimized reference details` collection contains rendering batches.

Godot instances `scenes/reference_gardens.tscn` through `town_decorations.tscn`. This scene contains the exported GLB, saved collision shapes, warm-white lighting and a fading lighthouse beam. No island assets are placed during gameplay. The existing broker and companion behavior are preserved. The bench marker was moved clear of the new fountain.

The default desktop renderer is now Forward+ with Metal on macOS, 2x MSAA, ambient occlusion and restrained glow. Compatibility remains the mobile override. The final overview measured about 48 FPS at 3024x1898 on this machine; this is a single-view measurement, not a guaranteed frame rate.

The updated navigation bake passed all 132 directed routes among the 12 activity markers. Run `tests/reference_routes.gd` headlessly to repeat the connectivity check. `tools/reference_scene_review.gd` captures an isolated static visual review with the broker polling loop disabled only in that review tool. Normal gameplay still runs the full controller.

Actual Godot comparison image: `generated/reference-town-godot-review.png`. The image is a visual target; the recreated geometry is not a pixel-identical reconstruction of every detail in the reference.
