extends "res://scripts/physics/body.gd"
var session: Node3D
var appearance := "Minion"
var health := preload("health.gd").new()
var model: Node3D
var animation: AnimationPlayer
var ring: MeshInstance3D
var target: RigidBody3D
var route := PackedVector3Array()
var reconsider := 0.0
var attack := -1.0
var struck := false
var dead_time := 0.0
var hit_time := 0.0
var stuck := 0.0
var previous := Vector3.ZERO
var warning: Label3D

func _ready() -> void:
	configure_body(preload("res://scripts/physics/profiles.gd").capsule(0.36, 1.6, 20))
	collision_mask = 15
	health.value = 40
	model = load("res://assets/battle/Skeleton_%s.glb" % appearance).instantiate()
	add_child(model)
	model.scale = Vector3.ONE * 0.65
	find_player(model)
	if animation:
		for clip in ["Idle_A", "Walking_A", "Running_A"]:
			animation.get_animation(clip).loop_mode = Animation.LOOP_LINEAR
		for clip in ["Attack_C", "Hit", "Defeat"]: animation.get_animation(clip).loop_mode = Animation.LOOP_NONE
	ring = MeshInstance3D.new()
	var mesh := TorusMesh.new()
	mesh.inner_radius = 1.7
	mesh.outer_radius = 1.85
	mesh.rings = 24
	mesh.ring_segments = 8
	ring.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("efb85f")
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	ring.material_override = material
	ring.position.y = 0.08
	add_child(ring)
	ring.hide()
	warning = Label3D.new()
	warning.text = "!"
	warning.font = preload("res://ui/fonts/nunito-900.ttf")
	warning.font_size = 72
	warning.outline_size = 10
	warning.modulate = Color("fff2c0")
	warning.position.y = 2
	warning.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(warning)
	warning.hide()
	previous = position

func find_player(node: Node) -> void:
	if node is AnimationPlayer: animation = node
	for child in node.get_children(): find_player(child)

func clip(name: String) -> void:
	if animation and animation.current_animation != name: animation.play(name, 0.08)

func step(delta: float) -> void:
	if health.value <= 0:
		dead_time += delta
		if dead_time >= 1.2: queue_free()
		return
	health.tick(delta)
	hit_time = maxf(0, hit_time - delta)
	begin_motion()
	velocity.y = -0.5 if is_grounded() else velocity.y - 28 * delta
	if attack >= 0:
		attack += delta
		velocity.x = move_toward(velocity.x, 0, delta * 18)
		velocity.z = move_toward(velocity.z, 0, delta * 18)
		ring.visible = attack < 0.6
		warning.visible = ring.visible
		if attack >= 0.6 and not struck:
			struck = true
			if alive(target) and position.distance_to(target.position) < 1.85 and session.arena.visible_line(position + Vector3.UP * 0.8, target.position + Vector3.UP * 0.8): target.hurt(10)
		if attack >= 1.5: attack = -1
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
	if toward.length() < 1.5 and absf(target.position.y - position.y) < 1.3:
		attack = 0
		struck = false
		ring.show()
		warning.show()
		if animation: animation.play("Attack_C", 0.06)
		velocity.x = 0
		velocity.z = 0
	else:
		while not route.is_empty() and position.distance_to(route[0]) < 0.6: route.remove_at(0)
		var desired := Vector3.ZERO
		if not route.is_empty():
			desired = route[0] - position
			desired.y = 0
			desired = steer(desired.normalized() * 2.9)
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

func alive(body: RigidBody3D) -> bool:
	return is_instance_valid(body) and body.health.value > 0

func choose_target() -> void:
	var chosen: RigidBody3D
	var chosen_route := PackedVector3Array()
	var best := INF
	for body in [session.avatar] + session.animals:
		if not alive(body): continue
		var distance := position.distance_to(body.position) * (0.8 if body == target else 1.0)
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
	session.feedback.number(position + Vector3.UP * 1.8, "−20")
	hit_time = 0.25
	if health.value <= 0:
		ring.hide()
		warning.hide()
		freeze = true
		collision_layer = 0
		collision_mask = 0
		contact_enabled = false
		preload("res://scripts/physics/neighbors.gd").frame = -1
		if animation: animation.play("Defeat", 0.04)
		session.kills += 1
