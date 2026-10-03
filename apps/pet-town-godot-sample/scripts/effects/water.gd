extends Node3D
## Original terrain field and swell constants, native shader/refraction/ripple surface.
var material: ShaderMaterial
var ripples := PackedVector4Array()
var ripple_index := 0
var clock := 0.0
var water_level := 2.85
var field_image: Image
var field_rect := Rect2()
var field_texture: ImageTexture
var fields_dirty := false
var shore_dirty := false
var shore_task := -1
var shore_worker: RefCounted
var depth_scale := 16.0

func setup(manifest: Dictionary) -> void:
	var water: Dictionary = manifest.get("water", {})
	if water.is_empty():
		return
	water_level = float(water.get("waterLevel", manifest.get("waterLevel", 2.85)))
	var bounds = water.get("bounds", manifest.get("bounds", {}))
	field_rect = _bounds(bounds)
	var path := String(water.get("file", "region-water-fields.png"))
	if not path.begins_with("res://"):
		path = "res://assets/" + path
	var texture: Texture2D = load(path)
	if texture == null:
		return
	field_image = texture.get_image()
	field_image.convert(Image.FORMAT_RGBA8)
	field_texture = ImageTexture.create_from_image(field_image)
	material = ShaderMaterial.new()
	material.shader = load("res://shaders/effects/water.gdshader")
	material.set_shader_parameter("water_fields", field_texture)
	material.set_shader_parameter("shore_field", preload("res://scripts/effects/shore_field.gd").bake(field_image))
	material.set_shader_parameter("field_rect", Vector4(field_rect.position.x, field_rect.position.y, field_rect.size.x, field_rect.size.y))
	material.set_shader_parameter("field_pixels", Vector2(texture.get_width(), texture.get_height()))
	depth_scale = float(water.get("depthScale", 16.0))
	material.set_shader_parameter("depth_scale", depth_scale)
	for pair in [["shallow_color", 4511968], ["mid_color", 1553108], ["deep_color", 1400004], ["foam_color", 15400442]]:
		material.set_shader_parameter(pair[0], Color.hex((int(pair[1]) << 8) | 255))
	ripples.resize(32)
	var surface := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = field_rect.size
	plane.subdivide_width = ceili(field_rect.size.x)
	plane.subdivide_depth = ceili(field_rect.size.y)
	surface.mesh = plane
	surface.material_override = material
	surface.position = Vector3(field_rect.get_center().x, water_level, field_rect.get_center().y)
	surface.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(surface)

func _process(delta: float) -> void:
	clock += delta
	if material:
		material.set_shader_parameter("clock", clock)
		if fields_dirty:
			field_texture.update(field_image)
			fields_dirty = false
		update_shore()

func set_terrain_column(x: int, z: int, height: float) -> void:
	if not field_image or not field_rect.has_point(Vector2(x + 0.5, z + 0.5)):
		return
	var uv := (Vector2(x + 0.5, z + 0.5) - field_rect.position) / field_rect.size
	var wet := height < water_level
	var pixel := Vector2i(int(uv.x * field_image.get_width()), int(uv.y * field_image.get_height()))
	var previous := field_image.get_pixelv(pixel)
	var next := Color(clampf((water_level - height) / depth_scale, 0, 1), 1.0 if wet else 0.0, clampf(height / 40.0, 0, 1), 1)
	# Terrain edits on dry ground usually leave the water field unchanged.
	field_image.set_pixelv(pixel, next)
	# Compare the stored RGBA8 value, including its channel quantization.
	if previous == field_image.get_pixelv(pixel): return
	fields_dirty = true
	if (previous.g >= 0.5) != wet: shore_dirty = true

func add_ripple(position: Vector3, strength := 1.0) -> void:
	if not material or not is_water(position):
		return
	ripples[ripple_index] = Vector4(position.x, position.z, clock, strength)
	ripple_index = (ripple_index + 1) % 32
	material.set_shader_parameter("ripples", ripples)

func is_water(position: Vector3) -> bool:
	if not field_image or not field_rect.has_point(Vector2(position.x, position.z)):
		return false
	var uv := (Vector2(position.x, position.z) - field_rect.position) / field_rect.size
	return field_image.get_pixel(clampi(int(uv.x * field_image.get_width()), 0, field_image.get_width() - 1), clampi(int(uv.y * field_image.get_height()), 0, field_image.get_height() - 1)).g > 0.5

func set_lighting(sample: Dictionary) -> void:
	if not material:
		return
	material.set_shader_parameter("sky_horizon", sample.get("horizon", Color.SKY_BLUE))
	material.set_shader_parameter("sky_zenith", sample.get("zenith", Color.CORNFLOWER_BLUE))
	material.set_shader_parameter("sun_direction", sample.get("sun_direction", Vector3.UP))
	material.set_shader_parameter("night", float(sample.get("stars", 0.0)))

func _bounds(value) -> Rect2:
	if value is Array:
		return Rect2(float(value[0]), float(value[1]), float(value[2]) - float(value[0]), float(value[3]) - float(value[1]))
	return Rect2(float(value.get("minX", -50)), float(value.get("minZ", -50)), float(value.get("maxX", 50)) - float(value.get("minX", -50)), float(value.get("maxZ", 50)) - float(value.get("minZ", -50)))

func update_shore() -> void:
	if shore_task >= 0:
		if not WorkerThreadPool.is_task_completed(shore_task): return
		WorkerThreadPool.wait_for_task_completion(shore_task)
		shore_task = -1
		# A newer mask supersedes this result; never install a stale shoreline.
		if not shore_dirty:
			material.set_shader_parameter("shore_field", ImageTexture.create_from_image(shore_worker.result))
		shore_worker = null
	if shore_dirty:
		shore_dirty = false
		shore_worker = preload("shore_worker.gd").new()
		shore_worker.source = field_image.duplicate()
		shore_task = WorkerThreadPool.add_task(shore_worker.run, false, "Update shoreline distance")

func _exit_tree() -> void:
	if shore_task >= 0: WorkerThreadPool.wait_for_task_completion(shore_task)
