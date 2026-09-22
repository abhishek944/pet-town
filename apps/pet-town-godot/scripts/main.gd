extends Node3D
## Godot renderer for the Pet Town JSONL bridge. The helper remains the agent authority.

const FOLLOW_RESPONSE := 6.0
const FOLLOW_HEIGHT_RESPONSE := 2.0
const FOLLOW_OFFSET := Vector3(0.0, 0.8, 0.0)
const MIN_CAMERA_DISTANCE := 24.0
const MAX_CAMERA_DISTANCE := 440.0
const WIDESCREEN_OVERVIEW_DISTANCE := 205.0
const WIDESCREEN_ASPECT := 1.6
const DETAILS_WIDTH := 400.0
const DRAG_NONE := 0
const DRAG_PAN := 1
const DRAG_ORBIT := 2
const COMPANION_SCENE := preload("res://scenes/companion.tscn")
const MODEL_SCENES := [
	preload("res://assets/kaykit/Knight.glb"),
	preload("res://assets/kaykit/Ranger.glb"),
	preload("res://assets/kaykit/Rogue.glb"),
	preload("res://assets/kaykit/Barbarian.glb"),
	preload("res://assets/kaykit/Mage.glb"),
	preload("res://assets/kaykit/Rogue_Hooded.glb"),
	preload("res://assets/kaykit/skeletons/Skeleton_Mage.glb"),
	preload("res://assets/kaykit/skeletons/Skeleton_Minion.glb"),
	preload("res://assets/kaykit/skeletons/Skeleton_Rogue.glb"),
	preload("res://assets/kaykit/skeletons/Skeleton_Warrior.glb"),
]
const MODEL_NAMES := [
	"Knight", "Ranger", "Rogue", "Barbarian", "Mage", "Hooded Rogue",
	"Skeleton Mage", "Skeleton Minion", "Skeleton Rogue", "Skeleton Warrior",
]

@onready var camera: Camera3D = $OrbitCamera
@onready var overview_target: Vector3 = $CameraFocus.position
@onready var pets_root: Node3D = $LiveAgents
@onready var town_ui: CanvasLayer = $TownUI

var camera_target := Vector3.ZERO
var selected_pet: CharacterBody3D
var selected_id := ""
var following_pet := false
var click_origin := Vector2.ZERO
var camera_yaw := deg_to_rad(90.0)
var camera_pitch := deg_to_rad(43.0)
var camera_distance := WIDESCREEN_OVERVIEW_DISTANCE
var camera_dragging := false
var camera_drag_mode := DRAG_NONE
var camera_at_overview := true
var camera_drag_position := Vector2.ZERO

var pets_by_id := {}
var agents_by_id := {}
var stable_agent_ids: Array[String] = []
var bridge_pid := -1
var bridge_stdin: FileAccess
var bridge_stdout: FileAccess
var bridge_retry_at := 0
var received_snapshot := false

var ui_root: Control
var notice: Label
var details_panel: Panel
var details_name: Label
var details_subtitle: Label
var details_status: Label
var details_source: Label
var details_camera: Label
var details_appearance: Label
var details_action: Button
var details_close: Button
var avatar_reset: Button
var avatar_frame: Panel
var avatar_container: SubViewportContainer
var avatar_viewport: SubViewport
var avatar_root: Node3D
var avatar_model: Node3D
var avatar_yaw := deg_to_rad(-18.0)
var avatar_pitch := deg_to_rad(-8.0)
var avatar_dragging := false
var avatar_drag_position := Vector2.ZERO
var help_scrim: ColorRect
var help_board: Panel
var help_close: Button

func _ready() -> void:
	camera_target = overview_target
	camera_distance = _overview_distance()
	get_viewport().size_changed.connect(_on_viewport_size_changed)
	get_window().focus_entered.connect(_on_window_focus_entered)
	get_window().focus_exited.connect(_on_window_focus_exited)
	_build_ui()
	_layout_ui()
	_update_camera()
	_launch_bridge()

func _exit_tree() -> void:
	_send_bridge({"v": 1, "type": "activeChanged", "active": false})
	_send_bridge({"v": 1, "type": "shutdown"})

