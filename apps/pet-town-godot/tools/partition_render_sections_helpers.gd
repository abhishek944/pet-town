extends SceneTree
const USER_TREE_SCENE := preload("res://scenes/user_tree.tscn")

func _is_fixed_surface(label: String) -> bool:
	var value := label.to_lower()
	for part in ["tenfold broad terraced island", "ocean", "deep sea", "sea glint"]:
		if part in value:
			return true
	for effect in ["anim dancing fire tongue", "anim drifting firefly", "anim rising ember", "anim lighthouse rotating beacon", "anim windmill single rigid rotor"]:
		if value.begins_with(effect):
			return true
	return false

func _is_authored_tree_root(node: Node) -> bool:
	var node_name := String(node.name)
	return node_name == "ANIM forest tree" \
		or node_name.begins_with("ANIM forest tree.") \
		or node_name.begins_with("ANIM forest tree_") \
		or node_name == "TREE - complete low-poly tree" \
		or node_name.begins_with("TREE - new grove") \
		or (node_name.begins_with("Expanded grove ") and node_name.contains("| ANIM forest tree"))

func _tree_variant(source: Node3D) -> String:
	for mesh in _tree_mesh_instances(source):
		var label := String(mesh.name).to_lower()
		if "low-poly fir foliage" in label:
			return "fir"
		if "layered evergreen crown" in label:
			return "pine"
		if "faceted apple tree crown" in label:
			return "apple"
	return "round"

func _assign_replacements(sources: Array, count: int, variant: String, replacements: Dictionary, offset := 0) -> void:
	var shuffled := sources.duplicate()
	shuffled.sort_custom(func(a: Node3D, b: Node3D) -> bool: return String(a.name).hash() < String(b.name).hash())
	for index in range(offset, mini(offset + count, shuffled.size())):
		replacements[shuffled[index].get_instance_id()] = variant

func _collect_tree_roots(parent: Node, result: Array[Node3D]) -> void:
	for child in parent.get_children():
		if child is Node3D and _is_authored_tree_root(child) and not _tree_mesh_instances(child).is_empty():
			result.append(child as Node3D)
			continue
		_collect_tree_roots(child, result)

func _tree_mesh_instances(source: Node) -> Array[MeshInstance3D]:
	var meshes: Array[MeshInstance3D] = []
	if source is MeshInstance3D and (source as MeshInstance3D).mesh != null:
		meshes.append(source as MeshInstance3D)
	for candidate in source.find_children("*", "MeshInstance3D", true, false):
		var mesh := candidate as MeshInstance3D
		if mesh != null and mesh.mesh != null:
			meshes.append(mesh)
	return meshes

func _make_tree_wrapper(source: Node3D, tree_id: String, node_name: String, visual_source: Node3D = null) -> UserTree:
	var tree := USER_TREE_SCENE.instantiate() as UserTree
	tree.name = node_name
	tree.tree_id = tree_id
	tree.is_authored = true
	tree.transform = source.global_transform
	for child in tree.get_children():
		if child.name in ["SelectionMarker", "PickArea"]:
			continue
		tree.remove_child(child)
		child.free()
	var model := Node3D.new()
	model.name = "AuthoredModel"
	tree.add_child(model)
	if visual_source is UserTree:
		for part in visual_source.get_node("AuthoredModel").get_children():
			model.add_child(part.duplicate())
	else:
		var copy := (visual_source if visual_source != null else source).duplicate() as Node3D
		copy.name = "SourceModel"
		copy.transform = Transform3D.IDENTITY
		model.add_child(copy)
	return tree

func _set_owner_recursive(node: Node, scene_owner: Node) -> void:
	node.owner = scene_owner
	for child in node.get_children():
		_set_owner_recursive(child, scene_owner)

func _mesh_triangle_count(mesh: Mesh) -> int:
	var total := 0
	for surface in mesh.get_surface_count():
		var arrays := mesh.surface_get_arrays(surface)
		var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
		var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
		total += (indices.size() if not indices.is_empty() else vertices.size()) / 3
	return total
