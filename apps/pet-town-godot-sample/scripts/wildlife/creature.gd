extends "res://scripts/physics/body.gd"
const Intent = preload("res://scripts/wildlife/intent.gd")
const Style = preload("res://scripts/asset_style.gd")
const WildlifeMaterials = preload("res://scripts/wildlife/materials.gd")
var entry: Dictionary
var definition: Dictionary
var system: Node3D
var home := Vector3.ZERO
var goal := Vector3.ZERO
var has_goal := false
var state := "idle"
var age := 0.0
var duration := 2.0
var player_cd := 0.0
var affection := 0
var buddy: Node3D
var role := ""
var radius := 0.3
var walk := 1.0
var size_factor := 1.0
var swimmer := false
var in_water := false
var flying := false
var model: Node3D
var animation: AnimationPlayer
var clips: Dictionary = {}
var current_clip := ""
var random := RandomNumberGenerator.new()
var intent = Intent.new()
var initialized := false
var support_timer := 0.0
var ground_height := -INF
var next_ground := -INF
var settle_timer := 0.0
var think_elapsed := 0.0

func setup(data: Dictionary, owner_system: Node3D) -> void:
	entry = data
	definition = data.definition
	system = owner_system
	size_factor = float(data.size)
	radius = float(definition.radius) * size_factor
	walk = float(definition.walk)
	swimmer = float(definition.traits.get("swimmer", 0)) > 0
	random.seed = hash(str(data.position) + str(data.species))
	player_cd = random.randf_range(0.0, 3.0)
	position = Vector3(data.position[0], data.position[1], data.position[2])
	home = Vector3(data.home[0], data.position[1], data.home[2])
	rotation.y = float(data.yaw)
	configure_body(preload("res://scripts/physics/profiles.gd").wildlife(definition, size_factor))
	floor_snap_length = 0.5
	floor_max_angle = deg_to_rad(48)
	var scene_path := "res://assets/%s.glb" % str(data.model)
	if not ResourceLoader.exists(scene_path):
		return
	model = load(scene_path).instantiate()
	model.scale = Vector3.ONE * size_factor
	Style.apply(model)
	WildlifeMaterials.apply(model)
	add_child(model)
	_find_animation(model)
	if animation:
		for clip in animation.get_animation_list():
			var short_name := String(clip).get_slice("/", String(clip).get_slice_count("/") - 1)
			clips[short_name] = clip
			animation.get_animation(clip).loop_mode = Animation.LOOP_LINEAR

func _find_animation(node: Node) -> void:
	if node is AnimationPlayer:
		animation = node
	for child in node.get_children():
		_find_animation(child)

