# Natural animal contact in native Pet Town

Date: 2026-10-09
Status: Proposed design for user review; product implementation has not started.

## User intent and accepted direction

Every pet and every wildlife animal must have its own body, mass and mutual
collision detection, on land and in water. The user chose gentle nudging and
asked for contact to feel as natural and real as possible. Built-in Godot
capabilities or suitable libraries are allowed.

The intended experience is that animals notice one another, make room and
gently yield when they touch. A heavier animal resists displacement more than a
lighter one. Contact should not make animals feel like walls, cause repeated
bouncing, interrupt their identity or activity, or tip them over.

This is an architectural movement change. The proposal uses native Godot Jolt
physics, which the project already enables, with controlled rigid bodies for
all living actors. No additional physics dependency is proposed.

## Current evidence

- `scripts/actor.gd` uses `CharacterBody3D`, layer bit 2 and mask 1. The explorer
  ignores other living actors.
- `scripts/desktop/companion.gd` inherits the explorer body, changes its layer
  to bit 4 and mask to 5, and directly steers velocity. Companion-to-companion
  blocking already exists; mass-dependent pushing does not.
- `scripts/wildlife/creature.gd` uses layer bit 4 and mask 1. Wildlife movement
  ignores companions and other wildlife. Its capsule width is capped.
- An isolated Godot 4.7.2/Jolt audit using the actual actor classes confirmed
  these directional collision results. None of the classes exposes physical
  mass. This audit is separate from visual gameplay evidence.
- `scripts/water/fish_schools.gd` renders fish with MultiMesh instances and
  calculates their positions from time. Dolphins and sea turtles similarly
  write model positions directly. The loaded marine GLBs contain no physics
  bodies. `docs/water.md` explicitly describes marine wildlife as decoration
  without collision bodies.
- The current export contains 32 ambient wildlife actors, including birds,
  plus 54 ocean fish, three dolphins and two sea turtles. The companion count
  is supplied live by the desktop bridge and has no fixed cap.
- Boat passengers are carried and the pilot is positioned through direct
  transform writes in `scripts/water/boat_passengers.gd`.
- Native screen capture failed during investigation. Visible contact quality
  has not been independently assessed yet.

Paths in this document are relative to `apps/pet-town-godot-sample` unless
prefixed with `docs/`.

## Scope and compatibility

The native desktop town includes the explorer, all ordinary companions, Mayor,
all existing ground/swimming/flying wildlife, every individual ocean fish,
dolphins and sea turtles. Each physical contact pairing is supported when the
animals actually occupy the same three-dimensional space. Animals at different
depths or altitudes can pass above or below one another.

This proposal targets the running native Godot experience. The separate public
Three.js browser game needs its own future implementation; native physics must
not be presented as browser parity.

Preserve the authored world, actor counts, habitat choices, live companion
identity, pet selection, movement controls, follow/control behavior, camera
views, petting, sleep/wake, ocean activities and saved world coordinates.
Preserve existing storage keys and desktop IPC identifiers. Pet-to-agent focus
helpers and routes are outside the change.

Terrain and scenery remain fixed collision surfaces. The boat keeps its
existing navigation and hull-clearance rules; support-body integration changes
only as needed to give moving passengers correct contact and deck motion.

## Chosen architecture

### Shared physical actor contract

Use a shared `RigidBody3D` base for living actors. Provide explicit operations
for movement intent, grounded/support state, physical velocity, body profile,
sleep/activity state and checked relocation. Update callers to this contract
rather than pretending a rigid body is still a `CharacterBody3D`.

Retain the existing feet/root coordinate convention so terrain sampling,
animation, labels and camera targets do not silently shift. Collision shapes
may be offset from that root; their center of mass follows their physical
shape. Visual animation remains separate from the physics body.

Physics owns normal movement. AI and input request desired movement; they do
not set the body transform or erase physical velocity each render frame.
Use `_integrate_forces` and the native fixed timestep for the controller.
Godot handles contact resolution and mass-dependent response.

Keep the existing world, explorer and animal layer bits. Use named constants
and mutual masks so every living actor checks world and living-actor bodies.
Camera, support and scenery queries continue to target their intended layers;
an animal is not accidentally a terrain column or a camera obstruction.

### Body profiles and meaningful mass

Give every model/species an explicit profile containing shape dimensions and
offsets, mass, ground traction, medium damping, motor limits and clearance.
Use simple convex primitives or a small convex compound around the body core.
An elongated dolphin, a tall deer and a small fish need different profiles.
Exclude decorative tails, feathers and held objects from the main body shape
unless visual checks show that the omission breaks convincing contact.

Measure existing model dimensions before setting profiles. Use authored values
checked against visible models, not one inherited capsule or an arbitrary
radius cap. Size variants scale shape dimensions and mass by volume. Profiles
must update when a companion changes its pet, including Mayor.

