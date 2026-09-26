class_name WorkshopCamera
extends Camera3D

var focus := Vector3.ZERO
var yaw := deg_to_rad(28.0)
var elevation := deg_to_rad(49.0)
var distance := 72.0
var dragging := false
var drag_orbits := false
var drag_origin := Vector2.ZERO
var drag_position := Vector2.ZERO
var controls_enabled := true
var followed: Node3D
var default_focus := Vector3.ZERO
var default_distance := 72.0

func _ready() -> void:
	current = true
	fov = 44.0
	far = 20000.0
	default_focus = focus
	default_distance = distance
	_update_pose()

func _process(delta: float) -> void:
	if is_instance_valid(followed):
		focus = focus.lerp(followed.global_position + Vector3.UP * 0.8, minf(delta * 6.0, 1.0))
	if controls_enabled:
		if Input.is_action_pressed("camera_left"):
			yaw -= delta * 0.8
		if Input.is_action_pressed("camera_right"):
			yaw += delta * 0.8
		if Input.is_action_pressed("camera_up"):
			elevation = clampf(elevation + delta * 0.55, deg_to_rad(18), deg_to_rad(66))
		if Input.is_action_pressed("camera_down"):
			elevation = clampf(elevation - delta * 0.55, deg_to_rad(18), deg_to_rad(66))
	_update_pose()

func follow(target: Node3D) -> void:
	followed = target
	distance = 25.0
	_update_pose()

func stop_follow() -> void:
	followed = null

func reset_view() -> void:
	stop_follow()
	focus = default_focus
	distance = default_distance
	yaw = deg_to_rad(28.0)
	elevation = deg_to_rad(49.0)
	_update_pose()

func zoom(factor: float) -> void:
	distance = clampf(distance * factor, 18.0, 150.0)
	_update_pose()

func begin_drag(screen_position: Vector2, orbit: bool) -> void:
	dragging = true
	drag_orbits = orbit
	drag_origin = screen_position
	drag_position = screen_position

func drag_to(screen_position: Vector2, alt_pressed := false) -> void:
	if not dragging:
		return
	var delta := screen_position - drag_position
	drag_position = screen_position
	if drag_orbits or alt_pressed:
		yaw -= delta.x * 0.007
		elevation = clampf(elevation + delta.y * 0.006, deg_to_rad(18), deg_to_rad(66))
	else:
		pan_by(delta)
	_update_pose()

func end_drag(screen_position: Vector2) -> bool:
	var clicked := dragging and screen_position.distance_to(drag_origin) < 6.0
	dragging = false
	return clicked

func pan_by(delta: Vector2) -> void:
	stop_follow()
	var scale := distance / maxf(get_viewport().get_visible_rect().size.y, 1.0) * 1.55
	var screen_right := Vector3(cos(yaw), 0.0, -sin(yaw))
	var screen_forward := Vector3(-sin(yaw), 0.0, -cos(yaw))
	focus -= screen_right * delta.x * scale
	focus += screen_forward * delta.y * scale
	focus.x = clampf(focus.x, -46.0, 46.0)
	focus.z = clampf(focus.z, -38.0, 38.0)
	focus.y = 0.5

func toggle_fullscreen() -> void:
	var window := get_window()
	window.mode = Window.MODE_WINDOWED if window.mode == Window.MODE_EXCLUSIVE_FULLSCREEN else Window.MODE_EXCLUSIVE_FULLSCREEN

func _unhandled_input(event: InputEvent) -> void:
	if not (event is InputEventKey) or not event.pressed or event.echo:
		return
	var key := event as InputEventKey
	match key.keycode:
		KEY_R: reset_view()
		KEY_F: toggle_fullscreen()
		KEY_EQUAL: zoom(0.84)
		KEY_MINUS: zoom(1.18)

func _update_pose() -> void:
	var horizontal := cos(elevation) * distance
	position = focus + Vector3(sin(yaw) * horizontal, sin(elevation) * distance, cos(yaw) * horizontal)
	look_at(focus, Vector3.UP)
