# Native flying wildlife

The ambient wildlife belongs to `apps/pet-town-3d/src/creatures`. It is separate from agent companions in the Pet Town extension. Nimbaa, Fiddlekit, Pondle, Lumble, Pebbug, Jellop and Tuftlet retain their catalog entries and existing movement paths.

The new trio follows the selected B2-C soft-feather appearance in `var/flying-wildlife/ui-ux-grill-me/bird-cast-2026-10-02/visual-contract.md`: rounded bodies, layered feather fans, small beaks, tucked feet, warm eyes and blush. These are real articulated 3D rigs using the existing shared materials, prefab baking, eye expressions and creature interaction pipeline.

| Wildlife | Default population | Activity and movement                                        |
| -------- | ------------------ | ------------------------------------------------------------ |
| Skim     | 3                  | Blue/peach swallow; daytime darting and quicker wingbeats    |
| Drift    | 3                  | Ivory gull; daytime broad coastal circuits and longer glides |
| Hush     | 2                  | Lilac/oat owl; evening/night flight with softer wingbeats    |

Counts and flight rhythms were implementation defaults after the user requested implementation; the interview approved appearance only. New games or newly initialized creature populations include the trio. Existing running populations need a reload.

## Owning files

- `species/catalog/prepare.js` adds the three species after the existing seven; factories delegate to `species/birds` for palette and rig construction.
- `spawning/spawn-bird-population.js` runs after the existing population so its random choices cannot change existing wildlife placement. It prefers shore for gulls and nearby woodland for owls. Habitat preference relaxes if necessary; dry ground and full-wing clearance do not. Unsuitable worlds may produce fewer birds.
- `flight/update-bird-intent.js` owns activity, rest intervals and route transitions. Activity uses night-factor hysteresis to avoid repeated sleep/wake changes around twilight. Petting preserves the existing happy response before flight resumes. Valid landing progress continues beyond a normal route timer; stalled goals replan. If no dry rest is available, fallback flight remains active.
- `flight/pick-bird-goal.js` samples route heights; `sample-bird-clearance.js` scans every native terrain column under the wing footprint and includes water, rotated prop boxes, fences, tree trunks, skirts and canopies in conservative vertical envelopes. Flight climbs before crossing an obstruction. Terrain/scenery edits invalidate resting sites and trigger takeoff.
- `flight/move-bird-actor.js` moves birds inside world bounds and updates flight height and shadows. Ground rest requires dry, nearly level support without scenery overhead. Tree-top perching is deferred.
- `flight/animate-bird-wing.js` uses each species' flap/glide profile, folds wings at rest and retains existing body banking, breathing and expression animation. New birds are excluded from the legacy moth play-partner selection because their dedicated flight controller does not implement that social state.

## User-owned live acceptance

Implementation verification includes static art inspection, formatting, lint, builds and source constraints. It does not establish gameplay behavior or final visual acceptance.

1. Reload the native town and inspect the new birds in daylight. Confirm Skim darts, Drift glides near shore, and original wildlife/companions still behave as before. Watch through a full flight/rest cycle.
2. Advance the existing time controls into night. Confirm Hush becomes active while Skim/Drift find dry rest and sleep. Move back into day and confirm they resume.
3. Watch routes around trees, roofs and fences, including over water. Birds must climb before crossing, stay within the island bounds and descend only on clear dry ground. Place scenery near a resting site and verify takeoff/replanning.
4. Pet a resting and flying bird. Confirm the happy response, return to activity, and existing creature selection/camera behavior.
5. For close-up appearance, use the existing debug lineup: `?lineup=1&lineupOnly=skim,drift,hush&lineupState=rest`; repeat with `lineupState=idle` and `lineupState=sleep`. Add `lineupFocus=0`, `1` or `2` for individual close-ups. Compare faces, feather layering and colors to B2-C. This inspection mode is separate from normal routes and can clear small vegetation in its temporary lineup area.
6. On slower hardware, inspect frame rate while the birds fly. Clearance sampling scans current scenery and may require profiling on large custom worlds.
