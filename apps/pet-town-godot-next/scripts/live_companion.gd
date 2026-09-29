class_name LiveCompanion
extends CharacterBody3D

const MODELS := [
	preload("res://assets/companions/Knight.glb"),
	preload("res://assets/companions/Ranger.glb"),
	preload("res://assets/companions/Rogue.glb"),
	preload("res://assets/companions/Barbarian.glb"),
	preload("res://assets/companions/Mage.glb"),
	preload("res://assets/companions/Rogue_Hooded.glb"),
	preload("res://assets/companions/Skeleton_Mage.glb"),
	preload("res://assets/companions/Skeleton_Minion.glb"),
	preload("res://assets/companions/Skeleton_Rogue.glb"),
	preload("res://assets/companions/Skeleton_Warrior.glb"),
]
# Leave room above terrain-level navigation for raised paving before gravity settles the pet.
const MAX_PATH_STEP := 0.8
const NAV_SPAWN_CLEARANCE := MAX_PATH_STEP + 0.2
const MODEL_NAMES := [
	"Knight", "Ranger", "Rogue", "Barbarian", "Mage", "Hooded Rogue",
	"Skeleton Mage", "Skeleton Minion", "Skeleton Rogue", "Skeleton Warrior",
]

@onready var navigation_agent: NavigationAgent3D = $NavigationAgent3D
@onready var caption: Label3D = $Caption
@onready var visual: Node3D = $Visual
@onready var player: AnimationPlayer = $Visual/AnimationPlayer

var agent_id := ""
var model_index := 0
var display_name := "Agent"
var live_status := "working"
var listening := false
var mayor_conversation_active := false
var mayor_speaking := false
var mayor_camera: Camera3D
var speech_phase := 0.0
var manual_direction := Vector3.ZERO
var manually_controlled := false
var jump_requested := false
var stepping_onto_path := false
var last_safe_position := Vector3.ZERO
var has_safe_position := false
var walk_speed := 2.0
var roam_origin := Vector3.ZERO
var roam_radius := 44.0
var pause_left := 0.0
var roam_index := 0

func configure(id: String, label: String, status: String) -> void:
	agent_id = id
	display_name = label
	live_status = status
	if is_node_ready():
		_refresh()

func set_mayor_state(view: Camera3D, state: Dictionary) -> void:
	mayor_camera = view
	mayor_conversation_active = bool(state.get("conversationActive", false))
	mayor_speaking = bool(state.get("speaking", false))

func _ready() -> void:
	add_to_group("live_agents")
	model_index = 0 if agent_id == "pet-town-mayor" else _stable_seed() % MODELS.size()
	var model := MODELS[model_index].instantiate() as Node3D
	model.name = "Model"
	model.scale = Vector3.ONE * 0.7
	visual.add_child(model)
	$Visual/Body.hide()
	navigation_agent.velocity_computed.connect(_move_with_avoidance)
	_animate("Idle_A")
	_refresh()
	call_deferred("_begin_roam")

func _physics_process(delta: float) -> void:
	if manually_controlled:
		_walk(manual_direction, delta)
		return
	if mayor_conversation_active and agent_id == "pet-town-mayor":
		navigation_agent.velocity = Vector3.ZERO
		_walk(Vector3.ZERO, delta)
		_face_camera(delta)
		return
	if pause_left > 0.0:
		pause_left -= delta
		navigation_agent.velocity = Vector3.ZERO
		_walk(Vector3.ZERO, delta)
		if pause_left <= 0.0:
			_choose_destination()
		return
	if NavigationServer3D.map_get_iteration_id(navigation_agent.get_navigation_map()) == 0:
		_walk(Vector3.ZERO, delta)
		return
	if navigation_agent.is_navigation_finished():
		navigation_agent.velocity = Vector3.ZERO
		_walk(Vector3.ZERO, delta)
		pause_left = 1.5 + float(roam_index % 3)
		return
	var next := navigation_agent.get_next_path_position() - global_position
	next.y = 0.0
	navigation_agent.velocity = next.normalized() * walk_speed if next.length() > 0.05 else Vector3.ZERO

func set_manual_control(value: bool) -> void:
	manually_controlled = value
	manual_direction = Vector3.ZERO
	jump_requested = false
	if value:
		navigation_agent.avoidance_enabled = false
		navigation_agent.target_position = global_position
	else:
		navigation_agent.avoidance_enabled = true
		_choose_destination()

func request_jump() -> void:
	if manually_controlled and is_on_floor():
		jump_requested = true

func _begin_roam() -> void:
	roam_origin = global_position
	await get_tree().physics_frame
	await get_tree().physics_frame
	var attempts := 0
	while NavigationServer3D.map_get_iteration_id(navigation_agent.get_navigation_map()) == 0 and attempts < 120:
		attempts += 1
		await get_tree().physics_frame
	if NavigationServer3D.map_get_iteration_id(navigation_agent.get_navigation_map()) > 0:
		var nearest := NavigationServer3D.map_get_closest_point(navigation_agent.get_navigation_map(), global_position)
		global_position = nearest + Vector3.UP * NAV_SPAWN_CLEARANCE
		roam_origin = nearest
	_choose_destination()

func _choose_destination() -> void:
	if NavigationServer3D.map_get_iteration_id(navigation_agent.get_navigation_map()) == 0:
		return
	roam_index += 1
	var seed := _stable_seed()
	var angle := fmod(float(seed) * 0.019 + float(roam_index) * 2.399963, TAU)
	var radius := 5.0 + float((seed + roam_index * 7) % 40)
	var candidate := roam_origin + Vector3(cos(angle), 0.0, sin(angle)) * minf(radius, roam_radius)
	var nearest := NavigationServer3D.map_get_closest_point(navigation_agent.get_navigation_map(), candidate)
	navigation_agent.target_position = nearest
	if nearest.distance_to(global_position) < 1.0:
		pause_left = 1.0

