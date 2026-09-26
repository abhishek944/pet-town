class_name LiveCompanion
extends CharacterBody3D

const MODELS := [
	preload("res://assets/companions/Knight.glb"),
	preload("res://assets/companions/Ranger.glb"),
	preload("res://assets/companions/Mage.glb"),
]

@onready var navigation_agent: NavigationAgent3D = $NavigationAgent3D
@onready var caption: Label3D = $Caption
@onready var visual: Node3D = $Visual

var agent_id := ""
var display_name := "Agent"
var live_status := "working"
var listening := false
var manual_direction := Vector3.ZERO
var manually_controlled := false
var walk_speed := 2.0
var roam_origin := Vector3.ZERO
var roam_radius := 22.0
var pause_left := 0.0
var roam_index := 0

func configure(id: String, label: String, status: String) -> void:
	agent_id = id
	display_name = label
	live_status = status
	if is_node_ready():
		_refresh()

func _ready() -> void:
	add_to_group("live_agents")
	var model_index := 0 if agent_id == "pet-town-mayor" else _stable_seed() % MODELS.size()
	var model := MODELS[model_index].instantiate() as Node3D
	model.name = "Model"
	model.scale = Vector3.ONE * 0.7
	visual.add_child(model)
	$Visual/Body.hide()
	_refresh()
	call_deferred("_begin_roam")

func _physics_process(delta: float) -> void:
	if manually_controlled:
		_walk(manual_direction, delta)
		return
	if pause_left > 0.0:
		pause_left -= delta
		if pause_left <= 0.0:
			_choose_destination()
		return
	if NavigationServer3D.map_get_iteration_id(navigation_agent.get_navigation_map()) == 0:
		return
	if navigation_agent.is_navigation_finished():
		pause_left = 1.5 + float(roam_index % 3)
		return
	var next := navigation_agent.get_next_path_position() - global_position
	next.y = 0.0
	_walk(next.normalized() if next.length() > 0.05 else Vector3.ZERO, delta)

func set_manual_control(value: bool) -> void:
	manually_controlled = value
	manual_direction = Vector3.ZERO
	if value:
		navigation_agent.target_position = global_position
	else:
		_choose_destination()

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
		global_position = nearest
		roam_origin = nearest
	_choose_destination()

func _choose_destination() -> void:
	if NavigationServer3D.map_get_iteration_id(navigation_agent.get_navigation_map()) == 0:
		return
	roam_index += 1
	var seed := _stable_seed()
	var angle := fmod(float(seed) * 0.019 + float(roam_index) * 2.399963, TAU)
	var radius := 5.0 + float((seed + roam_index * 7) % 15)
	var candidate := roam_origin + Vector3(cos(angle), 0.0, sin(angle)) * minf(radius, roam_radius)
	var nearest := NavigationServer3D.map_get_closest_point(navigation_agent.get_navigation_map(), candidate)
	navigation_agent.target_position = nearest
	if nearest.distance_to(global_position) < 1.0:
		pause_left = 1.0

func _walk(direction: Vector3, delta: float) -> void:
	var motion := direction * walk_speed
	if manually_controlled and direction.length_squared() > 0.001:
		var next := global_position + motion * delta
		var nearest := NavigationServer3D.map_get_closest_point(navigation_agent.get_navigation_map(), next)
		if next.distance_to(nearest) > 0.8:
			motion = Vector3.ZERO
	velocity.x = motion.x
	velocity.z = motion.z
	velocity.y = 0.0 if is_on_floor() else velocity.y - 18.0 * delta
	move_and_slide()
	if motion.length_squared() > 0.001:
		visual.rotation.y = lerp_angle(visual.rotation.y, atan2(motion.x, motion.z), minf(delta * 8.0, 1.0))

func _refresh() -> void:
	caption.text = display_name + ("  •  Listening" if listening else "")
	var color := Color("f1cb83") if agent_id == "pet-town-mayor" else Color("a8d9c4")
	if live_status == "blocked":
		color = Color("e5a27e")
	$Visual/Body.material_override = StandardMaterial3D.new()
	$Visual/Body.material_override.albedo_color = color

func _stable_seed() -> int:
	var value := 0
	for index in agent_id.length():
		value = (value * 31 + agent_id.unicode_at(index)) % 2147483647
	return value
