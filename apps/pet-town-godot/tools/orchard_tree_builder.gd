extends RefCounted

const USER_TREE_SCENE := preload("res://scenes/user_tree.tscn")
const EXPECTED_TREES := 5
const EXPECTED_CROWNS := 15
const EXPECTED_APPLES := 40

static func add_orchard_trees(island: Node3D, editable_trees: Node3D, scene_owner: Node, authored_ids: Dictionary, tree_mesh_ids: Dictionary) -> Dictionary:
	var trunks := _find_named_meshes(island, "Orchard trunk")
	var crowns := _find_named_meshes(island, "Faceted apple tree crown")
	var apples := _find_named_meshes(island, "Sparse orchard apples")
	assert(trunks.size() == EXPECTED_TREES, "Expected five orchard trunks")
	assert(crowns.size() == EXPECTED_CROWNS, "Expected 15 orchard crowns")
	assert(apples.size() == EXPECTED_APPLES, "Expected 40 harvest apples")
	var tree_mesh_count := 0
	var tree_triangles := 0
	var apple_count := 0
	for index in trunks.size():
		var trunk := trunks[index]
		var tree_crowns := _nearby_meshes(crowns, trunk.global_position, 1.0)
		var tree_apples := _nearby_meshes(apples, trunk.global_position, 0.8)
		assert(tree_crowns.size() == 3 and tree_apples.size() == 8, "Unexpected orchard parts for " + String(trunk.name))
		var parts: Array[MeshInstance3D] = [trunk]
		parts.append_array(tree_crowns)
		parts.append_array(tree_apples)
		var tree_id := "island:orchard:%s" % String(trunk.name)
		assert(not authored_ids.has(tree_id), "Duplicate authored tree ID: " + tree_id)
		authored_ids[tree_id] = true
		var wrapper := _make_tree_wrapper(trunk, parts, editable_trees, tree_id, "OrchardTree_%03d" % index)
		editable_trees.add_child(wrapper)
		_set_owner_recursive(wrapper, scene_owner)
		for part in parts:
			tree_mesh_ids[part.get_instance_id()] = true
			if part not in tree_apples:
				tree_mesh_count += 1
				tree_triangles += _mesh_triangle_count(part.mesh)
		apple_count += tree_apples.size()
	assert(apple_count == EXPECTED_APPLES, "Not all harvest apples were assigned to orchard trees")
	return {"tree_count": trunks.size(), "tree_mesh_count": tree_mesh_count,
		"tree_triangles": tree_triangles, "apple_count": apple_count}

static func _find_named_meshes(parent: Node, prefix: String) -> Array[MeshInstance3D]:
	var meshes: Array[MeshInstance3D] = []
	for candidate in parent.find_children("*", "MeshInstance3D", true, false):
		var mesh := candidate as MeshInstance3D
		if mesh == null or mesh.mesh == null:
			continue
		var name := String(mesh.name)
		if name == prefix or name.begins_with(prefix + "_"):
			meshes.append(mesh)
	meshes.sort_custom(func(a: MeshInstance3D, b: MeshInstance3D) -> bool: return String(a.name) < String(b.name))
	return meshes

static func _nearby_meshes(meshes: Array[MeshInstance3D], origin: Vector3, radius: float) -> Array[MeshInstance3D]:
	var nearby: Array[MeshInstance3D] = []
	for mesh in meshes:
		var position := mesh.global_position
		if Vector2(position.x - origin.x, position.z - origin.z).length() <= radius:
			nearby.append(mesh)
	return nearby

static func _make_tree_wrapper(source_root: Node3D, parts: Array[MeshInstance3D], parent: Node3D, tree_id: String, node_name: String) -> UserTree:
	var tree := USER_TREE_SCENE.instantiate() as UserTree
	tree.name = node_name
	tree.tree_id = tree_id
	tree.is_authored = true
	tree.tree_variant = "apple"
	tree.transform = parent.global_transform.affine_inverse() * source_root.global_transform
	for child in tree.get_children():
		if child.name in ["SelectionMarker", "PickArea"]:
			continue
		tree.remove_child(child)
		child.free()
	var model := Node3D.new()
	model.name = "AuthoredModel"
	tree.add_child(model)
	var source_inverse := source_root.global_transform.affine_inverse()
	for source in parts:
		var copy := source.duplicate() as MeshInstance3D
		copy.transform = source_inverse * source.global_transform
		model.add_child(copy)
	return tree

static func _set_owner_recursive(node: Node, scene_owner: Node) -> void:
	node.owner = scene_owner
	for child in node.get_children():
		_set_owner_recursive(child, scene_owner)

static func _mesh_triangle_count(mesh: Mesh) -> int:
	var total := 0
	for surface in mesh.get_surface_count():
		var arrays := mesh.surface_get_arrays(surface)
		var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
		var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
		total += (indices.size() if not indices.is_empty() else vertices.size()) / 3
	return total
