extends Node3D

# The island, lights, camera and help panel are saved in main.tscn.
# This script controls the viewer and selection; it never places world assets.
const FOLLOW_RESPONSE := 6.0
const FOLLOW_HEIGHT_RESPONSE := 2.0
const FOLLOW_OFFSET := Vector3(0.0, 0.8, 0.0)
const MIN_CAMERA_DISTANCE := 24.0
const MAX_CAMERA_DISTANCE := 440.0
const WIDESCREEN_OVERVIEW_DISTANCE := 185.0
const WIDESCREEN_ASPECT := 1.6
const DRAG_NONE := 0
const DRAG_PAN := 1
const DRAG_ORBIT := 2

@onready var camera: Camera3D = $OrbitCamera
@onready var ui_root: Control = $ViewerHelp/HelpRoot
@onready var ui_panel: PanelContainer = $ViewerHelp/HelpRoot/Panel
@onready var overview_target: Vector3 = $CameraFocus.position
@onready var camera_target: Vector3 = overview_target

var selected_companion: CharacterBody3D
var following_companion := false
var click_origin := Vector2.ZERO

var camera_yaw := deg_to_rad(90.0)
var camera_pitch := deg_to_rad(34.0)
var camera_distance := WIDESCREEN_OVERVIEW_DISTANCE
var camera_dragging := false
var camera_drag_mode := DRAG_NONE
var camera_at_overview := true
var camera_drag_position := Vector2.ZERO

func _ready() -> void:
	camera_distance = _overview_distance()
	get_viewport().size_changed.connect(_on_viewport_size_changed)
	_fit_help_panel()
	_update_camera()
	call_deferred("_start_companion_view")

func _process(delta: float) -> void:
	_update_companion_panel()
	if following_companion and is_instance_valid(selected_companion):
		# Follow the same interpolated transform that is drawn on screen, not
		# the discrete physics position. Camera itself updates only at render rate.
		var rendered_target := selected_companion.get_global_transform_interpolated().origin + FOLLOW_OFFSET
		var height := lerpf(camera_target.y, rendered_target.y, 1.0 - exp(-FOLLOW_HEIGHT_RESPONSE * delta))
		camera_target = camera_target.lerp(rendered_target, 1.0 - exp(-FOLLOW_RESPONSE * delta))
		camera_target.y = height
	if Input.is_action_pressed("camera_left"):
		camera_yaw -= delta * 0.8
	if Input.is_action_pressed("camera_right"):
		camera_yaw += delta * 0.8
	if Input.is_action_pressed("camera_up"):
		camera_pitch = clampf(camera_pitch + delta * 0.55, deg_to_rad(18.0), deg_to_rad(66.0))
	if Input.is_action_pressed("camera_down"):
		camera_pitch = clampf(camera_pitch - delta * 0.55, deg_to_rad(18.0), deg_to_rad(66.0))

	_update_camera()

func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var button := event as InputEventMouseButton
		if button.button_index == MOUSE_BUTTON_LEFT and button.pressed and button.double_click:
			camera_dragging = false
			camera_drag_mode = DRAG_NONE
			_focus_location(button.position)
		elif button.button_index in [MOUSE_BUTTON_LEFT, MOUSE_BUTTON_RIGHT, MOUSE_BUTTON_MIDDLE]:
			camera_dragging = button.pressed
			if button.pressed:
				click_origin = button.position
				camera_drag_position = button.position
				camera_drag_mode = DRAG_ORBIT if button.alt_pressed or button.button_index != MOUSE_BUTTON_LEFT else DRAG_PAN
			else:
				if button.button_index == MOUSE_BUTTON_LEFT and button.position.distance_to(click_origin) < 6.0:
					_select_companion_at(button.position)
				camera_drag_mode = DRAG_NONE
		elif button.pressed and button.button_index == MOUSE_BUTTON_WHEEL_UP:
			_apply_zoom(0.88)
		elif button.pressed and button.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_apply_zoom(1.14)
	elif event is InputEventMagnifyGesture:
		var magnify := event as InputEventMagnifyGesture
		_apply_zoom(1.0 / maxf(magnify.factor, 0.01))
	elif event is InputEventMouseMotion and camera_dragging:
		var motion := event as InputEventMouseMotion
		var drag_delta: Vector2 = motion.position - camera_drag_position
		camera_drag_position = motion.position
		if camera_drag_mode == DRAG_ORBIT or motion.alt_pressed:
			camera_yaw += drag_delta.x * 0.007
			camera_pitch = clampf(camera_pitch + drag_delta.y * 0.006, deg_to_rad(18.0), deg_to_rad(66.0))
		else:
			_pan_camera(drag_delta)
	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_TAB:
			_cycle_companion()
		elif event.keycode == KEY_ESCAPE:
			following_companion = false
		elif event.keycode == KEY_R:
			_reset_camera()
		elif event.keycode == KEY_H and is_instance_valid(ui_root):
			ui_root.visible = not ui_root.visible
		elif event.keycode == KEY_F:
			_toggle_fullscreen()
		elif event.keycode == KEY_EQUAL:
			_apply_zoom(0.84)
		elif event.keycode == KEY_MINUS:
			_apply_zoom(1.18)

func _update_camera() -> void:
	if not is_instance_valid(camera):
		return
	var horizontal_distance := camera_distance * cos(camera_pitch)
	var offset := Vector3(
		cos(camera_yaw) * horizontal_distance,
		sin(camera_pitch) * camera_distance,
		sin(camera_yaw) * horizontal_distance
	)
	camera.position = camera_target + offset
	camera.look_at(camera_target, Vector3.UP)

