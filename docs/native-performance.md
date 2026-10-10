# Native Godot performance contracts

These optimizations apply to the native Pet Town runtime in
`apps/pet-town-godot-sample`. The public browser game is separate. Authored
placements, geometry, materials, save coordinates and storage keys are preserved.

## Committed collision changes

`world.gd` owns `collision_revision`, `collision_changed` and
`terrain_changed(columns)`. Terrain transactions publish collision and update
column data before notifying consumers. Asset place/rebuild/reset/support changes
also advance collision revision. Feedback messages do not invalidate geometry.

Precipitation clears shelter columns, active landing records and visible pools on
collision changes. Asset support listens only to changed terrain columns, indexes
conservative rotated footprints, and validates affected assets within a short frame
budget. Untouched libraries do no support sampling. Restore/rebuild validates once;
collision layers change only when support changes.

Block placement and its final worker publication check include living-body layers.
Reset refuses to restore a solid through a living body. The topmost solid surface
remains `ground_at`; `submerged_floor_at` caches the highest solid below water for
marine habitat, vertical movement and wet scenery. Terrain edits update both.

## Immutable startup data

`region/native_cache.gd` uses source SHA-256 hashes, dependency hashes where needed,
and a format version. `scripts/prepare-godot-runtime.sh` runs
`tools/prepare-native.gd` before exporting the pack. Generated files live under
`assets/native-prepared/`, are ignored by Git, and are included in the game pack.
The bake validates required files and prunes stale generated artifacts. A current
full bake uses approximately 50 MiB of compressed file content before pack-level
deduplication (about 60 MiB allocated on the development filesystem).

Compressed native resources hold terrain/vegetation meshes, terrain/prop collision
and deterministic music PCM. Props still instantiate their original GLBs and apply
their existing materials and controllers. Collision caches store only local faces
with the original backface policy. A baked per-file index preserves prop content
keys because exports strip raw GLB sources. Missing index entries regenerate each
prop independently rather than sharing a key for absent source bytes.

Music hashes both the sequencer and synthesis source during development. Exported
scripts are bytecode, so the pack carries the build-time music key in a small index.
PCM bytes, loop boundaries, sound enable/volume and night fading remain unchanged.
Only deterministic music is cached; randomized ambience retains its existing path.

ZSTD data files hold vegetation buffers/anchors, terrain triangle ranges and source
mesh arrays, plus compact source-keyed terrain transforms. Terrain display no longer
parses each full geometry JSON merely to obtain its transform. Source arrays load
only for an edited chunk when a new filtered mesh
is needed. Startup avoids retrieving every chunk's arrays from the rendering server.
Development falls back to generating derived data in `user://native-prepared` and
can reuse the earlier immutable mesh cache. A cache miss never changes save data.

Changing source exports changes content keys. Bump the cache format version when
changing derivation rules without changing their source inputs. Keep the geometric
radius-3 edit halo and original face/winding/custom-attribute contracts together.
The voxel worker snapshots an edit index by chunk; only dirty chunks and neighboring
edit buckets contribute expanded influence. Save JSON remains compatible.

Vegetation transforms/custom data are uploaded in bulk. Each editable plant has one
anchor shared by all its LOD meshes. Explicit field groups include every grass,
tall-grass, flower, fern and clover variant; indexing does not depend on generated
node names. Node names also include the variant to avoid sibling-name collisions.

## Opening and hidden library work

The loading budget remains 8 ms. Hidden asset-library cards defer their 3D stages
and models until the library becomes visible. The selected preview is resolved on
open before placement becomes available. Thumbnails share a 4 ms start-work budget
per frame; one model can exceed that budget, after which other cards wait. Closing
pauses pending thumbnails, and reopening reuses completed stages. Wildlife portraits
retain their eager viewport setup, transparency and redraw behavior.

Catalog metadata, saved additions/replacements, their support validation and collision
are still restored before town readiness. Preview deferral does not defer saved world
state. Source and exported-pack checks cover empty/replaced catalogs and reopening.

The controlled warm native Metal opening comparison on the development M4 Max measured
18.05 seconds before and 14.84 seconds after these four changes, saving 3.21 seconds
(17.8%). Repeated runs are retained with the measurements. Both control copies contain
the same concurrent, unrelated build-pointer edit. Measurements begin before loading the real opening
scene and end at its handoff to the initialized town; earlier engine/Tauri startup
and authenticated desktop integration are excluded. These are a small controlled
sample, not a cold-machine or end-to-end launch guarantee. The separate activation
stall was investigated in the follow-up below.

