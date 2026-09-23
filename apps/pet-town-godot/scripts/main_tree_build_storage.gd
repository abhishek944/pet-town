extends "res://scripts/main_tree_reference_objects.gd"

const BUILD_LAYOUT_PATH := "user://build_layout.json"

func _catalog_item(item_id: String) -> Dictionary:
	for item in catalog_items:
		if item["id"] == item_id:
			return item
	return {}

func _make_catalog_tree(item_id: String, tree_id: String, for_build := true) -> UserTree:
	var item := _catalog_item(item_id)
	if item.is_empty():
		return null
	var source := authored_trees.get(item["source_id"]) as UserTree
	if not is_instance_valid(source):
		return null
	var source_model := source.get_node_or_null("AuthoredModel") as Node3D
	if source_model == null:
		return null
	var tree := USER_TREE_SCENE.instantiate() as UserTree
	tree.name = "Built_" + tree_id
	tree.tree_id = tree_id
	tree.is_build_item = for_build
	tree.catalog_item_id = item_id
	tree.scale = source.authored_base_scale
	_remove_procedural_tree_model(tree)
	var model := source_model.duplicate(Node.DUPLICATE_SIGNALS | Node.DUPLICATE_GROUPS | Node.DUPLICATE_SCRIPTS) as Node3D
	model.name = "AuthoredModel"
	tree.add_child(model)
	add_child(tree)
	tree.fit_pick_area_to_visuals()
	return tree

func _save_build_layout() -> void:
	var records: Array = []
	for child in get_children():
		var tree := child as UserTree
		if tree == null or not tree.is_build_item or tree.is_queued_for_deletion():
			continue
		if child == placement_tree and not moving_existing_tree:
			continue
		var record: Dictionary = call("_tree_record", tree, "build")
		record["catalog_item_id"] = tree.catalog_item_id
		records.append(record)
	var file := FileAccess.open(BUILD_LAYOUT_PATH, FileAccess.WRITE)
	if file == null:
		tree_status.text = "Could not save the Build island."
		return
	file.store_string(JSON.stringify({"version": 1, "objects": records}, "  "))

func _load_build_layout() -> void:
	if not FileAccess.file_exists(BUILD_LAYOUT_PATH):
		return
	var file := FileAccess.open(BUILD_LAYOUT_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary or int(parsed.get("version", 0)) != 1:
		return
	var records = parsed.get("objects", [])
	if not records is Array:
		return
	for record in records:
		if not record is Dictionary or get_child_count() >= MAX_USER_TREES:
			continue
		var item_id := String(record.get("catalog_item_id", ""))
		var tree_id := String(record.get("id", ""))
		if not tree_id.begins_with("build-"):
			continue
		var tree := _make_catalog_tree(item_id, tree_id)
		if tree == null:
			continue
		if not bool(call("_apply_tree_record", tree, record, false)):
			tree.queue_free()
			continue
		tree.visible = false
		tree.pick_area.collision_layer = 0
		next_build_id = maxi(next_build_id, int(tree_id.trim_prefix("build-")) + 1)
