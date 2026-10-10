extends Node
## Observe completed native physics steps; movement audio never drives physics.
var actor: RigidBody3D
var ambience: Node
var effects: Node3D
var initialized := false
var grounded := false
var swimming := false
var last_y_velocity := 0.0
var last_position := Vector3.ZERO
var step_distance := 0.0
var paddle_timer := 0.0

func setup(player: RigidBody3D, sound: Node, world_effects: Node3D = null) -> void:
	actor = player
	ambience = sound
	effects = world_effects
	process_physics_priority = 10

func _physics_process(delta: float) -> void:
	if not is_instance_valid(actor) or not ambience:
		return
	var on_ground: bool = actor.is_grounded()
	var in_water: bool = actor.motion.swimming
	var travel := actor.position.distance_to(last_position)
	if not initialized or travel > 4.0:
		initialized = true
		_remember(on_ground, in_water)
		return
	if actor.enabled:
		if not swimming and in_water:
			ambience.play_action("splash", clampf(absf(last_y_velocity) / 8, 0.3, 1.2))
			if effects:
				effects.add_splash(actor.position)
		elif (grounded or swimming) and not on_ground and not in_water and actor.linear_velocity.y > 2:
			ambience.play_action("splash" if swimming else "jump")
		elif not grounded and on_ground and not in_water and last_y_velocity < -1.5:
			ambience.play_action("land", clampf(absf(last_y_velocity) / 12, 0.15, 1.3))
			step_distance = 0.0
		if on_ground and not in_water:
			step_distance += Vector2(actor.position.x - last_position.x, actor.position.z - last_position.z).length()
			if step_distance >= (1.8 if Input.is_action_pressed("run") else 1.4):
				step_distance = 0.0
				ambience.play_action(_surface(), 1.15 if Input.is_action_pressed("run") else 1.0)
		else:
			step_distance = 0.0
		paddle_timer = maxf(0.0, paddle_timer - delta)
		if in_water and travel > 0.01 and paddle_timer <= 0:
			ambience.play_action("water", 0.45)
			paddle_timer = 0.55
	_remember(on_ground, in_water)

func _remember(on_ground: bool, in_water: bool) -> void:
	grounded = on_ground
	swimming = in_water
	last_y_velocity = actor.linear_velocity.y
	last_position = actor.position

func _surface() -> String:
	if actor.world and actor.world.water_at(actor.position) > actor.position.y + 0.1:
		return "water"
	var node = actor.support_body
	while node is Node:
		if node.has_meta("original_prop"):
			var name := String(node.get_meta("original_prop").get("name", "")).to_lower()
			return "stone" if "stone" in name or "rock" in name else "wood"
		node = node.get_parent()
	if actor.world and actor.world.voxels:
		var cell := Vector3i((actor.position-Vector3.UP*.08).floor())
		var id: int=actor.world.voxels.get_id(cell)
		if id in [2,4]: return "dirt"
		if id in [11,13]: return "wood"
		if id in [3,12,14,15]: return "stone"
	return "grass"
