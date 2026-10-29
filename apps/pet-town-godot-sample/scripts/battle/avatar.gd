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
	collision_mask = 7
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
	# Use ordinary town walk/run/jump/swim forces without an artificial battle rim.
	motion.step(self, delta)
	motion.gliding = false
	if world.contains(position) and is_grounded() and world.water_at(position) < -100:
		last_safe = position
	if not world.contains(position) or position.y < world.submerged_floor_at(position) - 2:
		relocate(last_safe)
	submit_motion()
	animator.set_state(false, motion.swimming, motion.diving)
	animator.set_motion(Vector2(linear_velocity.x, linear_velocity.z).length(), is_grounded(), linear_velocity.y)
	visual.scale = Vector3.ONE * (1.0 - 0.035 * health.flash / 0.35)

func hurt(amount: float) -> void:
	if health.hurt(amount): session.feedback.number(position + Vector3.UP * 1.6, "−%d" % ceili(amount))
