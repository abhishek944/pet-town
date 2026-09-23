extends "res://scripts/town_mode.gd"

const TOWN_SETTINGS_SCRIPT := preload("res://scripts/town_settings.gd")

@onready var tree_customization: Node = $UserTrees
var settings_window: Control

func _ready() -> void:
	camera_target = overview_target
	camera_distance = _overview_distance()
	get_viewport().size_changed.connect(_on_viewport_size_changed)
	get_window().focus_entered.connect(_on_window_focus_entered)
	get_window().focus_exited.connect(_on_window_focus_exited)
	_build_ui()
	tree_customization.call("initialize", ui_root)
	_initialize_town_mode()
	_build_settings()
	_layout_ui()
	_update_camera()
	_launch_bridge()

func _exit_tree() -> void:
	_send_bridge({"v": 1, "type": "activeChanged", "active": false})
	_send_bridge({"v": 1, "type": "shutdown"})

func _build_settings() -> void:
	settings_window = TOWN_SETTINGS_SCRIPT.new() as Control
	ui_root.add_child(settings_window)
	settings_window.call("set_pet_names", MODEL_NAMES)
	settings_window.connect("dismissed", _on_settings_dismissed)

func _on_settings_dismissed() -> void:
	_set_background_focus_enabled(true)

func _set_background_focus_enabled(enabled: bool) -> void:
	var behavior := Control.FOCUS_BEHAVIOR_INHERITED if enabled else Control.FOCUS_BEHAVIOR_DISABLED
	for surface in [tree_customization.get("tree_panel"), details_panel, help_board]:
		if is_instance_valid(surface):
			(surface as Control).focus_behavior_recursive = behavior

func _settings_are_open() -> bool:
	return is_instance_valid(settings_window) and settings_window.visible

func _input(event: InputEvent) -> void:
	# Placement needs the first chance at world clicks; the open editor panel can
	# otherwise consume them before _unhandled_input sees the move action.
	if bool(tree_customization.get("placement_active")) and event is InputEventMouseButton:
		var pointer := event as InputEventMouseButton
		var panel := tree_customization.get("tree_panel") as Control
		if not is_instance_valid(panel) or not panel.visible or not panel.get_global_rect().has_point(pointer.position):
			if bool(tree_customization.call("_handle_tree_customization_input", event)):
				return
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	var key := event as InputEventKey
	if key.alt_pressed and (key.keycode == KEY_S or key.physical_keycode == KEY_S):
		if town_mode == "build":
			return
		if _settings_are_open():
			settings_window.call("close_settings")
		else:
			settings_window.call("open_settings")
			_set_background_focus_enabled(false)
		get_viewport().set_input_as_handled()
	elif key.keycode == KEY_ESCAPE and _settings_are_open():
		settings_window.call("close_settings")
		get_viewport().set_input_as_handled()

func _physics_process(_delta: float) -> void:
	if not is_instance_valid(controlled_pet):
		controlled_pet = null
		return
	var direction := Vector3.ZERO
	if get_window().has_focus() and not _help_is_open() and not _details_are_open() and not _settings_are_open() and not bool(tree_customization.get("placement_active")):
		var keys := Input.get_vector("camera_left", "camera_right", "camera_up", "camera_down")
		var right := camera.global_basis.x
		var forward := -camera.global_basis.z
		right.y = 0.0
		forward.y = 0.0
		direction = (right.normalized() * keys.x + forward.normalized() * -keys.y).normalized()
	controlled_pet.manual_direction = direction

func _process(delta: float) -> void:
	_poll_bridge()
	if bridge_pid <= 0 and Time.get_ticks_msec() >= bridge_retry_at:
		_launch_bridge()
	if following_pet and is_instance_valid(selected_pet):
		var rendered_target := selected_pet.get_global_transform_interpolated().origin + FOLLOW_OFFSET
		var height := lerpf(camera_target.y, rendered_target.y, 1.0 - exp(-FOLLOW_HEIGHT_RESPONSE * delta))
		camera_target = camera_target.lerp(rendered_target, 1.0 - exp(-FOLLOW_RESPONSE * delta))
		camera_target.y = height
	if not _help_is_open() and not _settings_are_open() and not is_instance_valid(controlled_pet):
		if Input.is_action_pressed("camera_left"):
			camera_yaw -= delta * 0.8
		if Input.is_action_pressed("camera_right"):
			camera_yaw += delta * 0.8
		if Input.is_action_pressed("camera_up"):
			camera_pitch = clampf(camera_pitch + delta * 0.55, deg_to_rad(18.0), deg_to_rad(66.0))
		if Input.is_action_pressed("camera_down"):
			camera_pitch = clampf(camera_pitch - delta * 0.55, deg_to_rad(18.0), deg_to_rad(66.0))
	_update_camera()
	tree_customization.call("_update_tree_customization")
	_refresh_details()
	_update_speaking_wave()

func _unhandled_input(event: InputEvent) -> void:
	if _settings_are_open():
		return
	if bool(tree_customization.call("_handle_tree_customization_input", event)):
		return
	if event is InputEventKey and event.pressed and not event.echo:
		var key := event as InputEventKey
		if key.alt_pressed and key.keycode == KEY_H and town_mode != "build":
			_toggle_help(not _help_is_open())
			get_viewport().set_input_as_handled()
			return
		if key.keycode == KEY_ESCAPE:
			if _help_is_open():
				_toggle_help(false)
			elif _details_are_open():
				_close_details()
			elif is_instance_valid(controlled_pet):
				_release_control()
			elif following_pet:
				following_pet = false
			get_viewport().set_input_as_handled()
			return
		if _help_is_open():
			return
		if key.alt_pressed and key.keycode == KEY_A and town_mode != "build":
			_cycle_agent()
		elif key.keycode == KEY_C and town_mode != "build" and not key.alt_pressed and not key.ctrl_pressed and not key.meta_pressed:
			_toggle_control()
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
			if town_mode != "build":
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
					if town_mode != "build":
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