func _process(delta: float) -> void:
	_poll_bridge()
	if bridge_pid <= 0 and Time.get_ticks_msec() >= bridge_retry_at:
		_launch_bridge()
	if following_pet and is_instance_valid(selected_pet):
		var rendered_target := selected_pet.get_global_transform_interpolated().origin + FOLLOW_OFFSET
		var height := lerpf(camera_target.y, rendered_target.y, 1.0 - exp(-FOLLOW_HEIGHT_RESPONSE * delta))
		camera_target = camera_target.lerp(rendered_target, 1.0 - exp(-FOLLOW_RESPONSE * delta))
		camera_target.y = height
	if not _help_is_open():
		if Input.is_action_pressed("camera_left"):
			camera_yaw -= delta * 0.8
		if Input.is_action_pressed("camera_right"):
			camera_yaw += delta * 0.8
		if Input.is_action_pressed("camera_up"):
			camera_pitch = clampf(camera_pitch + delta * 0.55, deg_to_rad(18.0), deg_to_rad(66.0))
		if Input.is_action_pressed("camera_down"):
			camera_pitch = clampf(camera_pitch - delta * 0.55, deg_to_rad(18.0), deg_to_rad(66.0))
	_update_camera()
	_refresh_details()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		var key := event as InputEventKey
		if key.alt_pressed and key.keycode == KEY_H:
			_toggle_help(not _help_is_open())
			get_viewport().set_input_as_handled()
			return
		if key.keycode == KEY_ESCAPE:
			if _help_is_open():
				_toggle_help(false)
			elif _details_are_open():
				_close_details()
			elif following_pet:
				following_pet = false
			get_viewport().set_input_as_handled()
			return
		if _help_is_open():
			return
		if key.alt_pressed and key.keycode == KEY_A:
			_cycle_agent()
		elif key.keycode == KEY_R:
			_reset_camera()
		elif key.keycode == KEY_F:
			_toggle_fullscreen()
		elif key.keycode == KEY_EQUAL:
			_apply_zoom(0.84)
		elif key.keycode == KEY_MINUS:
			_apply_zoom(1.18)
	elif _help_is_open():
		return
	elif event is InputEventMouseButton:
		var button := event as InputEventMouseButton
		if button.button_index == MOUSE_BUTTON_RIGHT and button.pressed:
			camera_dragging = false
			camera_drag_mode = DRAG_NONE
			_select_agent_at(button.position, true)
			return
		if button.button_index in [MOUSE_BUTTON_LEFT, MOUSE_BUTTON_MIDDLE]:
			camera_dragging = button.pressed
			if button.pressed:
				click_origin = button.position
				camera_drag_position = button.position
				camera_drag_mode = DRAG_ORBIT if button.alt_pressed or button.button_index == MOUSE_BUTTON_MIDDLE else DRAG_PAN
			else:
				if button.button_index == MOUSE_BUTTON_LEFT and button.position.distance_to(click_origin) < 6.0:
					_select_agent_at(button.position, false)
				camera_drag_mode = DRAG_NONE
		elif button.pressed and button.button_index == MOUSE_BUTTON_WHEEL_UP:
			_apply_zoom(0.88)
		elif button.pressed and button.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_apply_zoom(1.14)
	elif event is InputEventMagnifyGesture:
		_apply_zoom(1.0 / maxf((event as InputEventMagnifyGesture).factor, 0.01))
	elif event is InputEventMouseMotion and camera_dragging:
		var motion := event as InputEventMouseMotion
		var drag_delta := motion.position - camera_drag_position
		camera_drag_position = motion.position
		if camera_drag_mode == DRAG_ORBIT or motion.alt_pressed:
			camera_yaw += drag_delta.x * 0.007
			camera_pitch = clampf(camera_pitch + drag_delta.y * 0.006, deg_to_rad(18.0), deg_to_rad(66.0))
		else:
			_pan_camera(drag_delta)

func _launch_bridge() -> void:
	var bridge_path := _bridge_path()
	if bridge_path.is_empty():
		bridge_retry_at = Time.get_ticks_msec() + 3000
		_set_notice("Live-agent connection unavailable\nRetrying…")
		return
	var pipe := OS.execute_with_pipe(bridge_path, ["--town-bridge"])
	if pipe.is_empty() or not pipe.has("pid"):
		bridge_retry_at = Time.get_ticks_msec() + 3000
		_set_notice("Live-agent connection unavailable\nRetrying…")
		return
	bridge_pid = int(pipe.pid)
	bridge_stdin = pipe.get("stdio") as FileAccess
	bridge_stdout = bridge_stdin
	if bridge_pid <= 0 or bridge_stdin == null or bridge_stdout == null:
		bridge_pid = -1
		bridge_retry_at = Time.get_ticks_msec() + 3000
		_set_notice("Live-agent connection unavailable\nRetrying…")
		return
	_send_bridge({"v": 1, "type": "activeChanged", "active": true})
	_set_notice("Connecting to live agents…")

