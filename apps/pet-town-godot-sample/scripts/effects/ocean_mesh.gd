extends RefCounted
## Preserve the local water grid; progressively coarser rows reach the horizon.
const REACH := 4096.0

static func create(size: Vector2) -> ArrayMesh:
	var xs := _axis(size.x)
	var zs := _axis(size.y)
	var vertices := PackedVector3Array()
	var normals := PackedVector3Array()
	var indices := PackedInt32Array()
	vertices.resize(xs.size() * zs.size())
	normals.resize(vertices.size())
	normals.fill(Vector3.UP)
	for z in zs.size():
		for x in xs.size(): vertices[z * xs.size() + x] = Vector3(xs[x], 0, zs[z])
	indices.resize((xs.size() - 1) * (zs.size() - 1) * 6)
	var at := 0
	for z in zs.size() - 1:
		for x in xs.size() - 1:
			var a := z * xs.size() + x
			for index in [a, a + xs.size(), a + 1, a + 1, a + xs.size(), a + xs.size() + 1]:
				indices[at] = index
				at += 1
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_NORMAL] = normals
	arrays[Mesh.ARRAY_INDEX] = indices
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return mesh

static func _axis(length: float) -> PackedFloat32Array:
	var result := PackedFloat32Array()
	var steps := ceili(length) + 1
	var offset := REACH
	while offset >= 1:
		result.append(-length * 0.5 - offset)
		offset *= 0.5
	for i in steps + 1: result.append(-length * 0.5 + length * i / steps)
	offset = 1
	while offset <= REACH:
		result.append(length * 0.5 + offset)
		offset *= 2
	return result
