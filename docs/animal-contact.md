# Native animal contact

Godot Pet Town uses its built-in Jolt engine for gentle contact between the
explorer, companions, Mayor, ambient wildlife, fish, dolphins and turtles.
Each animal has an upright `RigidBody3D`, a collision shape and an explicit
mass. Animated tails, fins and held objects remain part of the visual model;
the solid body follows its core silhouette. The browser reference retains its
existing movement implementation.

## Owning boundaries

- `apps/pet-town-godot-sample/scripts/physics/profiles.gd` defines body sizes
  and masses. Pet and wildlife bodies use capsules; marine bodies use convex
  ellipsoids, with fish sizes and wildlife masses scaled by individual size.
- `physics/body.gd` owns collision masks, finite force requests, jump impulses,
  checked relocation consumers, upright orientation and physical support.
- `physics/support.gd` recognizes scenery and moving decks, and retains
  support across small downhill gaps. Relocation invalidates old contacts
  until the solver refreshes them. Animals never act as floor support.
- `physics/neighbors.gd` takes one spatial snapshot per physics tick. Local
  steering anticipates relative motion and gives lighter animals more reason
  to yield. Collision response itself remains in Jolt.
- `actor_motion.gd`, `desktop/companion.gd` and `wildlife/creature.gd` request
  motion through the shared body. Controllers sample actual velocity each
  tick, preserving momentum from contact instead of overwriting it.
- `water/marine_body.gd` follows marine route intent through bounded forces.
  Fish keep individual bodies and batched rendering from interpolated physical
  poses. Invalid habitats disable both the model and collider; reactivation
  checks the actual body volume before restoring it.
- `water/boat.gd` moves an `AnimatableBody3D` during physics ticks. Contact
  supplies deck velocity. Helm control gently recenters a supported pilot;
  physical displacement off the deck releases the helm.

Scenery uses layer 1, the explorer layer 2, and other living bodies layer 4.
Every active living body has mask 7, so all living-body pairs collide in both
directions and still collide with scenery. Static support and step probes
exclude animals; step destinations, spawning and explicit travel check animal
occupancy. Normal locomotion never corrects animal overlap by teleporting.

Walking assists shallow steps up to 0.30 world units. Full vertical blocks
require a jump; pushing into their faces or corners does not lift the pet.
The existing floor-angle limit is unchanged. Ground motors follow the actual
support surface with gentle adhesion, so airborne gravity cannot pin a walking
pet against slopes or small terrain edges. Nearby support retained across a
gap is distinguished from actual contact; jumps and unsupported bodies keep
their airborne forces.

## User-owned live review

Reopen Pet Town through the desktop app to load the updated scripts and live
companions. Source checks and headless physics probes establish physical
integration; they do not establish visual naturalness or input acceptance.

1. Walk and run into idle companions and nearby wildlife. Watch smaller
   animals yield, larger animals resist, and both recover without bouncing,
   spinning or shaking. Cross paths with roaming animals and watch passing.
2. Control two different pet models in turn. Check steps, downhill paths,
   furniture, jumps, low roofs and gliding. Change a pet model and verify its
   appearance, movement state and contact footprint.
3. Swim west from Driftwood Camp toward Dolphin Lagoon, Coral Garden and
   Swaying Kelp. Dive through fish schools and near dolphins/turtles. Check
   gentle contact, schooling, hovering, ascent and the camera waterline.
4. Board the Harbor launch with the explorer and a controlled companion.
   Steer, walk and jump on deck, bump another passenger, leave the helm and
   swim off. A pilot pushed overboard should stop controlling the boat.
5. Check a busy group near walls or a narrow passage for crowd jitter and
   frame drops. Edit marine habitat, then restore it; hidden animals should
   have no invisible collider, and returning animals should occupy clear water.

Masses and motor strength are authored tuning values, not measured biological
weights. Tune the profiles and finite motor limits after visual review rather
than adding scripted positional separation.
