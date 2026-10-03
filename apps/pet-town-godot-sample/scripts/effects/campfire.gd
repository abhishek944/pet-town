extends Node3D
## Crossed flame geometry matches createCampfireFlamePlanes and its source shader.
var light: OmniLight3D
var clock := 0.0
var night := 0.0
var embers: CPUParticles3D

func setup(data: Dictionary, texture_path := "res://assets/region-flame.png") -> void:
	position = Vector3(float(data.get("x", 0)), float(data.get("y", 0)), float(data.get("z", 0)))
	var rng := RandomNumberGenerator.new()
	rng.seed = int(data.get("seed", 3))
	var texture: Texture2D = load(texture_path) if ResourceLoader.exists(texture_path) else null
	if texture:
		var billboards := preload("res://scripts/effects/prop_billboards.gd").new()
		add_child(billboards)
		billboards.setup_flames(data.get("flames", []), texture)
	var exported := _source_planes(data, texture)
	for i in (0 if exported else 7):
		var angle := float(i) * PI / 4.0 if i < 4 else float(i - 4) / 3.0 * TAU + 0.5
		var width := 0.78 if i < 4 else 0.45
		var height := 1.25 if i < 4 else rng.randf_range(0.7, 0.9)
		var plane := MeshInstance3D.new()
		var quad := QuadMesh.new()
		quad.size = Vector2(width, height) * 0.62
		plane.mesh = quad
		plane.position.y = (height * 0.5 - 0.05) * 0.62
		plane.rotation.y = angle
		if i >= 4:
			plane.position += Vector3(cos(angle), 0, sin(angle)) * 0.15 * 0.62
		var material := ShaderMaterial.new()
		material.shader = load("res://shaders/effects/flame.gdshader")
		material.set_shader_parameter("phase", rng.randf() * 10.0)
		material.set_shader_parameter("has_texture", texture != null)
		if texture:
			material.set_shader_parameter("flame_texture", texture)
		plane.material_override = material
		plane.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(plane)
	light = OmniLight3D.new()
	light.position.y = 0.8
	light.light_color = Color(1.0, 0.58, 0.1)
	light.omni_range = 8.0
	light.omni_attenuation = 1.2
	add_child(light)
	_embers()

func _source_planes(data: Dictionary, texture: Texture2D) -> bool:
	var path := "res://assets/" + String(data.get("file", ""))
	if not FileAccess.file_exists(path):
		return false
	var source: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(path))
	var attrs: Dictionary = source.attributes
	var pos: PackedFloat32Array = Marshalls.base64_to_raw(attrs.position.base64).to_float32_array()
	var tex: PackedFloat32Array = Marshalls.base64_to_raw(attrs.uv.base64).to_float32_array()
	var phases: PackedFloat32Array = Marshalls.base64_to_raw(attrs.aPhase.base64).to_float32_array()
	var vertices := PackedVector3Array()
	var uvs := PackedVector2Array()
	var colors := PackedColorArray()
	for i in pos.size() / 3:
		vertices.append(Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]))
		uvs.append(Vector2(tex[i * 2], 1.0 - tex[i * 2 + 1]))
		colors.append(Color(phases[i] / 10.0, 1, 1, 1))
	var raw := Marshalls.base64_to_raw(source.index.base64)
	var indices := PackedInt32Array()
	var stride := 4 if source.index.type == "Uint32Array" else 2
	for i in int(source.index.count) / 3:
		for offset in [0, 2, 1]:
			var at: int = (i * 3 + offset) * stride
			indices.append(raw.decode_u32(at) if stride == 4 else raw.decode_u16(at))
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_TEX_UV] = uvs
	arrays[Mesh.ARRAY_COLOR] = colors
	arrays[Mesh.ARRAY_INDEX] = indices
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	var plane := MeshInstance3D.new()
	plane.mesh = mesh
	var material := ShaderMaterial.new()
	material.shader = load("res://shaders/effects/flame.gdshader")
	material.set_shader_parameter("vertex_phase", true)
	material.set_shader_parameter("has_texture", texture != null)
	if texture:
		material.set_shader_parameter("flame_texture", texture)
	plane.material_override = material
	plane.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(plane)
	if data.has("matrix"):
		var m: Array = data.matrix
		plane.transform = Transform3D(Basis(Vector3(m[0], m[1], m[2]), Vector3(m[4], m[5], m[6]), Vector3(m[8], m[9], m[10])), Vector3(m[12], m[13], m[14]) - position)
	return true

func _process(delta: float) -> void:
	clock += delta
	if light:
		light.light_energy = (4.0 + 13.0 * night) * (0.85 + 0.1 * sin(clock * 6.0) + 0.08 * sin(clock * 23.0))

func _embers() -> void:
	embers = CPUParticles3D.new()
	embers.amount = 16
	embers.lifetime = 2.5
	embers.preprocess = 2.5
	embers.explosiveness = 0.0
	embers.randomness = 0.5
	embers.position.y = 0.4
	embers.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	embers.emission_sphere_radius = 0.2
	embers.direction = Vector3.UP
	embers.spread = 14.0
	embers.gravity = Vector3(0.08, 0, 0.03)
	embers.initial_velocity_min = 0.9
	embers.initial_velocity_max = 1.3
	embers.scale_amount_min = 0.04
	embers.scale_amount_max = 0.07
	var mesh := QuadMesh.new()
	mesh.size = Vector2.ONE
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	material.billboard_keep_scale = true
	material.albedo_texture = preload("res://scripts/effects/particle_texture.gd").soft_dot()
	material.albedo_color = Color(1.0, 0.4, 0.12)
	material.vertex_color_use_as_albedo = true
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mesh.material = material
	embers.mesh = mesh
	var gradient := Gradient.new()
	gradient.set_color(0, Color(1, 1, 1, 0.9))
	gradient.set_color(1, Color(1, 0.5, 0.1, 0))
	embers.color_ramp = gradient
	add_child(embers)
