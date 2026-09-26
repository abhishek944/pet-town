extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var folder := OS.get_cache_dir().path_join("pet-town-input-parity-%d" % OS.get_process_id())
	DirAccess.make_dir_recursive_absolute(folder)
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", folder)
	var town := load("res://scenes/main.tscn").instantiate() as Node3D
	root.add_child(town)
	await physics_frame
	await physics_frame
	var errors := []
	var camera := town.get_node("OrbitCamera") as WorkshopCamera
	if camera.far < 12000.0:
		errors.append("camera clips the ocean before its distant horizon")
	var editor := town.get_node("BuildEditor") as WorkshopEditor
	var modes := town.get_node("TownModes") as TownModeController
	modes.set_mode("build")
	var start := camera.focus
	_press(town, MOUSE_BUTTON_LEFT, Vector2(600, 400), true)
	var motion := InputEventMouseMotion.new()
	motion.position = Vector2(700, 450)
	town._unhandled_input(motion)
	_press(town, MOUSE_BUTTON_LEFT, Vector2(700, 450), false)
	if camera.focus.distance_to(start) < 1.0:
		errors.append("left drag did not pan across the island")
	var yaw := camera.yaw
	_press(town, MOUSE_BUTTON_LEFT, Vector2(600, 400), true, false, true)
	motion.position = Vector2(680, 400)
	motion.alt_pressed = true
	town._unhandled_input(motion)
	_press(town, MOUSE_BUTTON_LEFT, Vector2(680, 400), false)
	if camera.yaw >= yaw - 0.2:
		errors.append("Alt-left drag orbited in the wrong direction")
	camera.reset_view()
	yaw = camera.yaw
	_press(town, MOUSE_BUTTON_MIDDLE, Vector2(600, 400), true)
	motion.position = Vector2(680, 400)
	motion.alt_pressed = false
	town._unhandled_input(motion)
	_press(town, MOUSE_BUTTON_MIDDLE, Vector2(680, 400), false)
	if camera.yaw >= yaw - 0.2:
		errors.append("middle drag orbited in the wrong direction")
	yaw = camera.yaw
	Input.action_press("camera_left")
	camera._process(0.5)
	Input.action_release("camera_left")
	if camera.yaw >= yaw - 0.3:
		errors.append("camera angle key did not turn")
	camera.reset_view()
	var object := editor.create_object("pine-tree", "input-audit")
	var ray := PhysicsRayQueryParameters3D.create(Vector3(0, 20, 0), Vector3(0, -20, 0), 16)
	object.global_position = root.get_world_3d().direct_space_state.intersect_ray(ray).position
	await physics_frame
	var point := camera.unproject_position(object.global_position + Vector3.UP * 1.5)
	_press(town, MOUSE_BUTTON_LEFT, point, true)
	_press(town, MOUSE_BUTTON_LEFT, point, false)
	if is_instance_valid(editor.selected):
		errors.append("single click selected an object")
	_press(town, MOUSE_BUTTON_LEFT, point, true, true)
	if editor.selected != object:
		errors.append("double click did not select an object")
	var escape := InputEventKey.new()
	escape.keycode = KEY_ESCAPE
	escape.pressed = true
	town._input(escape)
	if ui_inspector_open(town, editor):
		errors.append("Escape did not close the object inspector")
	var hud := town.get_node("CanvasLayer/WorkshopUI") as WorkshopUI
	hud.open_settings(0)
	town._input(escape)
	if hud.settings_overlay.visible:
		errors.append("Escape did not close Town Studio")
	hud.show_agent_details({"id": "test", "label": "Test companion"})
	town._input(escape)
	if hud.agent_panel.visible:
		errors.append("Escape did not close companion details")
	var commands := town.get_node("CanvasLayer/TownCommands") as TownCommandPalette
	commands.open_palette()
	town._input(escape)
	if commands.panel.visible:
		errors.append("Escape did not close command palette")
	print("INPUT_PARITY_SMOKE errors=", errors)
	town.free()
	quit(0 if errors.is_empty() else 1)

func ui_inspector_open(town: Node3D, editor: WorkshopEditor) -> bool:
	var hud := town.get_node("CanvasLayer/WorkshopUI") as WorkshopUI
	return hud.inspector.visible or is_instance_valid(editor.selected)

func _press(town: Node3D, button: MouseButton, position: Vector2, pressed: bool, double := false, alt := false) -> InputEventMouseButton:
	var event := InputEventMouseButton.new()
	event.button_index = button
	event.position = position
	event.pressed = pressed
	event.double_click = double
	event.alt_pressed = alt
	town._unhandled_input(event)
	return event
