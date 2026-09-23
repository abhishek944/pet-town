extends "res://scripts/main_tree_ui.gd"

func _start_catalog_item(item_id: String) -> void:
	if get_child_count() >= MAX_USER_TREES:
		tree_status.text = "This island has reached its object limit."
		return
	var item := _catalog_item(item_id)
	if item.is_empty():
		return
	if build_mode and (not build_wallet.load_wallet() or build_wallet.balance() < int(item["price"])):
		tree_status.text = "Earn more token credits to buy %s." % item["name"]
		return
	if placement_active:
		call("_cancel_tree_placement")
	call("_clear_tree_selection")
	var tree_id := "build-%d" % next_build_id if build_mode else "tree-%d" % next_tree_id
	var tree := _make_catalog_tree(item_id, tree_id, build_mode)
	if tree == null:
		tree_status.text = "This object is not available right now."
		return
	if build_mode:
		next_build_id += 1
	else:
		next_tree_id += 1
	placement_tree = tree
	placement_started_from_editor = true
	placement_tree.set_placement_preview(true)
	placement_active = true
	moving_existing_tree = false
	placement_has_surface = false
	tree_editor_open = true
	tree_status.text = "Place %s anywhere on land. Payment happens when you place it." % item["name"] if build_mode else "Place %s anywhere on the island." % item["name"]
	call("_refresh_tree_controls")

func _save_current_layout() -> void:
	if build_mode:
		_save_build_layout()
	else:
		_save_tree_layout()
