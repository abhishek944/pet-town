# Pet Town — native Godot town

The desktop's **Open Pet Town** launches this native Godot reconstruction of the complete original Three.js world. To explore it without a desktop connection, run from the repository root:

```sh
sh apps/pet-town-godot-sample/tools/run.sh
```

Requires Godot 4.7 with Forward+; the development runtime is Godot 4.7.2, Metal on macOS. Jolt handles native 3D physics. The standalone launcher uses `GODOT_BIN`, `godot` on PATH, or the repository's local runtime. Live companions, usage, terminals and Mayor require launching through Pet Town desktop. The Three.js app remains the source reference and public browser game.

## Complete source world

`assets/region-manifest.json` records exported source placements and buffers. The world spans X/Z **−208 through 208**, covering **100% of the original dry land: 27,037 cells**. It includes **783 terrain/lip chunks, 301 placed props, 432 trees and 83,623 vegetation instances** before source density filtering. The entire source grid includes its connected ocean mask, preserving land, water and saved block coordinates.

Original Pip geometry and idle/walk/run/jump/swim/leaf-glide animations run in Godot. Exported character assets also include **all eight source pets and crowned Mayor**, with source portraits and animation clips. The native HUD ports the original fonts, SVGs, block icons, welcome sign, twelve-material hotbar, pointer/ghost feedback and panel structure. The asset library has **26 original designs**; Journal has **15 land destinations and six ocean places**, garden, fishing, wish lanterns, shells, ocean discoveries and Harbor launch controls. Source ocean scenery, dolphin/turtle/fish models and boat/dock assets accompany the native water rendering.

Desktop connects over authenticated loopback TCP. Rust owns public agent snapshots, validated focus routes, usage collection, Herdr terminal sessions, updates and Mayor voice. The native scene reconciles the full live roster, local follow/control/camera actions, source pet choices, selected and aggregate token usage, helper/profile dock, terminal observe/interact and Mayor controls. An unavailable connection shows unavailable data rather than inventing agents or totals.

## Controls

| Action                             | Control                                |
| ---------------------------------- | -------------------------------------- |
| Move / run                         | WASD / Shift                           |
| Jump / glide                       | Space / hold Space in the air          |
| Swim up / dive                     | Space / Ctrl                           |
| Orbit                              | Mouse drag; Q/E                        |
| Zoom                               | Mouse wheel                            |
| First person / capture mouse       | V / L                                  |
| Place / break terrain              | Right click / left click               |
| Copy block / cycle material        | Middle click / Shift + wheel           |
| Choose material                    | 1–0, minus, equals, or hotbar          |
| Undo / redo                        | Ctrl Z / Ctrl Shift Z                  |
| Pet nearby wildlife                | F or click the creature                |
| Journal / asset library            | J / K                                  |
| Follow / control / leave companion | Click companion or roster / C / Escape |
| Cycle companions / call Mayor      | Option + A / Option + M                |
| Return to start                    | R                                      |
| Help / settings                    | H; Escape closes                       |
| Photo / sound / volume             | P / M / brackets                       |

Dragging the camera does not edit terrain. Blocks cannot intersect the explorer or solid scenery; undo checks restored occupancy. Respawn searches for free capsule space. Original terrain can be excavated above the protected bottom layer. Native mesh collisions support tables, benches, roofs, slopes and edited blocks. Terrain geometry builds on a worker; validated changes publish visuals and collision together. Rapid undo/redo requests queue separately, and failed saves keep the previous world intact.

## Persistence and isolation

Edits, placed assets, journal/ocean discoveries, boat state, companion pet choices, sound preferences, photos and native mesh caches live in Godot's separate `Pet Town Godot Sample` user directory. Native gameplay never overwrites the browser town's saved edits. Voxel saves include a source-buffer fingerprint. Earlier native preview saves migrate at their original coordinates only when their immutable source cells match; the original save is backed up before the widened save is written. Browser persistence remains separate.

## Source export and art

`tools/region-contract.md` documents original terrain/vegetation buffer attributes, source coordinates and material fields. Supplemental manifests contain wildlife, prop material maps, rotor details and source vegetation ranks. Export helpers are build-time tools; the running game requires no browser, Node, Three.js or asset receiver.

To refresh, run `node apps/pet-town-godot-sample/tools/receive-assets.mjs` and the source-reference Vite helper `node apps/pet-town-godot-sample/tools/start-reference.mjs`. Open the sample's `tools/parity-export.html` through the local source server on port 1422 and choose **Export complete original Godot world**; retain the supplemental original wildlife/source-data exports. Stop the receiver after export. It accepts only local source-town origins and constrained asset filenames.

`scripts/prepare-godot-runtime.sh` validates the complete export, imports resources, exports `PetTown.pck` using `export_presets.cfg`, and stages the official universal engine app for the desktop bundle. `scripts/build.sh` calls this step. `GODOT_APP` chooses the source engine app; installed users use the bundled runtime. Maintained source files have a **199-line maximum**, enforced by `pnpm run check:lines`; scene serialization, styles, markup, documentation and lockfiles retain the repository's exemptions.

`THIRD_PARTY_NOTICES.md` retains original notices; `scripts/post/THREE-LICENSE.txt` covers adapted Three shader routines. Dynamic source shaders are ported to Godot rather than embedded in GLBs.

## Validation and current limits

Current full-world implementation and verification evidence are under `var/godot-full-sync/implement-details/summary.md`. The final export resolves all 1,500 dependencies and measures all 27,037 source dry cells. Import/export, desktop builds, packaged startup, independent review and the maintained-source gate pass.

Edited terrain regenerates the original rounded faces, path transitions, grass lips and nearby ambient occlusion. Source quality settings govern foliage density and native post effects; the HUD remains sharp at the display scale. Computer checks observed the full native world, Journal travel, the three garden stages, saved photos, real companions and live aggregate/selected usage. Native runtime probes cover placement, save preservation, terminal cells, companion picking and separation, camera framing, boat travel and diving. Metal GPU captures cover Harbor launch, coral, kelp and nighttime plankton.

Direct one-click reopening and the final Settings/Journal/Library transition await user observation: Computer automation can read controls but coordinate actions fail and some screenshots remain stale. Real microphone conversations in Standard/Live mode, physical touch/controller input and a live Herdr terminal session have not been observed in the final full-world build. Those limits prevent claiming complete end-to-end synchronization from diagnostic success alone.

Native physics diagnostics have verified a ground jump onto the original bench, stable ground and bakery-roof landings, walking out of the source pond bank, one-block and half-block stepping, two-block wall and low-ceiling rejection, digging/restoring original terrain, edited-block landings and preserving pond water beneath an overhead bridge. Terrain buffer checks match original face attributes and grass-lip geometry to Float32 precision. These diagnostics complement the interactive acceptance pass; they do not replace it.

An earlier limited-preview Computer pass covered startup, wildlife petting, movement, camera controls, gliding, pond swimming, settings, journal travel, placement/undo, photos and terrain edits. Its historical evidence is in `var/godot-world-parity/implement-details/summary.md`. Those observations do not verify the current full-world desktop migration, its voice flows or its performance.
