extends RefCounted
const Shading = preload("res://scripts/wildlife/creature.gdshader")

static func apply(node: Node) -> void:
	if node is MeshInstance3D and node.mesh:
		for index in node.mesh.get_surface_count():
			var arrays: Array = node.mesh.surface_get_arrays(index)
			var material: Material = node.get_active_material(index)
			# Transparent jelly and decals retain source map/alpha behavior.
			if arrays[Mesh.ARRAY_TEX_UV2] != null and arrays[Mesh.ARRAY_TEX_UV2].size() > 0 and material is StandardMaterial3D and material.transparency == BaseMaterial3D.TRANSPARENCY_DISABLED:
				var shader := ShaderMaterial.new()
				shader.shader = Shading
				node.set_surface_override_material(index, shader)
	for child in node.get_children():
		apply(child)
