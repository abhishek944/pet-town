extends "res://scripts/actor.gd"
const MODEL = preload("res://assets/companion-maple.glb")
var session: Node3D
var health := preload("health.gd").new()
var last_safe := Vector3.ZERO

func _ready() -> void:
	set_meta("battle_avatar", true)
	model_path = MODEL.resource_path
	pet_light = false
	super._ready()
	configure_body(preload("res://scripts/physics/profiles.gd").pet("maple"), 2)
	collision_mask = 15
	var model: Node3D = visual.get_child(0)
	var holding := preload("holding_pose.gd").new()
	visual.add_child(holding)
	holding.setup(model)
	last_safe = spawn
	spawn_pending = false

func _physics_process(_delta: float) -> void:
	pass # Session orders every combat step and clamps the final step together.

func step(delta: float) -> void:
	begin_motion()
	health.tick(delta)
	# Keep native walk/run/jump forces, with no glide, swimming or travel shortcuts.
	motion.step(self, delta)
	motion.gliding = false
	var next := position + Vector3(velocity.x, 0, velocity.z) * maxf(delta, 0.15)
	if not session.arena.safe(next):
		velocity.x = 0
		velocity.z = 0
	if session.arena.safe(position) and position.y < world.ground_at(position) + 0.3:
		last_safe = Vector3(position.x, world.ground_at(position) + 0.06, position.z)
	if not session.arena.dry(position) or position.y < world.ground_at(position) - 1 or position.y > world.ground_at(position) + 2.5:
		relocate(last_safe)
	submit_motion()
	animator.set_state(false, false)
	animator.set_motion(Vector2(linear_velocity.x, linear_velocity.z).length(), is_grounded(), linear_velocity.y)
	visual.scale = Vector3.ONE * (1.0 - 0.035 * health.flash / 0.35)

func hurt(amount: float) -> void:
	if health.hurt(amount): session.feedback.number(position + Vector3.UP * 1.6, "−10")
