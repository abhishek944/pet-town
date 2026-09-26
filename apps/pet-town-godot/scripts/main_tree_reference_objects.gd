extends "res://scripts/main_tree_state.gd"
const SHADOW_BUDGET := preload("res://scripts/town_shadow_budget.gd")
const PAVERS_SCRIPT := preload("res://scripts/town_pavers.gd")

func _wrap_reference_trees() -> void:
	var details := host.get_node_or_null("TownDecorations/ReferenceGardens/BlenderAuthoredDetails")
	if details == null:
		return
	var flower_groups := {}
	for candidate in details.get_children():
		var source := candidate as Node3D
		if source == null:
			continue
		var label := String(source.name)
		if label.begins_with("FlowerPatch_"):
			_wrap_scene_object(source, "flower:%s" % label)
			continue
		if _is_flower_source(label):
			var key := _reference_tile_key(label)
			if not flower_groups.has(key):
				flower_groups[key] = []
			flower_groups[key].append(source)
			continue
		if label.begins_with("Reference render"):
			continue
		if _is_fixed_reference_surface(label):
			continue
		var surface := "meadow" in label.to_lower() or " water " in label.to_lower()
		_wrap_scene_object(source, "%s:%s" % ["surface" if surface else "reference", label])
	for key in flower_groups:
		var has_petals := false
		for source in flower_groups[key]:
			var label := String(source.name)
			if " pink " in label or " lavender " in label or " white " in label:
				has_petals = true
				break
		if has_petals:
			_wrap_scene_group(flower_groups[key], "flower:%s" % key)
		else:
			for source in flower_groups[key]:
				_wrap_scene_object(source, "reference:%s" % String(source.name))
	paver_registry = PAVERS_SCRIPT.new() as Node3D
	details.add_child(paver_registry)
	paver_registry.call("configure", details, self)
	var decorations := host.get_node_or_null("TownDecorations")
	if decorations != null:
		for candidate in decorations.get_children():
			var source := candidate as Node3D
			if source == null or source.name == "ReferenceGardens":
				continue
			if source.name in ["ExistingLanternLight", "CottageWindowSpill"]:
				_attach_architecture_lights(source)
			elif source is Light3D:
				_attach_effect_light(source)
			else:
				_wrap_scene_object(source, "decoration:%s" % source.name)
	var gardens := host.get_node_or_null("TownDecorations/ReferenceGardens")
	if gardens != null:
		for candidate in gardens.get_children():
			var source := candidate as Node3D
			if source != null and String(source.name).begins_with("GardenWarmLight_"):
				_attach_effect_light(source)

func _attach_architecture_lights(group: Node3D) -> void:
	var buildings: Array[UserTree] = []
	for node in host.get_tree().get_nodes_in_group("editable_trees"):
		var item := node as UserTree
		if item == null or not item.tree_id.begins_with("object:"):
			continue
		if "house" in item.tree_id.to_lower() or "cottage" in item.tree_id.to_lower() or "building" in item.tree_id.to_lower() or "bakery" in item.tree_id.to_lower() or "studio" in item.tree_id.to_lower():
			buildings.append(item)
	for child in group.get_children():
		var light := child as Node3D
		if light == null:
			continue
		var nearest: UserTree
		var best := INF
		for building in buildings:
			var distance := building.global_position.distance_squared_to(light.global_position)
			if String(light.name) in building.tree_id:
				distance *= 0.01
			if distance < best:
				best = distance
				nearest = building
		if nearest != null and best < 144.0:
			light.reparent(nearest, true)

func _attach_effect_light(light: Node3D) -> void:
	var nearest: UserTree
	var best := INF
	for node in host.get_tree().get_nodes_in_group("editable_trees"):
		var item := node as UserTree
		if item == null or not item.visible or item.get_node_or_null("AuthoredModel") == null:
			continue
		if item.find_children("*", "MeshInstance3D", true, false).is_empty():
			continue
		var distance := item.global_position.distance_squared_to(light.global_position)
		if "campfire" in String(light.name).to_lower() and "fire" in item.tree_id.to_lower():
			distance *= 0.01
		if distance < best:
			best = distance
			nearest = item
	if nearest != null and best < 9.0:
		light.reparent(nearest, true)

