extends SubViewportContainer

const AssetStyle = preload("res://scripts/asset_style.gd")
const UI_FONT = preload("res://ui/fonts/nunito-800.ttf")

var viewport: SubViewport
var model_root: Node3D
var camera: Camera3D
var status: Label
var corner_radius := 0.0
var fit_to_stage := false

func _ready() -> void:
	stretch = true
	if corner_radius > 0:
		var clipping := ShaderMaterial.new()
		clipping.shader = preload("res://ui/rounded_preview.gdshader")
		clipping.set_shader_parameter("radius", corner_radius)
		material = clipping
	if custom_minimum_size == Vector2.ZERO:
		custom_minimum_size = Vector2(370, 208)
	viewport = SubViewport.new()
	viewport.size = Vector2i(maxi(1, roundi(custom_minimum_size.x)), maxi(1, roundi(custom_minimum_size.y)))
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
	var status_layer := CanvasLayer.new()
	status_layer.layer = 1
	viewport.add_child(status_layer)
	status = Label.new()
	status.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	status.mouse_filter = Control.MOUSE_FILTER_IGNORE
	status.add_theme_font_override("font", UI_FONT)
	status.add_theme_color_override("font_color", Color("6e7a5d"))
	status.add_theme_font_size_override("font_size", 10 if custom_minimum_size.x > 100 else 9)
	status.text = "Select an asset to preview."
	status_layer.add_child(status)
	# stretch=true already owns the child viewport's size.
	resized.connect(_fit_camera)

func show_asset(entry: Dictionary, angle: float) -> bool:
	_clear_model()
	status.text = "Loading model…"
	status.show()
	var path := str(entry.get("path", ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		status.text = "Model source is unavailable."
		return false
	var packed = load(path)
	if not packed is PackedScene:
		status.text = "Model preview could not be loaded."
		return false
	var instance: Node = packed.instantiate()
	if not instance is Node3D:
		instance.free()
		status.text = "Model preview is unavailable."
		return false
	var model: Node3D = instance
	model_root.add_child(model)
	AssetStyle.apply(model)
	var bounds := collect_bounds(model)
	if bounds.size.length_squared() <= 0.000001:
		model_root.remove_child(model)
		model.queue_free()
		status.text = "This asset has no 3D model preview."
		return false
	model.position -= bounds.get_center()
	model_root.rotation.y = angle
	var span := maxf(1.0, maxf(bounds.size.x, maxf(bounds.size.y, bounds.size.z)))
	camera.size = span * 1.7
	camera.position = Vector3(1.3, 0.9, 1.5).normalized() * span * 3
	camera.look_at(Vector3.ZERO)
	camera.far = span * 10
	_fit_camera()
	status.hide()
	return true

func _fit_camera() -> void:
	if not fit_to_stage or not is_instance_valid(camera) or not is_instance_valid(model_root): return
	var bounds := collect_bounds(model_root)
	if bounds.size.length_squared() <= 0.000001: return
	var projection := Rect2()
	for index in range(8):
		var point := camera.global_transform.affine_inverse() * bounds.get_endpoint(index)
		var position_2d := Vector2(point.x, point.y)
		projection = Rect2(position_2d, Vector2.ZERO) if index == 0 else projection.expand(position_2d)
	var aspect := maxf(0.01, size.x / maxf(1, size.y))
	camera.size = maxf(0.05, maxf(projection.size.y, projection.size.x / aspect)) * 1.2

func show_empty(message: String) -> void:
	_clear_model()
	status.text = message
	status.show()

func _clear_model() -> void:
	if not is_instance_valid(model_root):
		return
	for child in model_root.get_children():
		model_root.remove_child(child)
		# GLES may still have an initial material dependency queued this frame.
		RenderingServer.frame_post_draw.connect(child.queue_free, CONNECT_ONE_SHOT)
	model_root.rotation.y = 0

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
