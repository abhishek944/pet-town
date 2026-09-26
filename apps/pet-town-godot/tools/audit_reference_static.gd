extends SceneTree

func _initialize() -> void:
	call_deferred("_audit")

func _audit() -> void:
	var scene := (load("res://scenes/reference_gardens_trimmed.scn") as PackedScene).instantiate() as Node3D
	root.add_child(scene)
	var groups := {}
	var spatial_groups := {12: {}, 24: {}, 48: {}}
	for candidate in scene.get_children():
		var node := candidate as MeshInstance3D
		if node == null or node.mesh == null:
			continue
		var label := String(node.name)
		var kind := "fixed" if _is_fixed(label) else ("render" if label.begins_with("Reference render") else ("flower" if label.begins_with("Garden detail ") else "editable"))
		if kind in ["fixed", "render"]:
			var center := (node.global_transform * node.get_aabb()).get_center()
			for tile_size in spatial_groups:
				var tile := Vector2i(floori(center.x / tile_size), floori(center.z / tile_size))
				for surface in node.mesh.get_surface_count():
					var material := node.get_active_material(surface)
					var key := "%s:%s:%s" % [tile, material.get_instance_id() if material != null else 0, node.cast_shadow]
					spatial_groups[tile_size][key] = int(spatial_groups[tile_size].get(key, 0)) + 1
		if not groups.has(kind):
			groups[kind] = {"meshes": 0, "triangles": 0, "materials": {}, "examples": []}
		var group: Dictionary = groups[kind]
		group["meshes"] += 1
		if group["examples"].size() < 8:
			group["examples"].append(label)
		for surface in node.mesh.get_surface_count():
			var arrays := node.mesh.surface_get_arrays(surface)
			var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
			var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
			group["triangles"] += (indices.size() if not indices.is_empty() else vertices.size()) / 3
			var material := node.get_active_material(surface)
			group["materials"][material.get_instance_id() if material != null else 0] = true
	for kind in groups:
		var group: Dictionary = groups[kind]
		print("REFERENCE_STATIC kind=%s meshes=%d triangles=%d materials=%d examples=%s" % [kind, group["meshes"], group["triangles"], group["materials"].size(), group["examples"]])
	for tile_size in spatial_groups:
		print("REFERENCE_STATIC_BATCH tile=%d groups=%d" % [tile_size, spatial_groups[tile_size].size()])
	quit()

func _is_fixed(label: String) -> bool:
	var value := label.to_lower()
	for part in ["ocean", "meadow", "road", "path", "water", "grass terrain", "coastal ground", "paving", "ground plane", "paver", "deep sea", "sea glint"]:
		if part in value:
			return true
	return false
