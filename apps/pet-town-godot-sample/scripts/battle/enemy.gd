extends "enemy_attack.gd"
## Role presentation, target selection and locomotion around the shared attack body.

func _ready() -> void:
	configure_body(preload("res://scripts/physics/profiles.gd").capsule(0.36, 1.6, 20))
	collision_mask = 15
	profile = PROFILES[appearance]
	health.value = profile.health
	model = load("res://assets/battle/Skeleton_%s.glb" % appearance).instantiate()
	add_child(model)
	model.scale = Vector3.ONE * 0.65
	find_player(model)
	if animation:
		for name in ["Idle_A", "Walking_A", "Running_A"]:
			if animation.has_animation(name): animation.get_animation(name).loop_mode = Animation.LOOP_LINEAR
		for name in ["Attack_C", "Hit", "Defeat"]:
			if animation.has_animation(name): animation.get_animation(name).loop_mode = Animation.LOOP_NONE
	ring = MeshInstance3D.new()
	var mesh := TorusMesh.new()
	mesh.inner_radius = 1.7
	mesh.outer_radius = 1.85
	mesh.rings = 24
	mesh.ring_segments = 8
	ring.mesh = mesh
	ring.material_override = danger_material()
	ring.position.y = 0.08
	add_child(ring)
	lane = Node3D.new()
	add_child(lane)
	lane.set_as_top_level(true)
	warning = Label3D.new()
	warning.text = "!"
	warning.font = preload("res://ui/fonts/nunito-900.ttf")
	warning.font_size = 72
	warning.outline_size = 10
	warning.modulate = Color("fff2c0")
	warning.position.y = 2
	warning.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(warning)
	refresh_warning()
	previous = position

func find_player(node: Node) -> void:
	if node is AnimationPlayer: animation = node
	for child in node.get_children(): find_player(child)

func step(delta: float) -> void:
	if health.value <= 0:
		dead_time += delta
		if dead_time >= 1.2: queue_free()
		return
	health.tick(delta)
	hit_time = maxf(0, hit_time - delta)
	begin_motion()
	velocity.y = -0.5 if is_grounded() else velocity.y - 28 * delta
	if phase != "Chase":
		step_attack(delta)
		refresh_warning()
		previous = position
		submit_motion()
		return
	reconsider -= delta
	if reconsider <= 0 or not alive(target):
		reconsider = 0.65
		choose_target()
	if not alive(target):
		velocity.x = 0
		velocity.z = 0
		clip("Idle_A")
		submit_motion()
		return
	var toward: Vector3 = target.position - position
	toward.y = 0
	model.rotation.y = lerp_angle(model.rotation.y, atan2(toward.x, toward.z), 1 - exp(-12 * delta))
	var in_range := toward.length() < float(profile.range)
	var level := absf(target.position.y - position.y) < 1.3
	if in_range and (level or appearance == "Mage") and prepare_attack():
		velocity.x = 0
		velocity.z = 0
	else:
		while not route.is_empty() and position.distance_to(route[0]) < 0.6: route.remove_at(0)
		var desired := Vector3.ZERO
		if not route.is_empty():
			desired = route[0] - position
			desired.y = 0
			desired = steer(desired.normalized() * float(profile.speed))
		if not session.arena.safe(position + desired * maxf(0.15, delta)): desired = Vector3.ZERO
		velocity.x = move_toward(velocity.x, desired.x, delta * 10)
		velocity.z = move_toward(velocity.z, desired.z, delta * 10)
		clip("Hit" if hit_time > 0 else "Running_A" if desired.length() > 0.1 else "Idle_A")
		stuck = stuck + delta if position.distance_to(previous) < delta * 0.08 else 0
		if stuck > 4:
			target = null
			route.clear()
		if stuck > 12 or position.y < session.arena.world.ground_at(position) - 2: queue_free()
	previous = position
	submit_motion()

func choose_target() -> void:
	var chosen: RigidBody3D
	var chosen_route := PackedVector3Array()
	var best := INF
	for body in [session.avatar] + session.animals:
		if not alive(body): continue
		var distance := position.distance_to(body.position)
		if distance >= best: continue
		var candidate: PackedVector3Array = session.arena.path(position, body.position)
		if candidate.is_empty(): continue
		chosen = body
		chosen_route = candidate
		best = distance
	target = chosen
	route = chosen_route

func hurt(amount: float) -> void:
	if health.value <= 0: return
	health.protection = 0
	if not health.hurt(amount): return
	session.feedback.number(position + Vector3.UP * 1.8, "−%d" % ceili(amount))
	hit_time = 0.25
	if health.value <= 0:
		phase = "Chase"
		refresh_warning()
		freeze = true
		collision_layer = 0
		collision_mask = 0
		contact_enabled = false
		preload("res://scripts/physics/neighbors.gd").frame = -1
		clip("Defeat")
		session.kills += 1
