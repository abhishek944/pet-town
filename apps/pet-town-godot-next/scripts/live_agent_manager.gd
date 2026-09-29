class_name LiveAgentManager
extends Node3D

signal focus_agent_requested(id: String)
signal selection_changed(id: String, record: Dictionary)

const COMPANION := preload("res://scenes/agents/live_companion.tscn")
const MAYOR_CAMERA_FOCUS := preload("res://scripts/mayor_camera_focus.gd")
const MAYOR_ID := "pet-town-mayor"

var camera: WorkshopCamera
var navigation_region: NavigationRegion3D
var agents: Dictionary = {}
var records: Dictionary = {}
var selected_id := ""
var controlled_id := ""
var town_mode := "chill"
var mayor_focus_serial := -1
var mayor_state: Dictionary = {}

func configure(region: NavigationRegion3D, view: WorkshopCamera) -> void:
	navigation_region = region
	camera = view

func set_mode(value: String) -> void:
	town_mode = value
	visible = value == "chill"
	set_physics_process(visible)
	if not visible:
		release_control()
		selected_id = ""
		if is_instance_valid(camera):
			camera.stop_follow()
		selection_changed.emit("", {})

func apply_snapshot(snapshot: Dictionary) -> void:
	if int(snapshot.get("v", 0)) != 1 or String(snapshot.get("type", "")) != "snapshot":
		return
	var next: Dictionary = {}
	var mayor: Dictionary = snapshot.get("mayor", {}) if snapshot.get("mayor", {}) is Dictionary else {}
	if bool(mayor.get("active", false)):
		var name := String(mayor.get("name", "Mayor")).strip_edges()
		var status := "speaking" if bool(mayor.get("speaking", false)) else "listening" if bool(mayor.get("listening", false)) else "working" if bool(mayor.get("working", false)) else "idle"
		next[MAYOR_ID] = {"id": MAYOR_ID, "label": name if not name.is_empty() else "Mayor", "status": status, "source": "mayor", "listening": bool(mayor.get("listening", false)), "firstmate_mode": bool(mayor.get("firstmateOwned", false))}
	if bool(snapshot.get("available", false)):
		var incoming: Variant = snapshot.get("agents", [])
		if incoming is Array:
			for candidate in incoming:
				if not (candidate is Dictionary):
					continue
				var id := String(candidate.get("id", ""))
				var status := String(candidate.get("status", "unknown")).to_lower()
				if id.is_empty() or id == MAYOR_ID or status in ["idle", "unknown"]:
					continue
				next[id] = candidate
	for id in agents.keys():
		if not next.has(id):
			var leaving := agents[id] as LiveCompanion
			if is_instance_valid(leaving):
				leaving.queue_free()
			agents.erase(id)
	for id in next.keys():
		var record: Dictionary = next[id]
		var pet := agents.get(id) as LiveCompanion
		if not is_instance_valid(pet):
			pet = _spawn(id, record)
		pet.configure(id, String(record.get("label", "Agent")), String(record.get("status", "working")))
		pet.listening = bool(record.get("listening", false))
		if id == MAYOR_ID:
			pet.set_mayor_state(camera, mayor)
		pet.call("_refresh")
	records = next
	mayor_state = mayor
	if not records.has(selected_id):
		release_control()
		selected_id = ""
		if is_instance_valid(camera):
			camera.stop_follow()
		selection_changed.emit("", {})
	var serial := int(mayor.get("focusSerial", 0))
	if mayor_focus_serial < 0:
		mayor_focus_serial = serial # An earlier focus request is not a new Town event.
	elif serial != mayor_focus_serial:
		mayor_focus_serial = serial
		if serial > 0 and town_mode == "chill" and records.has(MAYOR_ID):
			focus_mayor()
func focus_mayor() -> void:
	if not records.has(MAYOR_ID) or not is_instance_valid(camera): return
	release_control()
	if follow_agent(MAYOR_ID):
		MAYOR_CAMERA_FOCUS.frame(camera, agents[MAYOR_ID] as LiveCompanion)
