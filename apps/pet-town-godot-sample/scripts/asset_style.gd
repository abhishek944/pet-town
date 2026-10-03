extends RefCounted

# glTF contains the source town's linear vertex colors. Enable them explicitly
# on imported standard materials rather than losing painted roofs/fur/leaves.
static func apply(root: Node) -> void:
	if root is MeshInstance3D and root.mesh:
		for surface in range(root.mesh.get_surface_count()):
			var arrays = root.mesh.surface_get_arrays(surface)
			var colors = arrays[Mesh.ARRAY_COLOR]
			var material = root.mesh.surface_get_material(surface)
			if material is StandardMaterial3D and colors != null and colors.size() > 0:
				var painted := material.duplicate() as StandardMaterial3D
				painted.vertex_color_use_as_albedo = true
				painted.vertex_color_is_srgb = false
				root.set_surface_override_material(surface, painted)
	for child in root.get_children():
		apply(child)