func _bridge_path() -> String:
	var configured := OS.get_environment("PET_TOWN_BRIDGE_BIN")
	if not configured.is_empty():
		return configured
	var executable_dir := OS.get_executable_path().get_base_dir()
	var candidates := [
		executable_dir.path_join("pet-town"),
		executable_dir.path_join("Pet Town"),
		executable_dir.path_join("pet-town-bridge"),
		"pet-town",
	]
	for candidate in candidates:
		if candidate == "pet-town" or FileAccess.file_exists(candidate):
			return candidate
	return ""

func _poll_bridge() -> void:
	if bridge_pid <= 0 or bridge_stdout == null:
		return
	if not OS.is_process_running(bridge_pid):
		bridge_pid = -1
		bridge_stdin = null
		bridge_stdout = null
		bridge_retry_at = Time.get_ticks_msec() + 3000
		received_snapshot = false
		_reconcile_agents([])
		_set_notice("Live-agent connection unavailable\nRetrying…")
		return
	while bridge_stdout.get_position() < bridge_stdout.get_length():
		var line := bridge_stdout.get_line().strip_edges()
		if not line.is_empty():
			_handle_bridge_line(line)

func _handle_bridge_line(line: String) -> void:
	var snapshot = JSON.parse_string(line)
	if not (snapshot is Dictionary) or int(snapshot.get("v", 0)) != 1 or snapshot.get("type", "") != "snapshot":
		return
	received_snapshot = true
	if not bool(snapshot.get("available", false)):
		_reconcile_agents([])
		_set_notice("Live agents are unavailable\nRetrying…")
		return
	var agents: Array = []
	for candidate in snapshot.get("agents", []):
		if candidate is Dictionary and candidate.has("id") and candidate.has("label"):
			agents.append(candidate)
	_reconcile_agents(agents)
	_set_notice("No live agents right now" if agents.is_empty() else "")

func _reconcile_agents(records: Array) -> void:
	var current := {}
	for record in records:
		var id := String(record.get("id", ""))
		if id.is_empty():
			continue
		current[id] = record
		var pet: CharacterBody3D = pets_by_id.get(id)
		if is_instance_valid(pet):
			pet.update_live_status(String(record.get("status", "unknown")), String(record.get("label", "")))
		else:
			_spawn_pet(id, record)
	agents_by_id = current
	for id in pets_by_id.keys():
		if not current.has(id):
			var leaving: CharacterBody3D = pets_by_id[id]
			if is_instance_valid(leaving):
				if id == selected_id:
					_show_agent_ended()
				leaving.begin_retirement()
	stable_agent_ids = []
	for id in current.keys():
		stable_agent_ids.append(id)
	stable_agent_ids.sort()

func _spawn_pet(id: String, record: Dictionary) -> void:
	var pet := COMPANION_SCENE.instantiate() as CharacterBody3D
	var model_index := _model_index(id)
	pet.configure(id, String(record.get("label", "")), String(record.get("status", "unknown")), MODEL_NAMES[model_index])
	var model := MODEL_SCENES[model_index].instantiate() as Node3D
	model.name = "Model"
	pet.get_node("Visual").add_child(model)
	pets_root.add_child(pet)
	pet.global_position = _spawn_position(_stable_number(id))
	pet.retirement_finished.connect(_on_pet_retired.bind(pet))
	pets_by_id[id] = pet

func _on_pet_retired(id: String, pet: CharacterBody3D) -> void:
	if pets_by_id.get(id) == pet:
		pets_by_id.erase(id)
	if id == selected_id and not agents_by_id.has(id):
		selected_id = ""
		selected_pet = null
		following_pet = false
		if _details_are_open():
			_close_details()

func _select_agent_at(screen_position: Vector2, open_details: bool) -> void:
	var origin := camera.project_ray_origin(screen_position)
	var ray := PhysicsRayQueryParameters3D.create(origin, origin + camera.project_ray_normal(screen_position) * 1000.0, 2)
	var hit := get_world_3d().direct_space_state.intersect_ray(ray)
	if hit.is_empty() or not hit.collider.is_in_group("live_agents"):
		return
	_follow_pet(hit.collider as CharacterBody3D)
	if open_details:
		_open_details()

