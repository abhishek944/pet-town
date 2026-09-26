extends "res://scripts/main_tree_build_storage.gd"

const UNDO_LIMIT := 10

func _selected_undo_state() -> Dictionary:
	return _item_undo_state(selected_user_tree)

func _item_undo_state(item: UserTree) -> Dictionary:
	if not is_instance_valid(item):
		return {}
	return {
		"id": item.tree_id,
		"mode": "build" if item.is_build_item else "chill",
		"exists": true,
		"authored": item.is_authored,
		"catalog_item_id": item.catalog_item_id,
		"visible": item.visible,
		"record": call("_tree_record", item, "authored" if item.is_authored else "user"),
	}

func _push_undo_state(before: Dictionary, force := false) -> void:
	if before.is_empty():
		return
	var item := _find_undo_item(String(before["id"]))
	if not force and before == _item_undo_state(item):
		return
	undo_history.append(before.duplicate(true))
	if undo_history.size() > UNDO_LIMIT:
		undo_history.pop_front()

func _find_undo_item(item_id: String) -> UserTree:
	if authored_trees.has(item_id):
		return authored_trees[item_id] as UserTree
	for child in get_children():
		var item := child as UserTree
		if item != null and item.tree_id == item_id and not item.is_queued_for_deletion():
			return item
	return null

func _undo_last_change() -> bool:
	if undo_history.is_empty():
		return false
	if placement_active:
		call("_cancel_tree_placement")
	var before: Dictionary = undo_history.pop_back()
	if build_mode != (String(before["mode"]) == "build"):
		host.call("_set_town_mode", String(before["mode"]), false)
	call("_clear_tree_selection")
	var item := _find_undo_item(String(before["id"]))
	if not bool(before["exists"]):
		if is_instance_valid(item):
			item.set_selected(false)
			item.queue_free()
		if int(before.get("refund", 0)) > 0:
			build_wallet.undo_last_purchase(String(before["catalog_item_id"]), int(before["refund"]))
	else:
		if not is_instance_valid(item):
			var catalog_id := String(before.get("catalog_item_id", ""))
			item = _make_catalog_tree(catalog_id, String(before["id"]), String(before["mode"]) == "build") if not catalog_id.is_empty() else USER_TREE_SCENE.instantiate() as UserTree
			if item == null:
				return false
			if catalog_id.is_empty():
				item.tree_id = String(before["id"])
				add_child(item)
		call("_apply_tree_record", item, before["record"], false)
		item.visible = bool(before["visible"])
		item.pick_area.collision_layer = 4 if item.visible else 0
		deleted_authored_tree_ids.erase(item.tree_id)
		if not item.visible and item.is_authored:
			deleted_authored_tree_ids[item.tree_id] = true
		if item.visible:
			tree_editor_open = true
			call("_select_user_tree", item)
	call("_save_current_layout")
	tree_status.text = "Last change undone."
	tree_status.visible = true
	return true
