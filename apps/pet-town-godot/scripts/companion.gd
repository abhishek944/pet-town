extends CharacterBody3D
## A single live broker agent. World placement remains in the saved town scene.

signal retirement_finished(agent_id: String)

@export var display_name := "Agent"
@export var agent_id := ""
@export var live_status := "unknown"
@export var appearance_label := "Knight"
@export var walk_speed := 1.65

@onready var navigation_agent: NavigationAgent3D = $NavigationAgent3D
@onready var visual: Node3D = $Visual
@onready var player: AnimationPlayer = $Visual/AnimationPlayer
@onready var caption: Label3D = $Caption

const STATUS_ACTIVITIES := {
	"working": ["gather", "deliver"],
	"blocked": ["rest"],
	"idle": ["visit", "eat", "rest"],
	"done": ["visit"],
	"unknown": ["rest"],
}

var ready_to_walk := false
var destination := Vector3.ZERO
var destination_index := 0
var pause_left := 0.0
var path_settling_frames := 0
var seated := false
var retiring := false
var retirement_tween: Tween
var activity_text := "Connecting"

func configure(id: String, label: String, status: String, appearance: String) -> void:
	agent_id = id
	display_name = label
	live_status = _normalized_status(status)
	appearance_label = appearance
	if is_node_ready():
		_apply_live_status()

func update_live_status(status: String, label: String) -> void:
	var was_retiring := retiring
	if retiring:
		_cancel_retirement()
	var next_status := _normalized_status(status)
	var status_changed := next_status != live_status
	display_name = label
	live_status = next_status
	if is_node_ready():
		caption.text = display_name
		if status_changed or was_retiring:
			_apply_live_status()

func begin_retirement() -> void:
	if retiring:
		return
	retiring = true
	navigation_agent.velocity = Vector3.ZERO
	velocity = Vector3.ZERO
	activity_text = "Agent ended"
	_animate("Idle_A")
	retirement_tween = create_tween()
	retirement_tween.tween_interval(0.35)
	retirement_tween.tween_property(self, "scale", Vector3(0.02, 0.02, 0.02), 0.65)
	retirement_tween.tween_callback(_finish_retirement)

func _ready() -> void:
	add_to_group("live_agents")
	navigation_agent.velocity_computed.connect(_move_with_avoidance)
	caption.text = display_name
	_animate("Idle_A")
	reset_physics_interpolation()
	await get_tree().physics_frame
	await get_tree().physics_frame
	while NavigationServer3D.map_get_iteration_id(navigation_agent.get_navigation_map()) == 0:
		await get_tree().physics_frame
	ready_to_walk = true
	_apply_live_status()

func _physics_process(delta: float) -> void:
	caption.text = display_name
	if retiring or not ready_to_walk:
		return
	if seated and live_status in ["idle", "done"]:
		navigation_agent.velocity = Vector3.ZERO
		velocity = Vector3.ZERO
		return
	if pause_left > 0.0:
		pause_left -= delta
		navigation_agent.velocity = Vector3.ZERO
		if pause_left <= 0.0:
			_choose_next_destination()
		return
	if path_settling_frames > 0:
		path_settling_frames -= 1
		navigation_agent.velocity = Vector3.ZERO
		return
	var offset := destination - global_position
	offset.y = 0.0
	var arrival_distance := 1.4 if live_status == "idle" else 0.7
	if offset.length() < arrival_distance:
		_arrive()
		return
	var next_point := navigation_agent.get_next_path_position()
	var direction := next_point - global_position
	direction.y = 0.0
	if direction.length_squared() < 0.001:
		navigation_agent.velocity = Vector3.ZERO
		return
	direction = direction.normalized()
	navigation_agent.velocity = direction * walk_speed
	visual.rotation.y = lerp_angle(visual.rotation.y, atan2(direction.x, direction.z), minf(delta * 8.0, 1.0))

func _move_with_avoidance(safe_velocity: Vector3) -> void:
	if not ready_to_walk or retiring or seated or pause_left > 0.0:
		velocity = Vector3.ZERO
		return
	velocity.x = safe_velocity.x
	velocity.z = safe_velocity.z
	velocity.y = 0.0 if is_on_floor() else velocity.y - 18.0 * get_physics_process_delta_time()
	move_and_slide()

func _apply_live_status() -> void:
	if retiring:
		return
	caption.text = display_name
	activity_text = {
		"working": "Working in town",
		"blocked": "Waiting on a blocker",
		"idle": "Taking a town break",
		"done": "Work complete",
		"unknown": "Awaiting a live update",
	}.get(live_status, "Awaiting a live update")
	destination_index = _stable_index(_destinations_for_status().size())
	pause_left = 0.0
	_set_seated(false)
	if ready_to_walk:
		if live_status == "done":
			destination = global_position
			navigation_agent.target_position = global_position
			_arrive()
		else:
			_choose_next_destination()
			if live_status == "idle":
				global_position = destination
				reset_physics_interpolation()
				_arrive()
	else:
		_animate("Idle_A")