Mass values are gameplay approximations for stylized animals, not measured
biological weights. Choose coherent relative weights, then tune against paired
contact: equal bodies yield comparably; lighter bodies move more; large animals
have noticeably more resistance. Do not compensate for a missing physical
response with a purely cosmetic displacement.

Keep ground bodies upright with rotational constraints. Flight banking, fish
tail motion and dolphin breach pitch can remain visual animation while the
physical body follows a stable, shape-appropriate heading. No ragdoll system
is introduced.

### Gentle motor and contact response

Use a bounded movement motor that approaches desired velocity through forces.
Its authority depends on movement mode and support. It must preserve external
contact momentum and allow displacement; an idle animal cannot continually
cancel a nudge to hold its exact previous location.

Use low-bounce materials, appropriate friction and damping. Ground traction
provides stability without locking bodies in place. Reduce the motor component
that presses into another animal, and steer tangentially or wait when there is
no safe space. Contact should dissipate energy smoothly rather than cause a
motor/solver tug-of-war.

For fast controlled approaches, use a short body sweep to soften movement into
nearby animals before impact. Retain firm collision and meaningful resistance:
the avatar cannot walk through animals or push a crowd indefinitely against a
wall. Small animals yield and turn away; neither a sprint nor a dense school
should launch bodies. Physical displacement is constrained by scenery, water
depth and support, rather than corrected with an unconditional position snap.

### Avoidance and activity

Use a shared spatial neighbor index for bounded, three-dimensional avoidance.
It is a steering aid; it never replaces physical contact or writes overlap
corrections directly to positions. Account for relative velocity, body size,
height/depth and preferred habitat. Use stable yielding choices to prevent
two animals repeatedly switching sides.

Preserve approach, greeting, play/chase, petting, grazing, rest and sleep.
Social goals stop at a body-aware distance. An animal can be physically nudged
while sleeping; game sleep is distinct from physics-engine sleep. Contact wakes
the physical body. Any visual reaction is modest and uses existing animation
capabilities, without requiring new animation assets.

Do not cull collision bodies because the camera turns away. Sleeping bodies
remain registered with the engine and can wake on contact. Do not introduce an
all-pairs scan that grows quadratically with live companions.

### Land locomotion

Preserve current walk/run speeds, jump responsiveness, coyote time, jump
buffering, gliding, slopes, roof/furniture support and one-block step behavior.
Replace character-body-specific floor state with support probes and native
contacts. Ground probes exclude living bodies so a pet cannot become a new
step-up ledge or support platform for another pet.

Use movement requests and controlled forces for ordinary locomotion. Explicit
step adjustments, spawn, travel and below-world recovery are checked relocation
operations performed at the physics boundary, with occupancy checks and
interpolation reset. They are exceptional transitions, not normal steering.
Recheck the full body shape instead of the old fixed explorer capsule.

Autonomous companions continue to prefer safe dry ground and their existing
home radius. Prevent an avoidance response from intentionally steering them
off a cliff or into water. If externally displaced, handle the actual physical
support state first and use recovery only for a genuinely invalid placement.

### Swimming, flying and marine actors

Use medium-specific buoyancy/lift and damped depth/altitude controllers. Desired
depth or altitude is a soft target, not a position assignment. Preserve the
explorer's dive/rise/hover inputs and the existing bird day/night and landing
cycles. Contact in water remains fully three-dimensional.

Give each of the 54 fish an independent physical body and persistent movement
state. Keep efficient MultiMesh rendering, but drive its visual transforms from
the bodies' interpolated poses. Preserve species, school centers, population
and habitat. Schooling uses cohesion, alignment and separation, with bounded
acceleration and turning, so fish regroup smoothly after a disturbance.

Dolphins and turtles use physical steering for their existing roam, escort,
guide, breathing and breach activities. Time-based routes become target intent;
they cannot pull a displaced animal instantly back onto its old path.

Check water depth and static clearance along intended travel. When edits remove
habitat, select a checked relocation or inactive habitat state through the same
body lifecycle; a hidden animal cannot leave an invisible active collider.

### Moving boat support

Carry passengers through moving support velocity and physical contact, not an
unconditional per-frame transform copy. Adapt the boat support body to a native
moving/animatable collision surface if required, while retaining hull navigation.
Passengers retain individual mass and contact with other passengers.

The helm role uses a bounded support-relative movement target around the wheel.
It does not freeze the pilot into an immovable body or reset its velocity every
tick. Boarding and disembarking remain explicit, occupancy-checked transitions.
Walking, jumping and leaving the helm must release support behavior correctly.

## Main owning files

