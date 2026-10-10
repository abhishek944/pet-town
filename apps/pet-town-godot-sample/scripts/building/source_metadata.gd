extends RefCounted
const Cache = preload("res://scripts/region/native_cache.gd")
const FaceMesh = preload("face_mesh.gd")
static func ranges(instance: MeshInstance3D, budget: RefCounted) -> Dictionary:
	var id := Cache.key(instance.get_meta("source_file"),"edit-ranges")
	var cached := Cache.read_data(id)
	if cached.has("ranges"):
		if Cache.baking: source_arrays(instance)
		return cached.ranges
	var arrays := source_arrays(instance)
	var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
	var points: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	var attrs: PackedFloat32Array = arrays[Mesh.ARRAY_CUSTOM0]
	var result := {}
	var previous := Vector3i(-2147483648,0,0)
	for index in range(0,indices.size(),3):
		var vertex := indices[index]
		var face := int(attrs[vertex*4+3])%8
		var center := (points[vertex]+points[indices[index+1]]+points[indices[index+2]])/3.0
		var cell := Vector3i((center-Vector3(FaceMesh.NORMALS[face])*0.14).floor())
		if not result.has(cell): result[cell]=[]
		if cell == previous:
			var span: Vector2i = result[cell].back()
			result[cell][-1]=Vector2i(span.x,index+3)
		else: result[cell].append(Vector2i(index,index+3))
		previous=cell
		if budget and index%1536==0: await budget.checkpoint()
	Cache.write_data(id,{"ranges":result})
	return result

static func source_arrays(instance: MeshInstance3D) -> Array:
	var id := Cache.key(instance.get_meta("source_file"),"edit-arrays")
	var cached := Cache.read_data(id)
	if cached.has("arrays"): return cached.arrays
	var arrays := instance.mesh.surface_get_arrays(0)
	Cache.write_data(id,{"arrays":arrays})
	return arrays
