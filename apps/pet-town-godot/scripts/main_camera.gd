extends "res://scripts/main_bridge.gd"

func _reset_camera() -> void:
	call("_release_control")
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
	call("_release_control")
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
	call("_layout_ui")
	if camera_at_overview:
		camera_distance = _overview_distance()

func _toggle_fullscreen() -> void:
	var mode := DisplayServer.window_get_mode()
	DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_MAXIMIZED if mode in [DisplayServer.WINDOW_MODE_FULLSCREEN, DisplayServer.WINDOW_MODE_EXCLUSIVE_FULLSCREEN] else DisplayServer.WINDOW_MODE_FULLSCREEN)