func _follow_pet(pet: CharacterBody3D) -> void:
	if not is_instance_valid(pet):
		return
	selected_pet = pet
	selected_id = pet.agent_id
	following_pet = true
	camera_at_overview = false
	camera_distance = 25.0
	camera_target = pet.get_global_transform_interpolated().origin + FOLLOW_OFFSET

func _cycle_agent() -> void:
	if stable_agent_ids.is_empty():
		return
	var index := stable_agent_ids.find(selected_id)
	var next_id := stable_agent_ids[(index + 1) % stable_agent_ids.size()]
	var pet: CharacterBody3D = pets_by_id.get(next_id)
	if is_instance_valid(pet):
		_follow_pet(pet)

func _open_details() -> void:
	if selected_id.is_empty():
		return
	details_panel.visible = true
	_refresh_details(true)

func _close_details() -> void:
	details_panel.visible = false
	avatar_dragging = false

func _refresh_details(force_avatar := false) -> void:
	if not _details_are_open():
		return
	var record: Dictionary = agents_by_id.get(selected_id, {})
	var ended := record.is_empty()
	var label: String = String(record.get("label", "")) if not ended else (selected_pet.display_name if is_instance_valid(selected_pet) else "Agent ended")
	var status := "ended" if ended else String(record.get("status", "unknown")).to_lower()
	details_name.text = label
	details_subtitle.text = "Town resident" if ended else "%s resident" % _appearance_for(selected_id)
	details_status.text = _display_status(status)
	details_status.modulate = _status_color(status)
	details_source.text = "—" if ended else _display_source(String(record.get("source", "")))
	details_camera.text = "Following" if following_pet else "Selected"
	details_appearance.text = _appearance_for(selected_id)
	details_action.disabled = ended or String(record.get("source", "")).to_lower() != "herdr"
	details_action.text = "Agent ended" if ended else "Open in Herdr"
	if force_avatar and not ended:
		_load_avatar(_model_index(selected_id))

func _show_agent_ended() -> void:
	if _details_are_open():
		_refresh_details()
	following_pet = false

func _open_in_herdr() -> void:
	var record: Dictionary = agents_by_id.get(selected_id, {})
	if record.is_empty() or String(record.get("source", "")).to_lower() != "herdr":
		_refresh_details()
		return
	_send_bridge({"v": 1, "type": "focusAgent", "id": selected_id})

func _send_bridge(message: Dictionary) -> void:
	if bridge_stdin == null:
		return
	bridge_stdin.store_string(JSON.stringify(message) + "\n")
	bridge_stdin.flush()

func _on_window_focus_entered() -> void:
	_send_bridge({"v": 1, "type": "activeChanged", "active": true})

func _on_window_focus_exited() -> void:
	_send_bridge({"v": 1, "type": "activeChanged", "active": false})

func _reset_camera() -> void:
	following_pet = false
	camera_yaw = deg_to_rad(90.0)
	camera_pitch = deg_to_rad(43.0)
	camera_at_overview = true
	camera_distance = _overview_distance()
	camera_target = overview_target

func _update_camera() -> void:
	var horizontal_distance := camera_distance * cos(camera_pitch)
	var offset := Vector3(cos(camera_yaw) * horizontal_distance, sin(camera_pitch) * camera_distance, sin(camera_yaw) * horizontal_distance)
	camera.position = camera_target + offset
	camera.look_at(camera_target, Vector3.UP)

func _apply_zoom(multiplier: float) -> void:
	camera_at_overview = false
	camera_distance = clampf(camera_distance * multiplier, MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE)

func _pan_camera(drag_delta: Vector2) -> void:
	following_pet = false
	camera_at_overview = false
	var world_units_per_pixel := camera_distance / maxf(get_viewport().get_visible_rect().size.y, 1.0) * 1.55
	var screen_right := Vector3(sin(camera_yaw), 0.0, -cos(camera_yaw))
	var screen_forward := Vector3(-cos(camera_yaw), 0.0, -sin(camera_yaw))
	camera_target -= screen_right * drag_delta.x * world_units_per_pixel
	camera_target += screen_forward * drag_delta.y * world_units_per_pixel
	camera_target.x = clampf(camera_target.x, -72.0, 72.0)
	camera_target.z = clampf(camera_target.z, -66.0, 78.0)
	camera_target.y = 1.5

