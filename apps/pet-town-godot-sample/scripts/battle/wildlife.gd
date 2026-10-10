extends "res://scripts/wildlife/creature.gd"
## Temporary actor using the existing animal art; never joins care or ordinary roster.
var session: Node3D
var health := preload("health.gd").new()
var rethink := 0.0
var route := PackedVector3Array()
var last_safe := Vector3.ZERO

func _physics_process(_delta: float) -> void:
	pass

func step(delta: float) -> void:
	health.tick(delta)
	if health.value <= 0: return
	begin_motion()
	if last_safe == Vector3.ZERO: last_safe = home
	if session.arena.safe(position): last_safe = Vector3(position.x, session.arena.world.ground_at(position) + 0.06, position.z)
	elif position.distance_to(last_safe) > 2 or position.y < session.arena.world.ground_at(position) - 1:
		relocate(last_safe)
		route.clear()
	rethink -= delta
	if rethink <= 0:
		rethink = 0.7
		var away := Vector3.ZERO
		var closest := 8.0
		for enemy in session.enemies:
			if enemy.health.value <= 0: continue
			var distance := position.distance_to(enemy.position)
			if distance < closest:
				closest = distance
				away = (position - enemy.position).normalized()
		if away.length_squared() > 0:
			goal = position + away * 4
			state = "flee"
		elif route.is_empty():
			goal = home + Vector3(randf_range(-3, 3), 0, randf_range(-3, 3))
			state = "wander"
		if session.arena.safe(goal): route = session.arena.path(position, goal)
	while not route.is_empty() and position.distance_to(route[0]) < 0.7: route.remove_at(0)
	var desired := Vector3.ZERO
	if not route.is_empty():
		desired = route[0] - position
		desired.y = 0
		desired = desired.normalized() * minf(3.4, float(definition.run) if state == "flee" else walk)
	var next := position + desired * maxf(delta, 0.15)
	if not session.arena.safe(next): desired = Vector3.ZERO
	desired = steer(desired)
	if not session.arena.safe(position + desired * maxf(delta, 0.15)):
		desired = Vector3.ZERO
		velocity.x = 0
		velocity.z = 0
	velocity.x = move_toward(velocity.x, desired.x, delta * 7)
	velocity.z = move_toward(velocity.z, desired.z, delta * 7)
	velocity.y = -0.5 if is_grounded() else velocity.y - delta * 22
	submit_motion()
	if desired.length_squared() > 0.01: set_heading(lerp_angle(rotation.y, atan2(desired.x, desired.z), 1 - exp(-delta * 7)))
	play("flee" if state == "flee" and desired.length() > 0.1 else "walk" if desired.length() > 0.1 else "idle")

func play(clip: String) -> void:
	if animation and clips.has(clip) and current_clip != clip:
		animation.play(clips[clip], 0.14)
		current_clip = clip

func hurt(amount: float) -> void:
	if not health.hurt(amount): return
	session.feedback.number(head_position(), "−10")
	if health.value <= 0:
		freeze = true
		collision_layer = 0
		collision_mask = 0
		contact_enabled = false
		preload("res://scripts/physics/neighbors.gd").frame = -1
		play("rest" if clips.has("rest") else "sleep")
