extends "res://scripts/main_tree_build_storage.gd"

func _register_authored_trees() -> void:
	for node in host.get_tree().get_nodes_in_group("editable_trees"):
		var tree := node as UserTree
		if tree != null and tree.is_authored:
			authored_trees[tree.tree_id] = tree
			authored_originals[tree.tree_id] = tree.global_transform

func _save_tree_layout() -> void:
	var records: Array = []
	for child in get_children():
		var tree := child as UserTree
		if tree == null or tree.is_authored or tree.is_build_item or tree.is_queued_for_deletion():
			continue
		if child == placement_tree and not moving_existing_tree:
			continue
		var record := _tree_record(tree, "user")
		if not tree.catalog_item_id.is_empty():
			record["catalog_item_id"] = tree.catalog_item_id
		records.append(record)
	for tree_id in authored_trees:
		if deleted_authored_tree_ids.has(tree_id):
			records.append({"id": tree_id, "kind": "authored", "deleted": true})
			continue
		var tree := authored_trees[tree_id] as UserTree
		if is_instance_valid(tree) and not tree.is_queued_for_deletion() and not tree.global_transform.is_equal_approx(authored_originals[tree_id]):
			records.append(_tree_record(tree, "authored"))
	var file := FileAccess.open(TREE_LAYOUT_PATH, FileAccess.WRITE)
	if file == null:
		tree_status.text = "Could not save this tree layout."
		return
	file.store_string(JSON.stringify({"version": TREE_LAYOUT_VERSION, "trees": records}, "  "))

func _tree_record(tree: UserTree, kind: String) -> Dictionary:
	var position := tree.global_position
	var rotation := tree.global_rotation
	return {
		"id": tree.tree_id,
		"kind": kind,
		"position": [position.x, position.y, position.z],
		"rotation": [rotation.x, rotation.y, rotation.z],
		"scale": tree.size_multiplier,
	}

func _load_tree_layout() -> void:
	var layout_path := TREE_LAYOUT_PATH
	if not FileAccess.file_exists(layout_path):
		# Renaming the Godot project to Pet Town also changes its user:// folder.
		# Read the previous layout once, then save it under the new game name.
		var legacy_path := OS.get_data_dir().path_join("Godot/app_userdata/Grand Moonhaven Pet Town/town_layout.json")
		if not FileAccess.file_exists(legacy_path):
			return
		layout_path = legacy_path
	var file := FileAccess.open(layout_path, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	var version := int(parsed.get("version", 0)) if parsed is Dictionary else 0
	if version not in [1, TREE_LAYOUT_VERSION]:
		tree_status.text = "Saved trees could not be loaded."
		return
	var records = parsed.get("trees", [])
	if not records is Array:
		tree_status.text = "Saved trees could not be loaded."
		return
	var loaded_custom := 0
	var loaded_authored := 0
	for record in records:
		if not record is Dictionary:
			continue
		var kind := "user" if version == 1 else String(record.get("kind", "user"))
		var tree_id := String(record.get("id", "tree-%d" % next_tree_id))
		if kind == "authored":
			var authored := authored_trees.get(tree_id) as UserTree
			if not is_instance_valid(authored):
				continue
			var deleted_value = record.get("deleted", false)
			if typeof(deleted_value) != TYPE_BOOL:
				continue
			if deleted_value:
				deleted_authored_tree_ids[tree_id] = true
				authored.visible = false
				authored.pick_area.collision_layer = 0
				continue
			deleted_authored_tree_ids.erase(tree_id)
			if _apply_tree_record(authored, record, version == 1):
				loaded_authored += 1
			continue
		if kind != "user" or loaded_custom >= MAX_USER_TREES:
			continue
		var catalog_id := String(record.get("catalog_item_id", ""))
		var tree := _make_catalog_tree(catalog_id, tree_id, false) if not catalog_id.is_empty() else USER_TREE_SCENE.instantiate() as UserTree
		if tree == null:
			continue
		if catalog_id.is_empty():
			tree.tree_id = tree_id
			add_child(tree)
		if not _apply_tree_record(tree, record, version == 1):
			tree.queue_free()
			continue
		loaded_custom += 1
		if tree_id.begins_with("tree-"):
			next_tree_id = maxi(next_tree_id, int(tree_id.trim_prefix("tree-")) + 1)
	tree_status.text = "%d custom tree%s and %d authored edit%s loaded." % [loaded_custom, "" if loaded_custom == 1 else "s", loaded_authored, "" if loaded_authored == 1 else "s"]
	if layout_path != TREE_LAYOUT_PATH:
		_save_tree_layout()

func _apply_tree_record(tree: UserTree, record: Dictionary, legacy: bool) -> bool:
	var position_value = record.get("position", [])
	if not position_value is Array or position_value.size() != 3:
		return false
	for component in position_value:
		if typeof(component) not in [TYPE_INT, TYPE_FLOAT]:
			return false
	var rotation := Vector3.ZERO
	if legacy:
		var rotation_y = record.get("rotation_y", 0.0)
		if typeof(rotation_y) not in [TYPE_INT, TYPE_FLOAT]:
			return false
		rotation.y = float(rotation_y)
	else:
		var rotation_value = record.get("rotation", [])
		if not rotation_value is Array or rotation_value.size() != 3:
			return false
		for component in rotation_value:
			if typeof(component) not in [TYPE_INT, TYPE_FLOAT]:
				return false
		rotation = Vector3(float(rotation_value[0]), float(rotation_value[1]), float(rotation_value[2]))
	var saved_scale = record.get("scale", 1.0)
	if typeof(saved_scale) not in [TYPE_INT, TYPE_FLOAT]:
		return false
	tree.global_position = Vector3(float(position_value[0]), float(position_value[1]), float(position_value[2]))
	tree.global_rotation = rotation
	tree.set_size_multiplier(clampf(float(saved_scale), MIN_TREE_SCALE, MAX_TREE_SCALE))
	return true