func _overview_distance() -> float:
	var viewport_size := get_viewport().get_visible_rect().size
	var aspect := viewport_size.x / maxf(viewport_size.y, 1.0)
	return clampf(WIDESCREEN_OVERVIEW_DISTANCE * maxf(1.0, WIDESCREEN_ASPECT / aspect), WIDESCREEN_OVERVIEW_DISTANCE, MAX_CAMERA_DISTANCE)

func _on_viewport_size_changed() -> void:
	_layout_ui()
	if camera_at_overview:
		camera_distance = _overview_distance()

func _toggle_fullscreen() -> void:
	var mode := DisplayServer.window_get_mode()
	DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_MAXIMIZED if mode in [DisplayServer.WINDOW_MODE_FULLSCREEN, DisplayServer.WINDOW_MODE_EXCLUSIVE_FULLSCREEN] else DisplayServer.WINDOW_MODE_FULLSCREEN)

func _model_index(id: String) -> int:
	return _stable_number(id) % MODEL_SCENES.size()

func _stable_number(value: String) -> int:
	var number := 0
	for index in value.length():
		number = (number * 31 + value.unicode_at(index)) % 2147483647
	return number

func _spawn_position(index: int) -> Vector3:
	var points := [Vector3(-3.0, 2.0, 1.0), Vector3(2.0, 1.85, -4.0), Vector3(3.1, 2.36, 8.0), Vector3(-5.0, 2.14, 4.0), Vector3(1.0, 2.1, 3.0), Vector3(5.0, 1.8, -4.0)]
	var slot := index % 60
	var base: Vector3 = points[slot % points.size()]
	var ring := slot / points.size()
	return base + Vector3(cos(float(slot) * 2.4) * ring * 1.5, 0.0, sin(float(slot) * 2.4) * ring * 1.5)

func _display_status(status: String) -> String:
	return {"working": "Working", "blocked": "Blocked", "idle": "Idle", "done": "Done", "unknown": "Unknown", "ended": "Agent ended"}.get(status, "Unknown")

func _display_source(source: String) -> String:
	return source.capitalize() if not source.is_empty() else "Unknown"

func _appearance_for(id: String) -> String:
	return MODEL_NAMES[_model_index(id)] if not id.is_empty() else "—"

func _status_color(status: String) -> Color:
	return {"working": Color("70d287"), "blocked": Color("e49b5b"), "idle": Color("b9c1b8"), "done": Color("91c9e8"), "unknown": Color("b9a77a"), "ended": Color("b9c1b8")}.get(status, Color("b9c1b8"))

func _set_notice(message: String) -> void:
	notice.text = message
	notice.visible = not message.is_empty()

func _details_are_open() -> bool:
	return is_instance_valid(details_panel) and details_panel.visible

func _help_is_open() -> bool:
	return is_instance_valid(help_board) and help_board.visible

func _build_ui() -> void:
	ui_root = Control.new()
	ui_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	town_ui.add_child(ui_root)
	notice = Label.new()
	notice.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	notice.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	notice.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	notice.add_theme_font_size_override("font_size", 16)
	notice.add_theme_color_override("font_color", Color("f8f5ed"))
	notice.add_theme_stylebox_override("normal", _style(Color("18201bdf"), 12, Color("ffffff2b")))
	notice.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui_root.add_child(notice)
	_build_details_panel()
	_build_help_board()

