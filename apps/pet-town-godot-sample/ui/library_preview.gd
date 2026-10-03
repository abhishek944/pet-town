extends SubViewportContainer

const AssetStyle = preload("res://scripts/asset_style.gd")
var viewport: SubViewport
var model_root: Node3D
var camera: Camera3D

func _ready() -> void:
	stretch = true
	custom_minimum_size = Vector2(370, 208)
	viewport = SubViewport.new()
	viewport.size = Vector2i(370, 208)
	viewport.own_world_3d = true
	viewport.render_target_update_mode = SubViewport.UPDATE_WHEN_VISIBLE
	add_child(viewport)
	var environment := WorldEnvironment.new()
	var settings := Environment.new()
	settings.background_mode = Environment.BG_COLOR
	settings.background_color = Color("e8eddb")
	settings.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	settings.ambient_light_color = Color("fff5e4")
	settings.ambient_light_energy = 0.65
	environment.environment = settings
	viewport.add_child(environment)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-45, -35, 0)
	light.light_energy = 0.9
	viewport.add_child(light)
	model_root = Node3D.new()
	viewport.add_child(model_root)
	camera = Camera3D.new()
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	viewport.add_child(camera)

func show_asset(entry: Dictionary, angle: float) -> void:
	for child in model_root.get_children():
		model_root.remove_child(child)
		child.queue_free()
	if not ResourceLoader.exists(entry.get("path", "")):
		return
	var packed = load(entry.path)
	if not packed is PackedScene:
		return
	var model := packed.instantiate() as Node3D
	if not model:
		return
	model_root.rotation.y = 0
	model_root.add_child(model)
	AssetStyle.apply(model)
	var bounds := collect_bounds(model)
	model.position -= bounds.get_center()
	model_root.rotation.y = angle
	var span := maxf(1.0, maxf(bounds.size.x, maxf(bounds.size.y, bounds.size.z)))
	camera.size = span * 1.7
	camera.position = Vector3(1.3, 0.9, 1.5).normalized() * span * 3
	camera.look_at(Vector3.ZERO)
	camera.far = span * 10

func collect_bounds(node: Node3D) -> AABB:
	var result := AABB()
	var initialized := false
	var pending: Array[Node] = [node]
	while not pending.is_empty():
		var current: Node = pending.pop_back()
		if current is MeshInstance3D and current.mesh:
			var bounds: AABB = current.global_transform * current.get_aabb()
			result = result.merge(bounds) if initialized else bounds
			initialized = true
		pending.append_array(current.get_children())
	return result
