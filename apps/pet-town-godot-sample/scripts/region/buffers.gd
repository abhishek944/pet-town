extends RefCounted

static func read_json(file: String) -> Dictionary:
	var parsed = JSON.parse_string(FileAccess.get_file_as_string("res://assets/" + file))
	return parsed if parsed is Dictionary else {}

static func values(record: Dictionary) -> PackedFloat32Array:
	if record.is_empty():
		return PackedFloat32Array()
	var bytes := Marshalls.base64_to_raw(record.base64)
	if record.type == "Float32Array":
		return bytes.to_float32_array()
	var result := PackedFloat32Array()
	var width := 2 if record.type in ["Uint16Array", "Int16Array"] else 1
	if record.type in ["Uint32Array", "Int32Array"]:
		width = 4
	result.resize(bytes.size() / width)
	var normalized: bool = record.get("normalized", false)
	for i in result.size():
		var value: float
		if width == 4:
			value = bytes.decode_u32(i * 4)
		elif width == 2:
			value = bytes.decode_u16(i * 2)
		else:
			value = bytes[i]
		if record.type == "Int8Array" and value > 127:
			value -= 256
		if normalized:
			value /= 127.0 if record.type == "Int8Array" else (65535.0 if width == 2 else 255.0)
		result[i] = value
	return result

static func transform(matrix: Array) -> Transform3D:
	return Transform3D(Basis(Vector3(matrix[0],matrix[1],matrix[2]), Vector3(matrix[4],matrix[5],matrix[6]), Vector3(matrix[8],matrix[9],matrix[10])), Vector3(matrix[12],matrix[13],matrix[14]))

static func vector3s(data: PackedFloat32Array) -> PackedVector3Array:
	return data.to_byte_array().to_vector3_array()

static func vector2s(data: PackedFloat32Array) -> PackedVector2Array:
	return data.to_byte_array().to_vector2_array()

static func mesh(data: Dictionary, terrain := false) -> ArrayMesh:
	var a: Dictionary = data.attributes
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	var points := values(a.position)
	var count := points.size() / 3
	arrays[Mesh.ARRAY_VERTEX] = vector3s(points)
	if a.has("normal"):
		arrays[Mesh.ARRAY_NORMAL] = vector3s(values(a.normal))
	if a.has("aUv") or a.has("uv"):
		arrays[Mesh.ARRAY_TEX_UV] = vector2s(values(a.get("aUv", a.get("uv", {}))))
	var color_key := "aTint" if terrain else "color"
	if a.has(color_key):
		var colors := values(a[color_key])
		var item_size: int = a[color_key].itemSize
		var rgba := PackedColorArray()
		rgba.resize(count)
		for i in count:
			rgba[i] = Color(colors[i*item_size],colors[i*item_size+1],colors[i*item_size+2],colors[i*item_size+3] if item_size == 4 else 1)
		arrays[Mesh.ARRAY_COLOR] = rgba
	var flags := 0
	if terrain:
		arrays[Mesh.ARRAY_CUSTOM0] = values(a.aData)
		arrays[Mesh.ARRAY_CUSTOM1] = values(a.aGrass)
		flags = (Mesh.ARRAY_CUSTOM_RGBA_FLOAT << Mesh.ARRAY_FORMAT_CUSTOM0_SHIFT) | (Mesh.ARRAY_CUSTOM_RGBA_FLOAT << Mesh.ARRAY_FORMAT_CUSTOM1_SHIFT)
	elif a.has("aSway"):
		var sway := values(a.aSway)
		var tint := values(a.get("aTint", {}))
		var uv2 := PackedVector2Array()
		uv2.resize(count)
		for i in count:
			uv2[i] = Vector2(sway[i],tint[i] if tint.size() > i else 1.0)
		arrays[Mesh.ARRAY_TEX_UV2] = uv2
		if a.has("aCard"):
			arrays[Mesh.ARRAY_CUSTOM0] = values(a.aCard)
			flags |= Mesh.ARRAY_CUSTOM_RGB_FLOAT << Mesh.ARRAY_FORMAT_CUSTOM0_SHIFT
	var indices := PackedInt32Array()
	if data.get("index"):
		indices = PackedInt32Array(Array(values(data.index)))
	else:
		indices.resize(count)
		for i in count:
			indices[i] = i
	# Three is counterclockwise; Godot front faces are clockwise.
	for i in range(0, indices.size(), 3):
		var swap := indices[i+1]
		indices[i+1] = indices[i+2]
		indices[i+2] = swap
	arrays[Mesh.ARRAY_INDEX] = indices
	var result := ArrayMesh.new()
	result.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays, [], {}, flags)
	return result

static func resource_mesh(file: String, terrain := false) -> ArrayMesh:
	# Immutable source-buffer hash invalidates cached native meshes after any re-export.
	var signature := FileAccess.get_sha256("res://assets/"+file)
	var directory := "user://native-mesh-cache"
	var path := directory+"/v2-"+signature+("-terrain" if terrain else "-vegetation")+".res"
	if ResourceLoader.exists(path):
		var cached = load(path)
		if cached is ArrayMesh: return cached
	var result := mesh(read_json(file),terrain)
	DirAccess.make_dir_recursive_absolute(directory)
	ResourceSaver.save(result,path)
	return result
