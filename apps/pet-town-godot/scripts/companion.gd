extends CharacterBody3D
## Character behavior only: navigation and activity targets live in saved scenes.
@export var display_name := "Companion"
@export var walk_speed := 1.65
@export_range(0.0, 100.0) var energy := 80.0
@export var preferred_activity := "gather"
@onready var agent: NavigationAgent3D = $NavigationAgent3D
@onready var visual: Node3D = $Visual
@onready var player: AnimationPlayer = $Visual/AnimationPlayer
@onready var caption: Label3D = $Caption
@onready var apple: MeshInstance3D = $Visual/CarriedApple
var apples := 0
var deliveries := 0
var completed_activities := 0
var failed_routes := 0
var activity_text := "Waking up"
var state := "starting"
var taking_detour := false
var detour_point := Vector3.ZERO
var detour_attempts := 0
var target: Marker3D
var last_target: Marker3D
var wait_left := 0.0
var stuck_time := 0.0
var progress_interval := 0.0
var last_position := Vector3.ZERO
var ready_to_walk := false
var rng := RandomNumberGenerator.new()

func _ready() -> void:
	add_to_group("companions")
	rng.seed = hash(str(name))
	var skeleton := $Visual/Model.find_child("Skeleton3D", true, false) as Skeleton3D
	if skeleton and skeleton.find_bone("hand.r") >= 0:
		var grip := BoneAttachment3D.new()
		grip.bone_name = "hand.r"
		skeleton.add_child(grip)
		apple.reparent(grip, false)
		apple.position = Vector3(0.0, 0.1, 0.0)
	agent.velocity_computed.connect(_move_with_avoidance)
	_animate("Idle_A")
	reset_physics_interpolation()
	await get_tree().physics_frame
	await get_tree().physics_frame
	while NavigationServer3D.map_get_iteration_id(agent.get_navigation_map()) == 0:
		await get_tree().physics_frame
	ready_to_walk = true
	state = "idle"
	wait_left = rng.randf_range(0.3, 1.5)
	last_position = global_position

func _physics_process(delta: float) -> void:
	if not ready_to_walk: return
	velocity.y = 0.0 if is_on_floor() else velocity.y - 18.0 * delta
	apple.visible = apples > 0
	caption.text = display_name
	if state == "idle":
		wait_left -= delta
		agent.velocity = Vector3.ZERO
		if wait_left <= 0.0: _choose_activity()
	elif state == "acting":
		agent.velocity = Vector3.ZERO
		wait_left -= delta
		if wait_left <= 0.0: _finish_activity()
	elif state == "walking":
		if not is_instance_valid(target):
			_abandon_route()
			return
		var next := agent.get_next_path_position()
		var destination := detour_point if taking_detour else target.global_position
		var offset := destination - global_position
		offset.y = 0.0
		if offset.length() < 0.65:
			if taking_detour:
				taking_detour = false
				agent.target_position = target.global_position
				stuck_time = 0.0
			else:
				_begin_activity()
			return
		if not taking_detour and agent.is_navigation_finished() and offset.length() < 1.0:
			_begin_activity()
			return
		var direction := next - global_position
		direction.y = 0.0
		direction = direction.normalized()
		agent.velocity = direction * walk_speed
		if direction.length_squared() > 0.01:
			visual.rotation.y = lerp_angle(visual.rotation.y, atan2(direction.x, direction.z), minf(delta * 8.0, 1.0))
		energy = maxf(0.0, energy - delta * 0.25)
		progress_interval += delta
		if progress_interval >= 1.0:
			if global_position.distance_to(last_position) < 0.15:
				stuck_time += progress_interval
			else:
				stuck_time = 0.0
			last_position = global_position
			progress_interval = 0.0
		if stuck_time > 3.0:
			if taking_detour or detour_attempts >= 2 or not _try_detour(): _abandon_route()

func _move_with_avoidance(safe_velocity: Vector3) -> void:
	if not ready_to_walk: return
	velocity.x = safe_velocity.x
	velocity.z = safe_velocity.z
	move_and_slide()
	# Step over shallow gravel curbs, only with floor ahead and capsule clearance.
	var horizontal := Vector3(safe_velocity.x, 0.0, safe_velocity.z)
	if is_on_wall() and horizontal.length() > 0.2:
		var ahead := global_position + horizontal.normalized() * 0.4
		var probe := PhysicsRayQueryParameters3D.create(ahead + Vector3.UP * 0.5, ahead - Vector3.UP * 0.1, 1)
		var hit := get_world_3d().direct_space_state.intersect_ray(probe)
		if not hit.is_empty() and hit.normal.y > 0.65:
			var rise: float = hit.position.y - global_position.y
			if rise > 0.015 and rise <= 0.45:
				var raised := global_transform
				raised.origin.y += rise + 0.03
				if not test_move(global_transform, Vector3.UP * (rise + 0.03)) and not test_move(raised, horizontal * get_physics_process_delta_time()):
					global_position.y += rise + 0.03
					velocity.y = 0.0