func _physics_process(delta: float) -> void:
	begin_motion()
	if not is_instance_valid(system.player):
		return
	if not initialized:
		var ground: float = system.support(global_position, 3.0, 20.0)
		if is_finite(ground):
			if definition.has("flight") and position.y > ground + 0.5:
				flying = true
			else:
				relocate(Vector3(position.x, ground, position.z))
		ground_height = ground
		support_timer = float(get_index() % 6) / 60.0
		initialized = true
	age += delta
	player_cd -= delta
	think_elapsed += delta
	if think_elapsed >= 0.1 or state in ["approach", "greet", "happy", "play"]:
		intent.tick(self, think_elapsed)
		think_elapsed = 0.0
	support_timer -= delta
	settle_timer -= delta
	var refresh_support := support_timer <= 0.0
	if refresh_support:
		ground_height = system.support(global_position, 0.7, 12.0 if flying else 3.0)
		support_timer = 0.1
	var ground: float = ground_height
	in_water = swimmer and is_finite(ground) and ground < system.water_level - 0.05
	var desired := Vector3.ZERO
	if has_goal:
		desired = goal - global_position
		desired.y = 0
		if desired.length() < 0.35:
			has_goal = false
		else:
			var speed := walk * (1.4 if state == "approach" else 1.0)
			if flying and definition.has("flight"):
				speed = float(definition.flight.cruiseSpeed)
			elif state == "flee":
				speed = float(definition.run)
			elif state == "play" and role in ["lead", "follow"]:
				speed = float(definition.run) * 0.8
			desired = desired.normalized() * speed
			# Probe ahead of the 100ms support interval, keeping cliff avoidance.
			var next := global_position + desired * maxf(delta * 3.0, 0.13)
			if refresh_support or not is_finite(next_ground):
				next_ground = system.support(next, 0.5, 2.0)
			if not system.inside(next) or (not flying and (not is_finite(next_ground) or next_ground < position.y - 1.0 or (not swimmer and next_ground < system.water_level - 0.05))):
				desired = Vector3.ZERO
				has_goal = false
	var avoidance := steer(desired, flying or in_water)
	var avoided_point := global_position + avoidance * maxf(delta, 0.13)
	if not system.inside(avoided_point): avoidance = Vector3.ZERO
	if not flying and avoidance != desired:
		var avoided_ground: float = system.support(avoided_point, 0.7, 2.0)
		if not is_finite(avoided_ground) or avoided_ground < position.y - 1 or (not swimmer and avoided_ground < system.water_level - 0.05): avoidance = Vector3.ZERO
	medium = "air" if flying else ("water" if in_water else "land")
	velocity.x = move_toward(velocity.x, avoidance.x, delta * 7.0)
	velocity.z = move_toward(velocity.z, avoidance.z, delta * 7.0)
	if flying and is_finite(ground):
		var profile: Dictionary = definition.get("flight", {})
		var flight_height := float(profile.get("minAltitude", 3.0))
		if has_meta("bird_runtime"):
			flight_height = float(get_meta("bird_runtime").altitude)
		var destination_y := maxf(ground, system.water_level) + flight_height
		if state == "land" and not has_goal:
			destination_y = ground
		velocity.y = clampf((destination_y - position.y) * 2.0, -2.5, 4.0)
	elif in_water:
		# Request a damped buoyancy force, rather than replacing vertical speed.
		# Full velocity correction oscillates through the rigid body's motor delay.
		var depth_error: float = system.water_level - 0.25 - position.y
		velocity.y += (depth_error * 32.0 - velocity.y * 10.0) * delta
	else:
		velocity.y = -0.5 if is_grounded() else velocity.y - delta * 22.0
	submit_motion()
	if desired.length() > 0.05:
		set_heading(lerp_angle(rotation.y, atan2(desired.x, desired.z), 1.0 - exp(-delta * 7.0)))
	elif state in ["greet", "happy"]:
		var direction: Vector3 = system.player.global_position - global_position
		set_heading(lerp_angle(rotation.y, atan2(direction.x, direction.z), 1.0 - exp(-delta * 4.0)))
	var clip := "idle"
	if state in ["happy", "sleep", "rest", "graze", "flee"]:
		clip = state
	elif flying:
		clip = "fly"
	elif in_water:
		clip = "swim"
	elif Vector2(linear_velocity.x, linear_velocity.z).length() > 0.08:
		clip = "walk"
	if animation and clips.has(clip) and clip != current_clip:
		animation.play(clips[clip], 0.14)
		current_clip = clip
	if animation:
		animation.speed_scale = clampf(Vector2(linear_velocity.x, linear_velocity.z).length() / walk, 0.8, 1.6) if clip == "walk" else 1.0

func set_state(value: String, seconds: float) -> void:
	state = value
	age = 0.0
	duration = seconds
	has_goal = false
	support_timer = 0.0
	next_ground = -INF

func pet() -> void:
	affection += 1
	set_state("happy", 2.2 if state == "sleep" else 1.7)
	player_cd = 8.0

func head_position() -> Vector3:
	return global_position + Vector3.UP * float(definition.headY) * size_factor
