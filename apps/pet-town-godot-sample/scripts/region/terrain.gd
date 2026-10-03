extends Node3D
const Buffers = preload("buffers.gd")
var materials: Array[ShaderMaterial] = []
var chunks: Array[MeshInstance3D] = []

func setup(manifest: Dictionary) -> void:
	var metadata: Dictionary = manifest.terrain
	var images: Array[Image] = []
	for entry in metadata.layers:
		var texture: Texture2D = load("res://assets/" + entry.file)
		var image := texture.get_image()
		image.convert(Image.FORMAT_RGBA8)
		image.generate_mipmaps()
		images.append(image)
	var atlas := Texture2DArray.new()
	atlas.create_from_images(images)
	for lip in [false, true]:
		var material := ShaderMaterial.new()
		material.shader = preload("res://shaders/terrain/terrain.gdshader")
		material.set_shader_parameter("uAtlas",atlas)
		material.set_shader_parameter("is_lip",lip)
		for key in ["uBump", "uSeamL", "uEmit"]:
			var source: Array = metadata.get({"uBump":"bump","uSeamL":"seam","uEmit":"emit"}[key], [])
			var values := PackedFloat32Array(source)
			var original := values.size()
			values.resize(64)
			if key == "uSeamL":
				for i in range(original,64): values[i] = 1
			material.set_shader_parameter(key, values)
		for key in ["FRINGE", "PATH_EDGE", "MOSS"]:
			material.set_shader_parameter("L_"+key, float(metadata.layerIds[key]))
		for key in metadata.uniforms:
			var value = metadata.uniforms[key]
			if value is Array and value.size() == 3:
				value = Vector3(value[0],value[1],value[2])
			material.set_shader_parameter(key,value)
		materials.append(material)
	for entry in metadata.chunks:
		var data := Buffers.read_json(entry.file)
		var instance := MeshInstance3D.new()
		instance.name = entry.name
		instance.mesh = Buffers.resource_mesh(entry.file, true)
		instance.transform = Buffers.transform(data.matrix)
		instance.material_override = materials[1 if entry.lip else 0]
		add_child(instance)
		chunks.append(instance)
		if not entry.lip:
			instance.create_trimesh_collision()

func set_lighting(sample: Dictionary) -> void:
	for material in materials:
		material.set_shader_parameter("uLightDir",sample.sun_direction)
		material.set_shader_parameter("uNight",float(sample.stars))
