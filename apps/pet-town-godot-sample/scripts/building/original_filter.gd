extends RefCounted
# Filter immutable source triangles by contiguous cell ranges, reusing physics bodies.
const FLAGS=(Mesh.ARRAY_CUSTOM_RGBA_FLOAT<<Mesh.ARRAY_FORMAT_CUSTOM0_SHIFT)|(Mesh.ARRAY_CUSTOM_RGBA_FLOAT<<Mesh.ARRAY_FORMAT_CUSTOM1_SHIFT)

static func prepare(record: Dictionary) -> void:
	var ranges: Dictionary={}
	var cells: Array=record.cells
	var start:=0
	while start<cells.size():
		var cell: Vector3i=cells[start]
		var end:=start+1
		while end<cells.size() and cells[end]==cell: end+=1
		if not ranges.has(cell): ranges[cell]=[]
		ranges[cell].append(Vector2i(start*3,end*3))
		start=end
	record.ranges=ranges
	record.hidden={}
	record.collider=null
	for body in record.node.get_children():
		if not body is StaticBody3D: continue
		for child in body.get_children():
			if child is CollisionShape3D: record.collider=child
	record.cache=[{"hidden":{},"mesh":record.mesh,"shape":record.collider.shape if record.collider else null}]

static func apply(record: Dictionary,replaced: Dictionary) -> void:
	var hidden: Dictionary={}
	for cell in record.ranges:
		if replaced.has(cell): hidden[cell]=true
	if hidden==record.hidden: return
	record.hidden=hidden
	for cached in record.cache:
		if cached.hidden==hidden:
			install(record,cached)
			return
	var original: PackedInt32Array=record.arrays[Mesh.ARRAY_INDEX]
	var kept:=PackedInt32Array()
	for cell in record.ranges:
		if hidden.has(cell): continue
		for span in record.ranges[cell]: kept.append_array(original.slice(span.x,span.y))
	var mesh: ArrayMesh
	var shape: Shape3D
	if not kept.is_empty():
		var arrays: Array=record.arrays.duplicate()
		arrays[Mesh.ARRAY_INDEX]=kept
		mesh=ArrayMesh.new()
		mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays,[],{},FLAGS)
		if not record.lip: shape=mesh.create_trimesh_shape()
	var cached:={"hidden":hidden,"mesh":mesh,"shape":shape}
	record.cache.append(cached)
	# Keep the pristine source and two recent masks for rapid undo/redo.
	if record.cache.size()>3: record.cache.remove_at(1)
	install(record,cached)

static func install(record: Dictionary,cached: Dictionary) -> void:
	record.node.visible=cached.mesh!=null
	if cached.mesh: record.node.mesh=cached.mesh
	if record.collider: record.collider.shape=cached.shape