func _build_details_panel() -> void:
	details_panel = Panel.new()
	details_panel.add_theme_stylebox_override("panel", _style(Color("090c0a"), 0))
	details_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	details_panel.visible = false
	ui_root.add_child(details_panel)
	_setup_avatar_viewer()
	var eyebrow := Label.new()
	eyebrow.text = "LIVE AGENT"
	eyebrow.position = Vector2(20.0, 19.0)
	eyebrow.size = Vector2(180.0, 28.0)
	eyebrow.add_theme_font_size_override("font_size", 12)
	eyebrow.add_theme_color_override("font_color", Color("d5a75d"))
	details_panel.add_child(eyebrow)
	details_close = Button.new()
	details_close.text = "×"
	details_close.tooltip_text = "Close agent details"
	details_close.add_theme_font_size_override("font_size", 24)
	details_close.add_theme_stylebox_override("normal", _style(Color("00000075"), 10))
	details_close.pressed.connect(_close_details)
	details_panel.add_child(details_close)
	avatar_reset = Button.new()
	avatar_reset.text = "Reset view"
	avatar_reset.tooltip_text = "Reset the live 3D avatar view"
	avatar_reset.add_theme_font_size_override("font_size", 13)
	avatar_reset.add_theme_stylebox_override("normal", _style(Color("00000075"), 10, Color("ffffff28"), 1))
	avatar_reset.pressed.connect(_reset_avatar_view)
	details_panel.add_child(avatar_reset)
	var content := VBoxContainer.new()
	content.add_theme_constant_override("separation", 7)
	details_panel.add_child(content)
	details_name = Label.new()
	details_name.add_theme_font_size_override("font_size", 28)
	details_name.add_theme_color_override("font_color", Color("f8f5ed"))
	details_name.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(details_name)
	details_subtitle = Label.new()
	details_subtitle.add_theme_font_size_override("font_size", 14)
	details_subtitle.add_theme_color_override("font_color", Color("b9c1b8"))
	content.add_child(details_subtitle)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	content.add_child(grid)
	details_status = _detail_card(grid, "Status")
	details_source = _detail_card(grid, "Source")
	details_camera = _detail_card(grid, "Camera")
	details_appearance = _detail_card(grid, "Appearance")
	details_action = Button.new()
	details_action.text = "Open in Herdr"
	details_action.tooltip_text = "Open the current live agent in Herdr"
	details_action.add_theme_font_size_override("font_size", 16)
	details_action.add_theme_stylebox_override("normal", _style(Color("80531fd9"), 12, Color("d9a64c"), 1))
	details_action.add_theme_stylebox_override("disabled", _style(Color("30342f"), 12, Color("ffffff24"), 1))
	details_action.pressed.connect(_open_in_herdr)
	details_panel.add_child(details_action)

func _detail_card(grid: GridContainer, title: String) -> Label:
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(0, 64)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.add_theme_stylebox_override("panel", _style(Color("ffffff08"), 10, Color("ffffff26"), 1))
	grid.add_child(card)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 4)
	box.add_theme_constant_override("margin_left", 12)
	card.add_child(box)
	var label := Label.new()
	label.text = title
	label.add_theme_font_size_override("font_size", 11)
	label.add_theme_color_override("font_color", Color("aeb7ad"))
	box.add_child(label)
	var value := Label.new()
	value.add_theme_font_size_override("font_size", 15)
	value.add_theme_color_override("font_color", Color("f8f5ed"))
	value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(value)
	return value

func _setup_avatar_viewer() -> void:
	avatar_frame = Panel.new()
	avatar_frame.clip_contents = true
	avatar_frame.add_theme_stylebox_override("panel", _style(Color("111a14"), 14, Color("ffffff30"), 1))
	details_panel.add_child(avatar_frame)
	avatar_container = SubViewportContainer.new()
	avatar_container.stretch = true
	avatar_container.focus_mode = Control.FOCUS_ALL
	avatar_container.tooltip_text = "Live 3D avatar viewer. Drag to rotate. Arrow keys rotate. Press R to reset."
	avatar_container.gui_input.connect(_on_avatar_gui_input)
	avatar_frame.add_child(avatar_container)
	avatar_viewport = SubViewport.new()
	avatar_viewport.transparent_bg = false
	avatar_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	avatar_viewport.world_3d = World3D.new()
	avatar_container.add_child(avatar_viewport)
	avatar_root = Node3D.new()
	avatar_viewport.add_child(avatar_root)
	var camera_3d := Camera3D.new()
	camera_3d.current = true
	camera_3d.position = Vector3(0.0, 0.8, 6.2)
	camera_3d.fov = 35.0
	avatar_viewport.add_child(camera_3d)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-42.0, -35.0, 0.0)
	light.light_color = Color("ffd8a3")
	light.light_energy = 1.4
	avatar_viewport.add_child(light)
	var fill := OmniLight3D.new()
	fill.position = Vector3(-2.0, 1.2, 2.0)
	fill.light_color = Color("8fa682")
	fill.light_energy = 1.2
	avatar_viewport.add_child(fill)
	var environment := WorldEnvironment.new()
	var environment_resource := Environment.new()
	environment_resource.background_mode = Environment.BG_COLOR
	environment_resource.background_color = Color("1d281f")
	environment_resource.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment_resource.ambient_light_color = Color("a5b595")
	environment_resource.ambient_light_energy = 0.7
	environment.environment = environment_resource
	avatar_viewport.add_child(environment)

