# Grand Moonhaven Pet Town

A large Godot 4 Pet Town built from PolyForge’s purchased **Cozy Low Poly Island** source. The original five-house Hearthshore proof has grown into an approximately 10.6× land-area town with five connected districts, a relocated working harbor, lighthouse overlook, forests, markets, and gardens.

## What it includes

- **Grand Moonhaven:** a single expanded island roughly 3.25× wider and deeper than Moonhaven, or about 10.6× its land area.
- Five neighborhoods: Moonhaven Central, Pinewatch Commons, Harborlight Ward, Artisan Heights, and Lantern Garden.
- 32 fixed houses, with overlapping prototype houses archived in Blender.
- A grand south harbor, north lighthouse overlook, market, windmill, campsite, gardens, boats, forest groves, and a connected terrain-fitting road network.
- Dusk lighting, warm neighborhood lights, emissive materials, and a freely orbitable camera sized for the expanded town.
- Six animated KayKit companions: Rowan, Fern, Pip, Bramble, Mica, and Wren.
- Baked navigation and collision, neighbor avoidance, orchard gathering, market deliveries, snacks, rest stops, and neighborhood visits.
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

The portable runtime is local and ignored by Git. If it is not present, install Godot 4 and replace `GODOT` with the path to that executable.

## Controls

- **Normal mouse or trackpad drag:** move across the town
- **Option-drag** (or right/middle drag): orbit and tilt the camera
- **Trackpad pinch or mouse wheel:** zoom across neighborhood and whole-town scales
- **Double-click a location:** focus it at neighborhood zoom
- **+ / −:** keyboard zoom fallback
- **A / D** or **Left / Right arrows:** rotate
- **W / S** or **Up / Down arrows:** tilt
- **Click a companion** or **Tab:** follow/select a character; the panel shows activity, energy, apples, and deliveries
- **Escape:** release the follow camera
- **R:** reset to the whole-town overview
- **F:** toggle true fullscreen
- **H:** hide or show the help panel

## Current boundary

The island is static, with a separate autonomous companion simulation. Six characters use the supplied KayKit rigs and animations. They choose available activity markers, navigate around baked obstacles, avoid one another, and reserve each stop while using it. Gathering removes an apple from the orchard temporarily; the character carries an apple and delivers inventory to a market. Snacks and rest restore energy. These are local game behaviors, not connected to coding agents yet.

## Companion authoring

- `scenes/town_life.tscn`: saved character instances and 12 interaction markers. Move these in Godot when changing the layout. There are no hard-coded world destination lists in the runtime scripts.
- `scenes/companion.tscn`: reusable body, animation player, navigation agent, and carried apple.
- `scripts/companion.gd`: activity selection, inventory, energy, navigation, and animation.
- `scripts/interaction_spot.gd`: activity type, duration, reservation, cooldown, and optional harvest prop. Select a marker in Godot to edit these properties.
- `navigation/town_walkable.res` and `town_collision.res`: saved navigation and collision derived from the static island. Runtime startup does not bake or rebuild the world.
- `assets/kaykit/License.txt`: original CC0 license from the downloaded KayKit Adventurers 2.0 FREE pack, by Kay Lousberg. The six character GLBs, original textures, and two animation GLBs are copied from the downloaded ZIP.

After editing the island mesh, regenerate navigation/collision and the shared animation library, then reposition affected markers in Godot:

```bash
"$GODOT" --headless --path apps/pet-town-godot --script res://tools/bake_town_navigation.gd
```

The offline bake reads the island and does not modify its meshes or placement. It includes terrain and gravel paths, with obstruction footprints for houses, trunks, rocks, and selected props. Characters follow the baked paths with collision capsules, gravity, and clearance-checked stepping over shallow gravel curbs. The harbor piers are not currently activity destinations; houses have no enterable interiors.

Run the four-minute simulated integration check:

```bash
"$GODOT" --headless --fixed-fps 60 --path apps/pet-town-godot --script res://tests/town_life_smoke.gd
```

The check verifies all six characters move, animate, and finish activities, with apple deliveries, bounded route failures, and no persistent stalls. The latest four-minute run completed 47 activities and eight deliveries with zero failed routes. It does not prove every possible route through the island is clear.


## Town decoration and warm lighting

`scenes/town_decorations.tscn` contains 39 additional street lanterns, 16 benches, two additional campfire gathering areas, two festoon strings, and lights for the existing lanterns and cottage windows. These are static, editable Godot nodes, with no runtime placement code. The copied PolyForge meshes are stored locally under the ignored `assets/cozy-island/decor_meshes/` directory.

`scenes/warm_island.tscn` applies window and lamp materials without modifying the original GLB or Blender layout. It also aligns the campfire flames with the relocated woodland stone ring. The warm materials are in `materials/window_amber.tres` and `materials/lantern_amber.tres`: soft cream and pale gold with restrained brightness. Street and house light pools use warm white, avoiding the earlier saturated orange treatment.

Decoration colliders are marked with `navigation_obstacle` metadata and included in the offline navigation bake. The four-minute check after furnishing completed 45 activities and eight deliveries with zero failed routes. After moving furnishings in Godot, run the navigation bake again. The lighting-only color correction does not change navigation.


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
