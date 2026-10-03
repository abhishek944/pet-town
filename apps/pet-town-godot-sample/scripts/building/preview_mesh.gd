extends RefCounted
# A cube with full face UVs; BoxMesh packs its six UVs into a texture atlas.
const Faces = preload("face_mesh.gd")

static func cube() -> ArrayMesh:
	var vertices := PackedVector3Array()
	var normals := PackedVector3Array()
	var uv := PackedVector2Array()
	var indices := PackedInt32Array()
	for face in 6:
		var frame: Array = Faces.FRAMES[face]
		var axes: Array = Faces.UV_AXES[face]
		var start := vertices.size()
		for point in [Vector2.ZERO,Vector2.RIGHT,Vector2.ONE,Vector2.DOWN]:
			var local: Vector3 = frame[0]+frame[1]*point.x+frame[2]*point.y
			vertices.append(local-Vector3.ONE*0.5)
			normals.append(Vector3(Faces.NORMALS[face]))
			var tex_uv := Vector2(local[axes[0]],local[axes[1]])
			if face in [0,5]: tex_uv.x = 1.0 - tex_uv.x
			if face == 2: tex_uv.y = 1.0 - tex_uv.y
			uv.append(tex_uv)
		indices.append_array(PackedInt32Array([start,start+2,start+1,start,start+3,start+2]))
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_NORMAL] = normals
	arrays[Mesh.ARRAY_TEX_UV] = uv
	arrays[Mesh.ARRAY_INDEX] = indices
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
	return mesh