func _choose_next_destination() -> void:
	_set_seated(false)
	var destinations := _destinations_for_status()
	if destinations.is_empty():
		destination = global_position
		_animate("Idle_A")
		pause_left = 2.0
		return
	destination = destinations[destination_index % destinations.size()]
	destination_index += 1
	var closest := NavigationServer3D.map_get_closest_point(navigation_agent.get_navigation_map(), destination)
	if closest != Vector3.ZERO:
		destination = closest
	navigation_agent.target_position = destination
	path_settling_frames = 2
	if live_status == "blocked" or live_status == "unknown":
		_animate("Walking_A")
	else:
		_animate("Walking_A")

func _arrive() -> void:
	navigation_agent.velocity = Vector3.ZERO
	velocity.x = 0.0
	velocity.z = 0.0
	match live_status:
		"working":
			_animate("Interact")
			pause_left = 2.2
		"blocked":
			_animate("Idle_A")
			pause_left = 3.2
		"idle":
			_animate("Idle_B")
			_set_seated(true)
			activity_text = "Resting in the town center"
			pause_left = 8.0
		"done":
			_animate("Idle_B")
			_set_seated(true)
			activity_text = "Work complete"
			pause_left = 0.0
		_:
			_animate("Idle_A")
			pause_left = 2.5

func _set_seated(value: bool) -> void:
	if seated == value:
		return
	seated = value
	navigation_agent.avoidance_enabled = not seated
	navigation_agent.velocity = Vector3.ZERO
	velocity = Vector3.ZERO
	if seated:
		path_settling_frames = 0
	visual.position.y = -0.28 if seated else 0.0
	visual.rotation.x = deg_to_rad(-3.0) if seated else 0.0
	if seated:
		_apply_seated_pose()

func _apply_seated_pose() -> void:
	player.seek(0.2, true)
	player.pause()
	var skeleton := visual.find_child("Skeleton3D", true, false) as Skeleton3D
	if not is_instance_valid(skeleton):
		return
	var upper_leg := Quaternion.from_euler(Vector3(deg_to_rad(-72.0), 0.0, 0.0))
	var lower_leg := Quaternion.from_euler(Vector3(deg_to_rad(102.0), 0.0, 0.0))
	var foot := Quaternion.from_euler(Vector3(deg_to_rad(-28.0), 0.0, 0.0))
	for side in ["l", "r"]:
		_set_bone_pose(skeleton, "upperleg.%s" % side, upper_leg)
		_set_bone_pose(skeleton, "lowerleg.%s" % side, lower_leg)
		_set_bone_pose(skeleton, "foot.%s" % side, foot)

func _set_bone_pose(skeleton: Skeleton3D, bone_name: String, rotation: Quaternion) -> void:
	var bone := skeleton.find_bone(bone_name)
	if bone >= 0:
		skeleton.set_bone_pose_rotation(bone, rotation)

func _cancel_retirement() -> void:
	retiring = false
	if retirement_tween:
		retirement_tween.kill()
	scale = Vector3.ONE

func _finish_retirement() -> void:
	retirement_finished.emit(agent_id)
	queue_free()

func _animate(clip: String) -> void:
	if player.has_animation(clip) and player.current_animation != clip:
		player.play(clip, 0.2)

func _stable_index(count: int) -> int:
	if count <= 0:
		return 0
	var value := 0
	for index in agent_id.length():
		value = (value * 31 + agent_id.unicode_at(index)) % 2147483647
	return value % count

func _destinations_for_status() -> Array[Vector3]:
	var destinations: Array[Vector3] = []
	var activities: Array = STATUS_ACTIVITIES.get(live_status, STATUS_ACTIVITIES.unknown)
	for spot in get_tree().get_nodes_in_group("interaction_spots"):
		if String(spot.activity) not in activities:
			continue
		if live_status == "idle" and String(spot.display_name) != "Town bench":
			continue
		var target: Vector3 = spot.global_position
		if live_status == "idle":
			var seed := _stable_seed()
			var angle := fmod(float(seed) * 2.39996323, TAU)
			var radius := 2.6 + float((seed / 17) % 3) * 1.35
			target += Vector3(cos(angle), 0.0, sin(angle)) * radius
		destinations.append(target)
	return destinations

func _stable_seed() -> int:
	var value := 0
	for index in agent_id.length():
		value = (value * 31 + agent_id.unicode_at(index)) % 2147483647
	return value

func _normalized_status(value: String) -> String:
	var normalized := value.to_lower()
	return normalized if normalized in STATUS_ACTIVITIES else "unknown"