Startup evidence and the implementation delta against the dirty starting snapshot
are retained under `var/godot-startup/implement-details/`.

## Static physics registration and prop loading

The town keeps gameplay callbacks disabled until construction and saved-state restore
finish. Godot's default `CollisionObject3D.DISABLE_MODE_REMOVE` also removes inherited
disabled bodies from physics. Previously, enabling the completed town registered all
static collision together, blocking the main thread for about 913 ms in the follow-up
trace (the earlier session observed about 1.35 seconds).

`startup/static_collision.gd` temporarily keeps only descendant static bodies active
in physics while construction runs across the existing loading slices. Gameplay
callbacks remain gated; dynamic bodies keep their existing modes. Enabling the town
then costs about 9 ms in the trace. Before readiness, the helper disconnects and
restores the original removal policy, preserving later battle/pause behavior. Early
exit restores the same policy and releases its hook. Saved assets validate against
the original static world during restore.

`region/scene_prefetch.gd` requests up to four original prop PackedScenes in the
background. It checks completion while yielding through the loading budget, then
instantiates, styles and adds collision on the main thread in the original order.
The synchronous path remains for callers without a loading budget. Shutdown drains
owned requests; this can briefly wait for up to four in-flight loads. No generated
replacement scenes or material conversion are involved.

See the [Godot collision disable-mode documentation](https://docs.godotengine.org/en/4.7/classes/class_collisionobject3d.html)
and [background loading documentation](https://docs.godotengine.org/en/4.7/tutorials/io/background_loading.html)
for the engine behavior used here.

Follow-up evidence, uninstrumented controls, geometry/material digests, lifecycle
checks and exported-pack checks are retained under `var/godot-startup-next/`.
Three controlled warm runs per variant measured median opening time of 12.20 seconds
before and 10.98 seconds after (about 10% faster). Ranges were 11.68–15.77 seconds
before and 10.15–11.22 seconds after; largest frame intervals were 905–948 ms before
and 282–401 ms after. The sample is small and baseline variability is material.
These measurements use the same native Metal opening and a 60 FPS cap in both
variants. Compare within this session; the earlier four-change timings used a
separate session and should not be combined into one speedup claim.

## Steady simulation and battle preparation

Marine activity follows player and camera positions, plus the occupied boat. Bodies
wake within 72 units and suspend beyond 88, with a school-radius margin for fish.
Suspended bodies freeze without collision; fish also stop per-frame posing. Wakeup
checks actual body-volume clearance. Nearby animals retain the existing Jolt motor,
steering, mass and contact behavior. Habitat-invalid bodies remain hidden until a
safe position becomes available.

Precipitation iterates its current particle budget and clears discarded slots when
quality shrinks. Existing cast and impact budgets remain bounded. Native comparison
found bulk GDScript weather uploads slower than instance setters, so weather keeps
its setters. Vegetation uses bulk buffers during initialization.

Battle preparation yields while building navigation and between cast members.
Its generation token cancels pending work on Return/Escape. Temporary bodies stay
frozen until countdown. Navigation reuse requires the same collision revision;
start/home positions are checked again before each match. Already queued terrain
changes must finish before entry. Maple is instantiated directly, avoiding the old
create-explorer/remove-explorer/create-Maple path. Frame yielding reduces blocking
work; it does not promise shorter total preparation wall time.

## Verification and live review

The implementation diagnostics and measured before/after results are under
`var/godot-audit/implement-details/`. They include script loading, isolated physics
and terrain transactions, geometry equivalence, support transitions, cancellation,
Metal callback measurements, and a fresh-user exported-pack check. No unit tests
were created or run. Function timings describe CPU work, not GPU time or guaranteed
FPS. The existing user game remained running during measurements.

Reopen the native desktop town to load the source changes. Check nearby animal
nudging, swimming under bridges, distant marine return, overhead rain/hail, supported
asset hide/restore, and battle entry/retry/cancellation. Review opening animation,
foliage hiding across variants/LODs and cold/warm startup. Existing shutdown Texture
RID warnings need a separate ownership investigation; they are not proof of a
steadily growing gameplay memory leak.