func _reset_camera() -> void:
	following_companion = false
	camera_yaw = deg_to_rad(90.0)
	camera_pitch = deg_to_rad(34.0)
	camera_at_overview = true
	camera_distance = _overview_distance()
	camera_target = overview_target

func _apply_zoom(multiplier: float) -> void:
	camera_at_overview = false
	camera_distance = clampf(camera_distance * multiplier, MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE)

func _pan_camera(drag_delta: Vector2) -> void:
	following_companion = false
	camera_at_overview = false
	var viewport_height := maxf(get_viewport().get_visible_rect().size.y, 1.0)
	var world_units_per_pixel := camera_distance / viewport_height * 1.55
	var screen_right := Vector3(sin(camera_yaw), 0.0, -cos(camera_yaw))
	var screen_forward := Vector3(-cos(camera_yaw), 0.0, -sin(camera_yaw))
	camera_target -= screen_right * drag_delta.x * world_units_per_pixel
	camera_target += screen_forward * drag_delta.y * world_units_per_pixel
	camera_target.x = clampf(camera_target.x, -72.0, 72.0)
	camera_target.z = clampf(camera_target.z, -66.0, 78.0)
	camera_target.y = 1.5

func _focus_location(screen_position: Vector2) -> void:
	following_companion = false
	if not is_instance_valid(camera):
		return
	var ray_origin := camera.project_ray_origin(screen_position)
	var ray_direction := camera.project_ray_normal(screen_position)
	var town_plane := Plane(Vector3.UP, 1.2)
	var intersection: Variant = town_plane.intersects_ray(ray_origin, ray_direction)
	if intersection is Vector3:
		var focus_point := intersection as Vector3
		camera_at_overview = false
		camera_target = Vector3(
			clampf(focus_point.x, -72.0, 72.0),
			1.5,
			clampf(focus_point.z, -66.0, 78.0)
		)
		camera_distance = 68.0

func _overview_distance() -> float:
	var viewport_size := get_viewport().get_visible_rect().size
	var aspect := viewport_size.x / maxf(viewport_size.y, 1.0)
	return clampf(
		WIDESCREEN_OVERVIEW_DISTANCE * maxf(1.0, WIDESCREEN_ASPECT / aspect),
		WIDESCREEN_OVERVIEW_DISTANCE,
		MAX_CAMERA_DISTANCE
	)

func _on_viewport_size_changed() -> void:
	_fit_help_panel()
	if camera_at_overview:
		camera_distance = _overview_distance()

func _toggle_fullscreen() -> void:
	var mode := DisplayServer.window_get_mode()
	if mode == DisplayServer.WINDOW_MODE_FULLSCREEN or mode == DisplayServer.WINDOW_MODE_EXCLUSIVE_FULLSCREEN:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_MAXIMIZED)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)

func _fit_help_panel() -> void:
	if not is_instance_valid(ui_panel):
		return
	var viewport_width := get_viewport().get_visible_rect().size.x
	var safe_margin := 18.0
	var viewport_height := get_viewport().get_visible_rect().size.y
	var panel_width := minf(460.0, maxf(180.0, viewport_width - safe_margin * 2.0))
	var panel_height := minf(220.0, maxf(150.0, viewport_height - safe_margin * 2.0))
	ui_panel.set_anchors_preset(Control.PRESET_TOP_LEFT)
	ui_panel.offset_left = safe_margin
	ui_panel.offset_top = safe_margin
	ui_panel.offset_right = safe_margin + panel_width
	ui_panel.offset_bottom = safe_margin + panel_height
	var companion_panel: PanelContainer = $ViewerHelp/HelpRoot/CompanionPanel
	companion_panel.set_anchors_preset(Control.PRESET_TOP_LEFT)
	var companion_width := minf(310.0, viewport_width - safe_margin * 2.0)
	companion_panel.offset_left = safe_margin if viewport_width < 850.0 else viewport_width - companion_width - safe_margin
	companion_panel.offset_right = companion_panel.offset_left + companion_width
	companion_panel.offset_top = ui_panel.offset_bottom + 12.0 if viewport_width < 850.0 else safe_margin
	companion_panel.offset_bottom = companion_panel.offset_top + 220.0

func _start_companion_view() -> void:
	var residents := get_tree().get_nodes_in_group("companions")
	if not residents.is_empty(): _follow_companion(residents[0])

func _cycle_companion() -> void:
	var residents := get_tree().get_nodes_in_group("companions")
	if residents.is_empty(): return
	var index := residents.find(selected_companion)
	_follow_companion(residents[(index + 1) % residents.size()])

func _follow_companion(companion: CharacterBody3D) -> void:
	selected_companion = companion
	following_companion = true
	camera_at_overview = false
	camera_distance = 25.0
	camera_target = companion.get_global_transform_interpolated().origin + FOLLOW_OFFSET

func _select_companion_at(screen_position: Vector2) -> void:
	var origin := camera.project_ray_origin(screen_position)
	var ray := PhysicsRayQueryParameters3D.create(origin, origin + camera.project_ray_normal(screen_position) * 1000.0, 2)
	var hit := get_world_3d().direct_space_state.intersect_ray(ray)
	if not hit.is_empty() and hit.collider.is_in_group("companions"):
		_follow_companion(hit.collider)

func _update_companion_panel() -> void:
	var status: Label = $ViewerHelp/HelpRoot/CompanionPanel/Margin/Status
	if not is_instance_valid(selected_companion): return
	status.text = "%s  ·  %s\n\n%s\nEnergy  %d / 100\nApples  %d    Delivered  %d\n\nTab: next companion · R: island\nClick a character to follow · Esc: release" % [selected_companion.display_name, "FOLLOWING" if following_companion else "SELECTED", selected_companion.activity_text, selected_companion.energy, selected_companion.apples, selected_companion.deliveries]