| Responsibility | Existing owners | Planned change |
| --- | --- | --- |
| Shared body/movement | `scripts/actor.gd`, `scripts/actor_motion.gd` | Physical actor contract, locomotion, support and body profiles in focused modules |
| Companions/Mayor | `scripts/desktop/companion.gd`, `companions.gd`, `spawn.gd`, `roaming.gd`, `roaming_land.gd`, `presentation.gd` | Physical intent, model-specific profile, contact-aware roaming and checked placement |
| Ambient wildlife | `scripts/wildlife/creature.gd`, `intent.gd`, `social.gd`, `bird_intent.gd`, `system.gd` | Shared bodies, behavior steering and grounded/flying/swimming modes |
| Marine population | `scripts/water/fish_schools.gd`, `dolphins.gd`, `turtles.gd`, `habitat.gd`, `exploration.gd` | Individual physical bodies, schooling and route intent; render after physics |
| Boat passengers | `scripts/water/boat.gd`, `boat_passengers.gd`, `boat_navigation.gd`, `boat_geometry.gd` | Moving support integration and body-aware occupancy |
| Consumers | `scripts/sample.gd`, `actor_audio.gd`, `building.gd`, `camera.gd`, `actions/safe_placement.gd`, `water/journal.gd`, `water/swim_effects.gd` | Use the new contract without shifting camera, labels, actions or sound |
| Documentation | `docs/3d-game.md`, `docs/water.md` | Describe implemented behavior and actual verification limits |

Add small shared physics/profile/neighbor modules rather than expanding these
owners beyond the repository's maintained-source limit. Existing generated
model exports only change if profile measurements require explicit metadata.

## Verification and acceptance

First capture a native movement and frame-time baseline, then implement one
representative physical movement/contact slice before migrating every actor.
The slice is an engineering verification step, not the final deliverable.

Use bounded Godot/Jolt runtime probes and real native gameplay, rather than
unit tests that mirror implementation. Verify these outcomes:

1. Every explorer, companion, Mayor and wildlife actor owns a registered body,
   shape and positive finite mass. All 54 fish retain their own body. Contact
   works in both directions for every family pairing, including wildlife with
   wildlife and marine animals with controlled pets.
2. Equal-mass head-on contacts separate without repeated bounce. With different
   masses, the lighter body visibly yields more. Static walls prevent overlap
   recovery from pushing a body through scenery. Exact initial overlap and
   crowded three-body cases resolve without NaNs or persistent body overlap.
3. Native close-up checks show soft onset, smooth displacement and recovery,
   no jitter, no visible core interpenetration and no sudden route snapping.
   Check idle, sleeping, moving and manually controlled actors.
4. Ground crowd encounters, doorways, shorelines and walls remain navigable.
   Animals do not form a permanent blocking pile or continuously walk against
   one another. Play/approach interactions retain body-aware spacing.
5. Swim through a school and beside dolphins/turtles. Animals yield and regroup
   while retaining depth; animals at clearly different depths do not repel
   each other. Check fish-to-fish and marine-to-marine contacts as well.
6. Birds retain takeoff, landing, rest and sleep while respecting animal contact
   at their actual altitude. Do not confuse scenery clearance with body contact.
7. Repeat land movement, one-block steps, slopes, furniture/roof landing,
   jumping, gliding, diving, depth hover, shore exit and world-edge behavior with
   explorer and controlled companions, including first-person camera view.
8. Verify boarding, steering/turning, passenger nudging, jumping off deck,
   taking/leaving the helm, disembarking and reload. Inspect a crowded deck.
9. Change a pet during follow/control and verify the new shape, mass,
   animation state and camera anchor. Spawn/recover actors into clear sites;
   terrain edits and invalid marine habitats leave no invisible colliders.
10. Compare native frame-time and physics-time distributions against the same
    baseline scene with all populations present and a crowded contact case.
    Optimize broad-phase/neighbor/render costs if there is a material regression;
    do not obtain performance by excluding animals from collision.

Keep numerical collision tolerances tied to model scale and Jolt precision;
visual acceptance is required in addition to numerical probes. Capture actual
runtime screenshots/video when Computer Use is available. If access fails,
report the specific unavailable checks and obtain user observation before
claiming natural contact quality. Build, parser and line-limit checks remain
required but do not prove gameplay acceptance.

## Tradeoffs and alternatives

The selected approach provides genuine solver mass and mutual contacts. Its
main cost is adapting the existing character locomotion and all consumers that
assume `CharacterBody3D`. Movement, steps, water and boat integration therefore
receive regression checks in the same change.

A custom mass-weighted nudge solver on character bodies would preserve more
existing movement code but would make us responsible for mutual impulses,
overlap resolution and cross-family consistency. It is not the preferred route
for the user's request for physical bodies and the most natural result.

Unconstrained rigid-body animals would supply physical contacts but could tumble
or lose deliberate movement. Upright constraints, finite motor authority,
avoidance and medium damping are part of the selected gentle-contact design.

Exact profile weights, motor gains and damping are implementation tuning values
to derive from measured models and native contact review. They do not change the
accepted behavior contract. No claim of naturalness is made until that review.

## Sources

- [Godot RigidBody3D](https://docs.godotengine.org/en/stable/classes/class_rigidbody3d.html)
- [Godot direct body state](https://docs.godotengine.org/en/stable/classes/class_physicsdirectbodystate3d.html)
- [Using Jolt Physics](https://docs.godotengine.org/en/stable/tutorials/physics/using_jolt_physics.html)
