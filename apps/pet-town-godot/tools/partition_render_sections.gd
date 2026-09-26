extends "res://tools/partition_render_sections_helpers.gd"
## Offline static batching only. Preserves authored world-space triangles and materials.
## Authored trees are saved as individually addressable UserTree wrappers.
const ORCHARD_TREE_BUILDER := preload("res://tools/orchard_tree_builder.gd")
const EDITABLE_BATCH := preload("res://tools/batch_editable_model.gd")
const MESH_REUSE := preload("res://tools/reuse_mesh_resources.gd")
const SHADOW_BUDGET := preload("res://scripts/town_shadow_budget.gd")
const EXPECTED_AUTHORED_TREES := 328
const EXPECTED_ISLAND_ROOT_TREES := 323

func _initialize() -> void:
	call_deferred("build")

func build() -> void:
	var island = load("res://scenes/warm_island.tscn").instantiate()
	root.add_child(island)
	var discarded_triangles := 0
	for source_name in ["North Meadow Scenic Walk", "South Meadow Scenic Walk"]:
		var unused := island.get_node_or_null(source_name) as MeshInstance3D
		assert(unused != null and not unused.visible, "Expected a hidden scenic-walk mesh")
		assert(_mesh_triangle_count(unused.mesh) == 135200, "Scenic-walk source changed")
		discarded_triangles += _mesh_triangle_count(unused.mesh)
		unused.free()
	var result = Node3D.new()
	result.name = "IslandRenderSections"
	root.add_child(result)
	var editable_trees := Node3D.new()
	editable_trees.name = "EditableTrees"
	result.add_child(editable_trees)
	editable_trees.owner = result
	var editable_objects := Node3D.new()
	editable_objects.name = "EditableObjects"
	result.add_child(editable_objects)
	editable_objects.owner = result
	DirAccess.make_dir_recursive_absolute("res://assets/cozy-island/render_sections")
	var tree_roots: Array[Node3D] = []
	_collect_tree_roots(island, tree_roots)
	tree_roots.sort_custom(func(a: Node3D, b: Node3D) -> bool: return String(a.name) < String(b.name))
	assert(tree_roots.size() == EXPECTED_ISLAND_ROOT_TREES, "Expected 323 named island tree roots, found %d" % tree_roots.size())
	var tree_mesh_ids := {}
	var authored_tree_ids := {}
	var extracted_tree_meshes := 0
	var extracted_tree_triangles := 0
	var orchard: Dictionary = ORCHARD_TREE_BUILDER.add_orchard_trees(island, editable_trees, result, authored_tree_ids, tree_mesh_ids)
	var orchard_tree_count: int = orchard["tree_count"]
	extracted_tree_meshes += int(orchard["tree_mesh_count"])
	extracted_tree_triangles += int(orchard["tree_triangles"])
	var orchard_apple_count: int = orchard["apple_count"]
	var apple_donor := editable_trees.get_child(0) as UserTree
	var donors := {}
	var by_variant := {"round": [], "pine": [], "fir": [], "apple": []}
	for source in tree_roots:
		var variant := _tree_variant(source)
		by_variant[variant].append(source)
		if not donors.has(variant):
			donors[variant] = source
	var replacements := {}
	_assign_replacements(by_variant["round"], 68, "fir", replacements)
	_assign_replacements(by_variant["round"], 48, "apple", replacements, 68)
	_assign_replacements(by_variant["pine"], 29, "apple", replacements)
	_assign_replacements(by_variant["apple"], by_variant["apple"].size(), "apple", replacements)
	var merged_tree_nodes := 0
	var expanded_round_count := 0
	var new_grove_count := 0
	for index in tree_roots.size():
		var source: Node3D = tree_roots[index]
		var tree_id := "island:%s" % String(source.name)
		assert(not authored_tree_ids.has(tree_id), "Duplicate authored tree ID: " + tree_id)
		authored_tree_ids[tree_id] = true
		var replacement := String(replacements.get(source.get_instance_id(), ""))
		var visual_source: Node3D = apple_donor if replacement == "apple" else donors.get(replacement, source)
		var wrapper := _make_tree_wrapper(source, tree_id, "IslandTree_%03d" % index, visual_source)
		var visible_variant := replacement if not replacement.is_empty() else _tree_variant(source)
		wrapper.tree_variant = visible_variant
		merged_tree_nodes += EDITABLE_BATCH.batch(wrapper, 2)
		var hide_dense_tree := false
		if String(source.name).begins_with("Expanded grove ") and visible_variant == "round":
			hide_dense_tree = expanded_round_count % 10 != 0
			expanded_round_count += 1
		elif String(source.name).begins_with("TREE - new grove"):
			hide_dense_tree = new_grove_count % 6 != 0
			new_grove_count += 1
		if hide_dense_tree:
			wrapper.visible = false
		editable_trees.add_child(wrapper)
		if hide_dense_tree:
			wrapper.pick_area.collision_layer = 0
			var hidden_model := wrapper.get_node("AuthoredModel")
			wrapper.remove_child(hidden_model)
			hidden_model.free()
		_set_owner_recursive(wrapper, result)
		for mesh_node in _tree_mesh_instances(source):
			tree_mesh_ids[mesh_node.get_instance_id()] = true
			extracted_tree_meshes += 1
			extracted_tree_triangles += _mesh_triangle_count(mesh_node.mesh)
	var authored_tree_count := tree_roots.size() + orchard_tree_count
	assert(authored_tree_count == EXPECTED_AUTHORED_TREES, "Expected 328 editable island trees, found %d" % authored_tree_count)
	var extracted_object_triangles := 0
	var object_count := 0
	var merged_object_nodes := 0
	for source in island.get_children():
		if not source is Node3D or _is_authored_tree_root(source) or _is_fixed_surface(String(source.name)):
			continue
		var meshes := _tree_mesh_instances(source)
		if meshes.is_empty():
			continue
		var contains_tree := false
		for mesh_node in meshes:
			if tree_mesh_ids.has(mesh_node.get_instance_id()):
				contains_tree = true
				break
		if contains_tree:
			continue
		var name_label := String(source.name)
		var object_id := "%s:%s" % ["surface" if "road" in name_label.to_lower() or "promenade" in name_label.to_lower() else "object", name_label]
		var wrapper := _make_tree_wrapper(source, object_id, "IslandObject_%04d" % object_count)
		merged_object_nodes += EDITABLE_BATCH.batch(wrapper)
		editable_objects.add_child(wrapper)
		_set_owner_recursive(wrapper, result)
		for mesh_node in meshes:
			tree_mesh_ids[mesh_node.get_instance_id()] = true
			extracted_object_triangles += _mesh_triangle_count(mesh_node.mesh)
		object_count += 1
	var tiles := {}
	var triangles := 0
	var source_count := 0
	for node in island.find_children("*", "MeshInstance3D", true, false):
		if tree_mesh_ids.has(node.get_instance_id()):
			continue
		source_count += 1
		var normal_basis: Basis = node.global_basis.inverse().transposed() if absf(node.global_basis.determinant()) > 0.000000000001 else Basis.IDENTITY
		for surface in node.mesh.get_surface_count():
			var arrays = node.mesh.surface_get_arrays(surface)
			var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
			var normals: PackedVector3Array = arrays[Mesh.ARRAY_NORMAL]
			var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
			var uv: PackedVector2Array = arrays[Mesh.ARRAY_TEX_UV] if arrays[Mesh.ARRAY_TEX_UV] != null else PackedVector2Array()
			var uv2: PackedVector2Array = arrays[Mesh.ARRAY_TEX_UV2] if arrays[Mesh.ARRAY_TEX_UV2] != null else PackedVector2Array()
			var colors: PackedColorArray = arrays[Mesh.ARRAY_COLOR] if arrays[Mesh.ARRAY_COLOR] != null else PackedColorArray()
			var tangents: PackedFloat32Array = arrays[Mesh.ARRAY_TANGENT] if arrays[Mesh.ARRAY_TANGENT] != null else PackedFloat32Array()
			var material: Material = node.get_active_material(surface)
			if indices.is_empty():
				for i in vertices.size(): indices.append(i)
			var source_triangles := indices.size() / 3
			var surface_triangles := 0
			for i in range(0, indices.size(), 3):
				var center: Vector3 = (node.global_transform * vertices[indices[i]] + node.global_transform * vertices[indices[i+1]] + node.global_transform * vertices[indices[i+2]]) / 3.0
				var key := Vector2i(floori(center.x / 12.0), floori(center.z / 12.0))
				if not tiles.has(key): tiles[key] = {}
				if not tiles[key].has(material):
					var tool := SurfaceTool.new()
					tool.begin(Mesh.PRIMITIVE_TRIANGLES)
					tool.set_material(material)
					tiles[key][material] = tool
				var tool: SurfaceTool = tiles[key][material]
				for j in 3:
					var vertex_index: int = indices[i+j]
					tool.set_normal((normal_basis * normals[vertex_index]).normalized() if normals.size() > vertex_index else Vector3.UP)
					tool.set_uv(uv[vertex_index] if uv.size() > vertex_index else Vector2.ZERO)
					tool.set_uv2(uv2[vertex_index] if uv2.size() > vertex_index else Vector2.ZERO)
					tool.set_color(colors[vertex_index] if colors.size() > vertex_index else Color.WHITE)
					tool.set_tangent(Plane(Vector3.RIGHT, 1.0))
					if tangents.size() > vertex_index * 4 + 3:
						var tangent: Vector3 = (node.global_basis * Vector3(tangents[vertex_index*4], tangents[vertex_index*4+1], tangents[vertex_index*4+2])).normalized()
						tool.set_tangent(Plane(tangent, tangents[vertex_index*4+3]))
					tool.add_vertex(node.global_transform * vertices[vertex_index])
				triangles += 1
				surface_triangles += 1
			assert(surface_triangles == source_triangles, "Static mesh triangle accounting failed")
	var count := 0
	var output_triangles := 0
	# One draw surface per material and tile.
	for key in tiles:
		for material in tiles[key]:
			var tool: SurfaceTool = tiles[key][material]
			tool.index()
			var mesh := tool.commit()
			output_triangles += mesh.get_faces().size() / 3
			var path := "res://assets/cozy-island/render_sections/section_%04d.res" % count
			mesh.surface_set_material(0, null)
			ResourceSaver.save(mesh, path)
			var part := MeshInstance3D.new()
			part.name = "Section_%04d" % count
			part.mesh = load(path)
			part.set_surface_override_material(0, material)
			if material != null and material.resource_name == "MH midnight turquoise":
				part.visible = false
			result.add_child(part)
			part.owner = result
			count += 1
	assert(output_triangles == triangles, "Static batching lost triangles")
	assert(triangles + extracted_tree_triangles + extracted_object_triangles + discarded_triangles == 574569, "Authored island triangle total changed")
	var reused_meshes: int = MESH_REUSE.canonicalize(result)
	SHADOW_BUDGET.disable_tiny_casters(editable_objects)
	var packed := PackedScene.new()
	packed.pack(result)
	ResourceSaver.save(packed, "res://scenes/island_render_sections.tscn")
	print("BATCHED ", source_count, " original meshes into ", count, " static surfaces; preserved ", triangles, " static triangles, ", extracted_tree_triangles, " tree triangles across ", authored_tree_count, " trees and ", extracted_object_triangles, " triangles across ", object_count, " editable objects; reused ", reused_meshes, " mesh resources")
	quit()