func _load_avatar(model_index: int) -> void:
	if is_instance_valid(avatar_model):
		avatar_model.queue_free()
	avatar_model = MODEL_SCENES[model_index].instantiate() as Node3D
	avatar_root.add_child(avatar_model)
	avatar_root.scale = Vector3(1.12, 1.12, 1.12)
	avatar_root.position = Vector3(0.0, -0.62, 0.0)
	_reset_avatar_view()

func _reset_avatar_view() -> void:
	avatar_yaw = deg_to_rad(-18.0)
	avatar_pitch = deg_to_rad(-8.0)
	if is_instance_valid(avatar_root):
		avatar_root.rotation = Vector3(avatar_pitch, avatar_yaw, 0.0)

func _on_avatar_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		avatar_dragging = event.pressed
		avatar_drag_position = event.position
		avatar_container.grab_focus()
		avatar_container.accept_event()
	elif event is InputEventMouseMotion and avatar_dragging:
		var motion := event as InputEventMouseMotion
		var delta := motion.position - avatar_drag_position
		avatar_drag_position = motion.position
		avatar_yaw += delta.x * 0.012
		avatar_pitch = clampf(avatar_pitch + delta.y * 0.008, deg_to_rad(-30.0), deg_to_rad(20.0))
		avatar_root.rotation = Vector3(avatar_pitch, avatar_yaw, 0.0)
		avatar_container.accept_event()
	elif event is InputEventKey and event.pressed:
		if event.keycode == KEY_LEFT:
			avatar_yaw -= 0.14
		elif event.keycode == KEY_RIGHT:
			avatar_yaw += 0.14
		elif event.keycode == KEY_UP:
			avatar_pitch = clampf(avatar_pitch - 0.1, deg_to_rad(-30.0), deg_to_rad(20.0))
		elif event.keycode == KEY_DOWN:
			avatar_pitch = clampf(avatar_pitch + 0.1, deg_to_rad(-30.0), deg_to_rad(20.0))
		elif event.keycode == KEY_R:
			_reset_avatar_view()
		else:
			return
		avatar_root.rotation = Vector3(avatar_pitch, avatar_yaw, 0.0)
		avatar_container.accept_event()

func _build_help_board() -> void:
	help_scrim = ColorRect.new()
	help_scrim.color = Color("0508069a")
	help_scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	help_scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	help_scrim.visible = false
	ui_root.add_child(help_scrim)
	help_board = Panel.new()
	help_board.add_theme_stylebox_override("panel", _style(Color("0b0f0de8"), 22, Color("ffffff38"), 1))
	help_board.mouse_filter = Control.MOUSE_FILTER_STOP
	help_board.visible = false
	ui_root.add_child(help_board)
	help_close = Button.new()
	help_close.text = "×"
	help_close.tooltip_text = "Close town controls"
	help_close.add_theme_font_size_override("font_size", 24)
	help_close.add_theme_stylebox_override("normal", _style(Color("ffffff12"), 10))
	help_close.pressed.connect(func() -> void: _toggle_help(false))
	help_board.add_child(help_close)
	var header := VBoxContainer.new()
	help_board.add_child(header)
	var eyebrow := Label.new()
	eyebrow.text = "GRAND MOONHAVEN"
	eyebrow.add_theme_font_size_override("font_size", 12)
	eyebrow.add_theme_color_override("font_color", Color("d6aa61"))
	header.add_child(eyebrow)
	var title := Label.new()
	title.text = "Town controls"
	title.add_theme_font_size_override("font_size", 34)
	title.add_theme_color_override("font_color", Color("f8f5ed"))
	header.add_child(title)
	var subtitle := Label.new()
	subtitle.text = "Everything you need, only when you ask for it."
	subtitle.add_theme_font_size_override("font_size", 16)
	subtitle.add_theme_color_override("font_color", Color("b8c0b7"))
	header.add_child(subtitle)
	var groups := HBoxContainer.new()
	groups.add_theme_constant_override("separation", 14)
	help_board.add_child(groups)
	_help_group(groups, "EXPLORE THE TOWN", [["Drag", "Move across town"], ["Option + Drag", "Orbit camera"], ["Pinch", "Zoom"], ["R", "Town overview"]])
	_help_group(groups, "LIVE AGENTS", [["Click", "Follow pet"], ["Right-click", "Open details"], ["Option + A", "Next agent"], ["Esc", "Close or release"]])
	_help_group(groups, "VIEW", [["F", "Fullscreen"], ["Option + H", "Toggle help"], ["+ / −", "Zoom fallback"]])
	var footer := Label.new()
	footer.text = "Press Option+H or Escape to close"
	footer.add_theme_font_size_override("font_size", 13)
	footer.add_theme_color_override("font_color", Color("9ca59b"))
	help_board.add_child(footer)