func _is_fixed_reference_surface(label: String) -> bool:
	var value := label.to_lower()
	for part in ["ocean", "deep sea", "sea glint", "paver"]:
		if part in value:
			return true
	return false

func _is_flower_source(label: String) -> bool:
	if not label.begins_with("Garden detail "):
		return false
	for color in [" pink ", " lavender ", " white ", " leaf ", " leaf light "]:
		if color in label:
			return true
	return false

func _reference_tile_key(label: String) -> String:
	return label.get_slice("[", 1).get_slice("]", 0).replace(",", "_")

func _source_bounds(source: Node3D) -> AABB:
	if source is MeshInstance3D:
		return source.global_transform * (source as MeshInstance3D).get_aabb()
	var bounds := AABB()
	var first := true
	for node in source.find_children("*", "MeshInstance3D", true, false):
		var mesh := node as MeshInstance3D
		var piece := mesh.global_transform * mesh.get_aabb()
		bounds = piece if first else bounds.merge(piece)
		first = false
	return bounds

func _wrap_scene_group(sources: Array, object_id: String) -> void:
	if sources.is_empty():
		return
	var parent := (sources[0] as Node3D).get_parent() as Node3D
	if parent == null:
		return
	var bounds := AABB()
	var first := true
	for source in sources:
		var piece := _source_bounds(source)
		bounds = piece if first else bounds.merge(piece)
		first = false
	var anchor := Vector3(bounds.position.x + bounds.size.x * 0.5, bounds.position.y, bounds.position.z + bounds.size.z * 0.5)
	var wrapper := USER_TREE_SCENE.instantiate() as UserTree
	wrapper.name = "EditableFlowerPatch_" + object_id.get_slice(":", 1)
	wrapper.tree_id = object_id
	wrapper.is_authored = true
	wrapper.transform = parent.global_transform.affine_inverse() * Transform3D(Basis.IDENTITY, anchor)
	_remove_procedural_tree_model(wrapper)
	var model := Node3D.new()
	model.name = "AuthoredModel"
	wrapper.add_child(model)
	parent.add_child(wrapper)
	for source in sources:
		(source as Node3D).reparent(model)
	wrapper.fit_pick_area_to_visuals()

func _wrap_scene_object(source: Node3D, object_id: String) -> void:
	var parent := source.get_parent() as Node3D
	if parent == null:
		return
	var source_index := source.get_index()
	var source_transform := source.global_transform
	var anchor_transform := source_transform
	if source is MeshInstance3D:
		var bounds := _source_bounds(source)
		anchor_transform = Transform3D(Basis.IDENTITY, Vector3(bounds.position.x + bounds.size.x * 0.5, bounds.position.y, bounds.position.z + bounds.size.z * 0.5))
	var tree_transform := parent.global_transform.affine_inverse() * anchor_transform
	var tree := USER_TREE_SCENE.instantiate() as UserTree
	tree.name = "Editable_" + String(source.name)
	tree.tree_id = object_id
	tree.is_authored = true
	tree.transform = tree_transform
	_remove_procedural_tree_model(tree)
	var model := Node3D.new()
	model.name = "AuthoredModel"
	tree.add_child(model)
	parent.add_child(tree)
	parent.move_child(tree, source_index)
	source.reparent(model)
	if object_id.begins_with("decoration:"):
		SHADOW_BUDGET.disable_tiny_casters(model)
	tree.fit_pick_area_to_visuals()

func _remove_procedural_tree_model(tree: UserTree) -> void:
	for child in tree.get_children():
		if child.name in ["SelectionMarker", "PickArea"]:
			continue
		tree.remove_child(child)
		child.free()