func _spawn(id: String, record: Dictionary) -> LiveCompanion:
	var pet := COMPANION.instantiate() as LiveCompanion
	pet.configure(id, String(record.get("label", "Agent")), String(record.get("status", "working")))
	add_child(pet)
	var seed := pet.call("_stable_seed") as int
	var angle := fmod(float(seed) * 0.017, TAU)
	var desired := Vector3(cos(angle) * 7.0, 6.0, sin(angle) * 7.0)
	if is_instance_valid(navigation_region):
		var map := navigation_region.get_navigation_map()
		if NavigationServer3D.map_get_iteration_id(map) > 0:
			desired = NavigationServer3D.map_get_closest_point(map, desired) + Vector3.UP * LiveCompanion.NAV_SPAWN_CLEARANCE
	pet.global_position = desired
	agents[id] = pet
	return pet

func follow_agent(id: String) -> bool:
	if town_mode != "chill":
		return false
	var pet := agents.get(id) as LiveCompanion
	if not is_instance_valid(pet) or not is_instance_valid(camera):
		return false
	if controlled_id != id:
		release_control()
	selected_id = id
	camera.follow(pet)
	selection_changed.emit(id, records.get(id, {}))
	return true

func stop_follow() -> void:
	release_control()
	selected_id = ""
	if is_instance_valid(camera):
		camera.stop_follow()
	selection_changed.emit("", {})

func toggle_follow(id: String) -> void:
	if selected_id == id and is_instance_valid(camera) and is_instance_valid(camera.followed):
		stop_follow()
	else:
		follow_agent(id)

func cycle_agent() -> void:
	var ids := records.keys()
	ids.sort()
	if ids.is_empty():
		return
	var index := ids.find(selected_id)
	follow_agent(String(ids[(index + 1) % ids.size()]))

func toggle_control() -> void:
	if not controlled_id.is_empty():
		release_control()
		return
	if town_mode == "chill" and agents.has(selected_id):
		controlled_id = selected_id
		(agents[selected_id] as LiveCompanion).set_manual_control(true)

func release_control() -> void:
	var pet := agents.get(controlled_id) as LiveCompanion
	if is_instance_valid(pet):
		pet.set_manual_control(false)
	controlled_id = ""

func focus_agent_in_desktop(id: String) -> void:
	if records.has(id):
		focus_agent_requested.emit(id)

func select_at(screen_position: Vector2) -> bool:
	if town_mode != "chill" or not is_instance_valid(camera):
		return false
	var origin := camera.project_ray_origin(screen_position)
	var ray := PhysicsRayQueryParameters3D.create(origin, origin + camera.project_ray_normal(screen_position) * 500.0, 38)
	ray.collide_with_areas = true
	var hit := get_world_3d().direct_space_state.intersect_ray(ray)
	if hit.is_empty():
		return false
	var collider := hit.collider as Node
	var pet := collider as LiveCompanion
	if pet == null and collider is Area3D:
		pet = collider.get_parent() as LiveCompanion
	return follow_agent(pet.agent_id) if is_instance_valid(pet) else false

func _physics_process(_delta: float) -> void:
	if controlled_id.is_empty():
		return
	var pet := agents.get(controlled_id) as LiveCompanion
	if not is_instance_valid(pet):
		controlled_id = ""
		return
	if not is_instance_valid(camera) or camera.followed != pet:
		stop_follow()
		return
	var direction := Vector3.ZERO
	if Input.is_key_pressed(KEY_W): direction.z -= 1.0
	if Input.is_key_pressed(KEY_S): direction.z += 1.0
	if Input.is_key_pressed(KEY_A): direction.x -= 1.0
	if Input.is_key_pressed(KEY_D): direction.x += 1.0
	pet.manual_direction = direction.normalized().rotated(Vector3.UP, camera.yaw) if is_instance_valid(camera) else direction.normalized()

func _unhandled_input(event: InputEvent) -> void:
	if town_mode != "chill":
		return
	if event is InputEventKey and event.pressed and not event.echo:
		var key := event as InputEventKey
		if key.alt_pressed and key.keycode == KEY_A:
			cycle_agent()
		elif key.keycode == KEY_C and not key.alt_pressed and not key.ctrl_pressed and not key.meta_pressed:
			toggle_control()
		elif key.keycode == KEY_ESCAPE:
			stop_follow()
