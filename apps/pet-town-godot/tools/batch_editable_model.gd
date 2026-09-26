class_name BatchEditableModel
extends RefCounted

## Merge the visual pieces of a single movable object, never across objects.
## The wrapper, ID, transform, and pick area remain independently editable.
static func batch(wrapper: UserTree, minimum_meshes := 20) -> int:
	var model := wrapper.get_node_or_null("AuthoredModel") as Node3D
	if model == null:
		return 0
	var meshes: Array[MeshInstance3D] = []
	for child in model.find_children("*", "MeshInstance3D", true, false):
		meshes.append(child as MeshInstance3D)
	if meshes.size() < minimum_meshes or not model.find_children("*", "AnimationPlayer", true, false).is_empty():
		return 0
	var tools := {}
	var triangles_before := 0
	for piece in meshes:
		if piece.mesh == null or not piece.visible or piece.material_override != null:
			return 0
		var local := piece.transform
		var cursor := piece.get_parent()
		while cursor != model:
			if not cursor is Node3D:
				return 0
			local = (cursor as Node3D).transform * local
			cursor = cursor.get_parent()
		for surface in piece.mesh.get_surface_count():
			if piece.mesh.surface_get_primitive_type(surface) != Mesh.PRIMITIVE_TRIANGLES:
				return 0
			var material := piece.get_active_material(surface)
			var key := "%d:%d" % [material.get_instance_id() if material != null else 0, piece.cast_shadow]
			if not tools.has(key):
				var tool := SurfaceTool.new()
				tool.begin(Mesh.PRIMITIVE_TRIANGLES)
				tool.set_material(material)
				tools[key] = {"tool": tool, "shadow": piece.cast_shadow}
			(tools[key]["tool"] as SurfaceTool).append_from(piece.mesh, surface, local)
			triangles_before += _triangles(piece.mesh, surface)
	if tools.size() >= meshes.size():
		return 0
	var merged: Array[MeshInstance3D] = []
	var triangles_after := 0
	for key in tools:
		var tool := tools[key]["tool"] as SurfaceTool
		tool.index()
		var mesh := tool.commit()
		for surface in mesh.get_surface_count():
			triangles_after += _triangles(mesh, surface)
		var visual := MeshInstance3D.new()
		visual.name = "MergedVisual_%03d" % merged.size()
		visual.mesh = mesh
		visual.cast_shadow = tools[key]["shadow"]
		merged.append(visual)
	assert(triangles_after == triangles_before, "Editable object batching lost triangles")
	for child in model.get_children():
		model.remove_child(child)
		child.free()
	for visual in merged:
		model.add_child(visual)
	return meshes.size() - merged.size()

static func _triangles(mesh: Mesh, surface: int) -> int:
	var arrays := mesh.surface_get_arrays(surface)
	var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
	var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	return (indices.size() if not indices.is_empty() else vertices.size()) / 3
