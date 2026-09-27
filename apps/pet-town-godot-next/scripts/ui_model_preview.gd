class_name WorkshopModelPreview
extends SubViewportContainer

var viewport: SubViewport
var model_root: Node3D
var orbit: Node3D
var camera: Camera3D
var drag_active := false

func _ready() -> void:
	stretch = true
	focus_mode = Control.FOCUS_ALL
	if custom_minimum_size == Vector2.ZERO:
		custom_minimum_size = Vector2(220, 160)
	tooltip_text = "Drag or focus and press Left/Right to rotate the 3D model"
	viewport = SubViewport.new()
	viewport.size = Vector2i(420, 320)
	viewport.transparent_bg = false
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	viewport.world_3d = World3D.new()
	add_child(viewport)
	orbit = Node3D.new()
	viewport.add_child(orbit)
	model_root = Node3D.new()
	orbit.add_child(model_root)
	camera = Camera3D.new()
	camera.current = true
	camera.fov = 38
	viewport.add_child(camera)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-40, -35, 0)
	light.light_energy = 1.7
	viewport.add_child(light)
	var world := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("23382e")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("c2d5b6")
	environment.ambient_light_energy = 0.8
	world.environment = environment
	viewport.add_child(world)

func show_scene(scene: PackedScene) -> void:
	if not is_node_ready():
		await ready
	for child in model_root.get_children():
		child.queue_free()
	if scene == null:
		return
	var instance := scene.instantiate() as Node3D
	if instance == null:
		return
	model_root.add_child(instance)
	var bounds := AABB()
	var found := false
	for candidate in instance.find_children("*", "MeshInstance3D", true, false):
		var mesh := candidate as MeshInstance3D
		if mesh.mesh == null:
			continue
		var part := (model_root.global_transform.affine_inverse() * mesh.global_transform) * mesh.get_aabb()
		bounds = bounds.merge(part) if found else part
		found = true
	if not found:
		camera.position = Vector3(0, 2, 6)
		camera.look_at(Vector3.ZERO)
		return
	model_root.position = -bounds.get_center()
	var diameter := maxf(bounds.size.length(), 1.0)
	camera.position = Vector3(diameter * 0.9, diameter * 0.55, diameter * 1.5)
	camera.look_at(Vector3.ZERO)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		drag_active = event.pressed
		if event.pressed:
			grab_focus()
		accept_event()
	elif event is InputEventMouseMotion and drag_active:
		orbit.rotation.y += event.relative.x * 0.012
		accept_event()
	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_LEFT or event.keycode == KEY_RIGHT:
			orbit.rotation.y += -0.12 if event.keycode == KEY_LEFT else 0.12
			accept_event()