func _help_group(parent: HBoxContainer, title: String, rows: Array) -> void:
	var panel := PanelContainer.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.add_theme_stylebox_override("panel", _style(Color("ffffff07"), 12, Color("ffffff2b"), 1))
	parent.add_child(panel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	panel.add_child(box)
	var heading := Label.new()
	heading.text = title
	heading.add_theme_font_size_override("font_size", 13)
	heading.add_theme_color_override("font_color", Color("d6aa61"))
	box.add_child(heading)
	for row in rows:
		var key := Label.new()
		key.text = row[0]
		key.add_theme_font_size_override("font_size", 13)
		key.add_theme_color_override("font_color", Color("f8f5ed"))
		key.add_theme_stylebox_override("normal", _style(Color("ffffff12"), 6, Color("ffffff44"), 1))
		box.add_child(key)
		var description := Label.new()
		description.text = row[1]
		description.add_theme_font_size_override("font_size", 15)
		description.add_theme_color_override("font_color", Color("dce1da"))
		box.add_child(description)

func _toggle_help(show: bool) -> void:
	help_scrim.visible = show
	help_board.visible = show
	if show:
		help_close.grab_focus()

func _layout_ui() -> void:
	if not is_instance_valid(ui_root):
		return
	var size := get_viewport().get_visible_rect().size
	notice.position = Vector2((size.x - 360.0) * 0.5, (size.y - 86.0) * 0.5)
	notice.size = Vector2(360.0, 86.0)
	var panel_width := minf(DETAILS_WIDTH, size.x * 0.9)
	details_panel.position = Vector2(size.x - panel_width - 1.0, -1.0)
	details_panel.size = Vector2(panel_width + 2.0, size.y + 2.0)
	details_close.position = Vector2(panel_width - 58.0, 10.0)
	details_close.size = Vector2(44.0, 44.0)
	var viewer_height := minf(338.0, size.y * 0.43)
	avatar_frame.position = Vector2(16.0, 64.0)
	avatar_frame.size = Vector2(panel_width - 32.0, viewer_height)
	avatar_container.position = Vector2(1.0, 1.0)
	avatar_container.size = avatar_frame.size - Vector2(2.0, 2.0)
	avatar_reset.position = Vector2(panel_width - 132.0, 78.0)
	avatar_reset.size = Vector2(104.0, 40.0)
	var content := details_name.get_parent() as VBoxContainer
	content.position = Vector2(20.0, avatar_frame.position.y + viewer_height + 14.0)
	content.size = Vector2(panel_width - 40.0, maxf(180.0, size.y - content.position.y - 94.0))
	details_action.position = Vector2(20.0, size.y - 72.0)
	details_action.size = Vector2(panel_width - 40.0, 54.0)
	var board_margin := clampf(size.x * 0.03, 22.0, 42.0)
	help_board.position = Vector2(board_margin, board_margin)
	help_board.size = Vector2(size.x - board_margin * 2.0, size.y - board_margin * 2.0)
	help_close.position = Vector2(help_board.size.x - 68.0, 15.0)
	help_close.size = Vector2(44.0, 44.0)
	var header := help_board.get_child(1) as VBoxContainer
	header.position = Vector2(42.0, 38.0)
	header.size = Vector2(help_board.size.x - 120.0, 90.0)
	var groups := help_board.get_child(2) as HBoxContainer
	groups.position = Vector2(42.0, 172.0)
	groups.size = Vector2(help_board.size.x - 84.0, minf(400.0, help_board.size.y - 260.0))
	var footer := help_board.get_child(3) as Label
	footer.position = Vector2(42.0, help_board.size.y - 50.0)
	footer.size = Vector2(360.0, 26.0)

func _style(background: Color, radius: float, border := Color.TRANSPARENT, border_width := 0) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = background
	box.corner_radius_top_left = int(radius)
	box.corner_radius_top_right = int(radius)
	box.corner_radius_bottom_left = int(radius)
	box.corner_radius_bottom_right = int(radius)
	box.border_color = border
	box.border_width_left = border_width
	box.border_width_top = border_width
	box.border_width_right = border_width
	box.border_width_bottom = border_width
	box.content_margin_left = 12.0
	box.content_margin_right = 12.0
	box.content_margin_top = 10.0
	box.content_margin_bottom = 10.0
	return box