func _walk(direction: Vector3, delta: float) -> void:
	var motion := direction * walk_speed
	if motion.length_squared() > 0.001 and not _can_walk_toward(motion, delta):
		motion = Vector3.ZERO
	if motion.length_squared() > 0.001 and not jump_requested and (is_on_floor() or stepping_onto_path):
		stepping_onto_path = _step_onto_path(global_position + motion * delta + motion.normalized() * 0.38)
	else:
		stepping_onto_path = false
	velocity.x = motion.x
	velocity.z = motion.z
	if is_on_floor():
		velocity.y = 6.5 if jump_requested and manually_controlled else 0.0
	elif stepping_onto_path:
		velocity.y = 0.0
	else:
		velocity.y -= 18.0 * delta
	jump_requested = false
	var snap := floor_snap_length
	if stepping_onto_path:
		floor_snap_length = 0.0
	move_and_slide()
	floor_snap_length = snap
	if is_on_floor():
		stepping_onto_path = false
		if _has_land_below(global_position):
			last_safe_position = global_position
			has_safe_position = true
	elif has_safe_position and global_position.y < last_safe_position.y - 4.0:
		global_position = last_safe_position + Vector3.UP * 0.1
		velocity = Vector3.ZERO
		stepping_onto_path = false
	var actual := get_real_velocity()
	actual.y = 0.0
	if actual.length_squared() > 0.01:
		visual.rotation.y = lerp_angle(visual.rotation.y, atan2(actual.x, actual.z), minf(delta * 8.0, 1.0))
	_animate("Walking_A" if actual.length_squared() > 0.01 else "Idle_A")

func _can_walk_toward(motion: Vector3, delta: float) -> bool:
	var map := navigation_agent.get_navigation_map()
	if NavigationServer3D.map_get_iteration_id(map) == 0:
		return false
	# Check the leading edge, not just the center: a jump must not carry the
	# pet's body past the navigation boundary into open water.
	var ahead := global_position + motion * delta + motion.normalized() * 0.35
	var closest := NavigationServer3D.map_get_closest_point(map, ahead)
	var outside := ahead - closest
	outside.y = 0.0
	return outside.length() <= 0.12 and _has_land_below(ahead)

func _has_land_below(point: Vector3) -> bool:
	var start := point + Vector3.UP * 2.0
	var query := PhysicsRayQueryParameters3D.create(start, point - Vector3.UP * 6.0, 16)
	return not get_world_3d().direct_space_state.intersect_ray(query).is_empty()

func _step_onto_path(next: Vector3) -> bool:
	# A tile may sit above the terrain-level navigation mesh on uneven ground.
	# Probe ahead of the body's leading edge, before its side can block movement.
	var start := next + Vector3.UP * (MAX_PATH_STEP + 0.2)
	var ray := PhysicsRayQueryParameters3D.create(start, next - Vector3.UP * 0.25, 1)
	var hit := get_world_3d().direct_space_state.intersect_ray(ray)
	if hit.is_empty():
		return false
	var body := hit.collider as StaticBody3D
	var path := body.get_parent() as WorkshopObject if body != null else null
	if path == null or path.path_body != body:
		return false
	var rise: float = hit.position.y - global_position.y
	if rise > MAX_PATH_STEP:
		return false
	if rise > 0.01:
		global_position.y += rise + 0.01
	var support := PhysicsRayQueryParameters3D.create(global_position + Vector3.UP * (MAX_PATH_STEP + 0.2), global_position - Vector3.UP * 0.25, 1)
	var under := get_world_3d().direct_space_state.intersect_ray(support)
	# Keep our height while the body clears the edge; resume normal floor snap
	# as soon as the tile is beneath its center.
	var support_body := under.get("collider") as StaticBody3D
	var support_path := support_body.get_parent() as WorkshopObject if support_body != null else null
	return support_path == null or support_path.path_body != support_body

func _move_with_avoidance(safe_velocity: Vector3) -> void:
	if manually_controlled or mayor_conversation_active:
		return
	_walk(safe_velocity / walk_speed, get_physics_process_delta_time())

func _animate(clip: String) -> void:
	if player.has_animation(clip) and player.current_animation != clip:
		player.play(clip, 0.2)

func _refresh() -> void:
	var activity := "Speaking" if mayor_speaking else "Listening" if listening else "Working" if agent_id == "pet-town-mayor" and live_status == "working" else ""
	caption.text = display_name + ("  •  " + activity if not activity.is_empty() else "")
	var color := Color("f1cb83") if agent_id == "pet-town-mayor" else Color("a8d9c4")
	if live_status == "blocked":
		color = Color("e5a27e")
	$Visual/Body.material_override = StandardMaterial3D.new()
	$Visual/Body.material_override.albedo_color = color

func _face_camera(delta: float) -> void:
	if is_instance_valid(mayor_camera):
		var direction := mayor_camera.global_position - global_position
		direction.y = 0.0
		if direction.length_squared() > 0.01:
			visual.rotation.y = lerp_angle(visual.rotation.y, atan2(direction.x, direction.z), minf(delta * 7.0, 1.0))
	if mayor_speaking:
		speech_phase += delta * 11.0
		visual.position.y = sin(speech_phase) * 0.055
	else:
		visual.position.y = move_toward(visual.position.y, 0.0, delta * 0.3)

func _stable_seed() -> int:
	var value := 0
	for index in agent_id.length():
		value = (value * 31 + agent_id.unicode_at(index)) % 2147483647
	return value
