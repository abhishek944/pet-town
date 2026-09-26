extends SceneTree

const SCENES := [
	"res://scenes/island_render_sections.scn",
	"res://assets/cozy-island/reference-gardens-editable.glb",
	"res://scenes/reference_gardens_trimmed.scn",
	"res://scenes/reference_gardens.tscn",
	"res://scenes/town_decorations.tscn",
]

func _initialize() -> void:
	call_deferred("_audit")

func _audit() -> void:
	for path in SCENES:
		var scene := load(path) as PackedScene
		var model := scene.instantiate()
		root.add_child(model)
		var meshes := model.find_children("*", "MeshInstance3D", true, false)
		var resource_ids := {}
		var geometry_hashes := {}
		var exact_hashes := {}
		var material_ids := {}
		var repeated := {}
		var triangles := 0
		var hidden_meshes := 0
		var hidden_triangles := 0
		var hidden_largest: Array[Dictionary] = []
		var sea_examples: Array[String] = []
		var sea_meshes := 0
		var sea_triangles := 0
		for candidate in meshes:
			var node := candidate as MeshInstance3D
			if node.mesh == null:
				continue
			var mesh := node.mesh
			var is_sea := String(node.name).to_lower().contains("deep sea") or String(node.name).to_lower().contains("sea glint")
			if is_sea:
				sea_meshes += 1
			if "sea" in String(node.name).to_lower() and sea_examples.size() < 5:
				sea_examples.append(String(node.name))
			if not node.is_visible_in_tree():
				hidden_meshes += 1
			resource_ids[mesh.get_instance_id()] = true
			var geometry_key := 0
			var node_triangles := 0
			var exact_key := 0
			for surface in mesh.get_surface_count():
				var arrays := mesh.surface_get_arrays(surface)
				geometry_key = hash([geometry_key, arrays[Mesh.ARRAY_VERTEX], arrays[Mesh.ARRAY_INDEX]])
				exact_key = hash([exact_key, arrays, mesh.surface_get_material(surface).get_instance_id() if mesh.surface_get_material(surface) != null else 0])
				var material := node.get_active_material(surface)
				if material != null:
					material_ids[material.get_instance_id()] = true
				var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
				var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
				triangles += (indices.size() if not indices.is_empty() else vertices.size()) / 3
				node_triangles += (indices.size() if not indices.is_empty() else vertices.size()) / 3
				if not node.is_visible_in_tree():
					hidden_triangles += (indices.size() if not indices.is_empty() else vertices.size()) / 3
				if is_sea:
					sea_triangles += (indices.size() if not indices.is_empty() else vertices.size()) / 3
			geometry_hashes[geometry_key] = int(geometry_hashes.get(geometry_key, 0)) + 1
			if not node.is_visible_in_tree():
				hidden_largest.append({"name": String(node.name), "parent": String(node.get_parent().get_parent().name) if node.get_parent().get_parent() != null else "", "triangles": node_triangles})
			exact_hashes[exact_key] = int(exact_hashes.get(exact_key, 0)) + 1
			if int(geometry_hashes[geometry_key]) == 2:
				repeated[geometry_key] = String(node.name)
		var duplicated := 0
		var exact_duplicates := 0
		for count in geometry_hashes.values():
			duplicated += maxi(0, int(count) - 1)
		for count in exact_hashes.values():
			exact_duplicates += maxi(0, int(count) - 1)
		print("REUSE_AUDIT %s mesh_nodes=%d mesh_resources=%d geometry_variants=%d duplicate_geometry_nodes=%d exact_duplicate_nodes=%d material_resources=%d triangles=%d hidden_meshes=%d hidden_triangles=%d sea_meshes=%d sea_triangles=%d" % [path, meshes.size(), resource_ids.size(), geometry_hashes.size(), duplicated, exact_duplicates, material_ids.size(), triangles, hidden_meshes, hidden_triangles, sea_meshes, sea_triangles])
		if not sea_examples.is_empty():
			print("SEA_EXAMPLES ", sea_examples)
		if not hidden_largest.is_empty():
			hidden_largest.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a["triangles"]) > int(b["triangles"]))
			print("HIDDEN_LARGEST ", hidden_largest.slice(0, mini(8, hidden_largest.size())))
		model.free()
	quit()