func _choose_activity() -> void:
	var candidates: Array = []
	for spot in get_tree().get_nodes_in_group("interaction_spots"):
		if not spot.is_available() or spot == last_target: continue
		if spot.activity == "deliver" and apples == 0: continue
		if spot.activity == "gather" and apples >= 3: continue
		var priority: float = rng.randf_range(0.0, 12.0) - global_position.distance_to(spot.global_position) * 0.12
		if spot.activity == preferred_activity: priority += 3.0
		if energy < 35.0 and spot.activity in ["rest", "eat"]: priority += 25.0
		if apples > 0 and spot.activity == "deliver": priority += 18.0
		candidates.append({"spot":spot,"priority":priority})
	candidates.sort_custom(func(a, b): return a.priority > b.priority)
	for candidate in candidates:
		var spot = candidate.spot
		var path := NavigationServer3D.map_get_path(agent.get_navigation_map(), global_position, spot.global_position, true)
		if path.is_empty() or path[-1].distance_to(spot.global_position) > 0.7: continue
		if not spot.claim(self): continue
		target = spot
		taking_detour = false
		detour_attempts = 0
		agent.target_position = spot.global_position
		state = "walking"
		activity_text = "To " + spot.display_name
		stuck_time = 0.0
		progress_interval = 0.0
		last_position = global_position
		_animate("Walking_A")
		return
	activity_text = "Watching the town"
	wait_left = 2.0

func _begin_activity() -> void:
	state = "acting"
	agent.velocity = Vector3.ZERO
	velocity.x = 0.0
	velocity.z = 0.0
	visual.rotation.y = target.global_rotation.y
	wait_left = target.duration
	activity_text = {"gather":"Gathering apples", "deliver":"Delivering apples", "eat":"Enjoying a snack", "rest":"Taking a break", "visit":"Exploring"}.get(target.activity, "Exploring")
	_animate(target.animation)

func _finish_activity() -> void:
	if not is_instance_valid(target):
		_abandon_route()
		return
	target.complete(self)
	match target.activity:
		"gather": apples += 1
		"deliver":
			deliveries += apples
			apples = 0
		"eat": energy = minf(100.0, energy + 35.0)
		"rest": energy = minf(100.0, energy + 45.0)
	completed_activities += 1
	last_target = target
	target = null
	taking_detour = false
	state = "idle"
	activity_text = "Enjoying the island"
	wait_left = rng.randf_range(1.0, 3.0)
	_animate("Idle_B")

func _abandon_route() -> void:
	if is_instance_valid(target): target.release(self)
	target = null
	taking_detour = false
	state = "idle"
	failed_routes += 1
	stuck_time = 0.0
	activity_text = "Choosing another stop"
	wait_left = 1.0
	agent.velocity = Vector3.ZERO
	_animate("Idle_A")

func _animate(clip: String) -> void:
	if player.current_animation != clip: player.play(clip, 0.2)

func _exit_tree() -> void:
	if is_instance_valid(target): target.release(self)

func _try_detour() -> bool:
	# Choose a short reachable side-step when a curb or another resident blocks us.
	# These are local steering offsets, not authored world destinations.
	var forward := Vector3(sin(visual.rotation.y), 0.0, cos(visual.rotation.y))
	var side := Vector3(-forward.z, 0.0, forward.x)
	for offset in [side * 1.4, -side * 1.4, -forward * 1.4]:
		var point := NavigationServer3D.map_get_closest_point(agent.get_navigation_map(), global_position + offset)
		if Vector2(point.x - global_position.x, point.z - global_position.z).length() < 0.9: continue
		var raised := global_transform
		raised.origin.y += 0.45
		if test_move(raised, Vector3(point.x - global_position.x, 0.0, point.z - global_position.z)): continue
		var path := NavigationServer3D.map_get_path(agent.get_navigation_map(), global_position, point, true)
		if path.is_empty() or path[-1].distance_to(point) > 0.3: continue
		detour_point = point
		taking_detour = true
		detour_attempts += 1
		stuck_time = 0.0
		progress_interval = 0.0
		last_position = global_position
		agent.target_position = point
		return true
	return false
