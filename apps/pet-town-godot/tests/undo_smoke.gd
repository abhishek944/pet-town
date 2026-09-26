extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var previous_dir := OS.get_environment("PET_TOWN_TEST_DATA_DIR")
	var test_dir := OS.get_cache_dir().path_join("pet-town-undo-smoke-%d" % OS.get_process_id())
	DirAccess.make_dir_recursive_absolute(test_dir)
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", test_dir)
	var town := load("res://main.tscn").instantiate() as Node3D
	root.add_child(town)
	town.set_process(false)
	var editor := town.get_node("UserTrees")
	var errors := []
	var house := town.get_node("IslandRenderSections/EditableObjects/IslandObject_0798") as UserTree
	editor.call("_select_user_tree", house)
	if not (editor.get("tree_preview_holder") as Control).visible:
		errors.append("selected object has no panel preview")
	if (editor.get("tree_status") as Label).text.contains("Editing this object"):
		errors.append("removed edit text is still visible")
	var ring := UserTree.shared_ring
	if ring.mesh == null or ring.mesh.get_surface_count() != 2:
		errors.append("selection footprint is missing")
	var old_rotation := house.global_rotation.y
	editor.call("_rotate_selected_tree", 15.0)
	editor.call("_set_selected_tree_scale", 1.25)
	editor.call("_delete_selected_tree")
	if (editor.get("undo_history") as Array).size() != 3:
		errors.append("rotation, scale, and delete were not recorded")
	editor.call("_undo_last_change")
	if not house.visible:
		errors.append("undo did not restore deleted house")
	editor.call("_undo_last_change")
	if not is_equal_approx(house.size_multiplier, 1.0):
		errors.append("undo did not restore scale")
	editor.call("_undo_last_change")
	if not is_equal_approx(house.global_rotation.y, old_rotation):
		errors.append("undo did not restore rotation")
	var old_position := house.global_position
	editor.call("_start_moving_selected_tree")
	await physics_frame
	for point in [Vector2(612, 368), Vector2(612, 500), Vector2(400, 420)]:
		editor.call("_update_tree_placement_preview", point)
		if editor.get("placement_has_surface"):
			break
	if not editor.get("placement_has_surface"):
		errors.append("move undo had no placement surface")
		editor.call("_cancel_tree_placement")
	else:
		editor.call("_commit_tree_placement")
		editor.call("_undo_last_change")
		if not house.global_position.is_equal_approx(old_position):
			errors.append("undo did not restore moved house")
	for index in 12:
		editor.call("_rotate_selected_tree", 15.0)
	if (editor.get("undo_history") as Array).size() != 10:
		errors.append("undo queue did not retain exactly ten changes")
	for index in 10:
		editor.call("_undo_last_change")
	if editor.call("_undo_last_change"):
		errors.append("undo continued beyond ten changes")
	var key_rotation := house.global_rotation.y
	editor.call("_rotate_selected_tree", 15.0)
	var shortcut := InputEventKey.new()
	shortcut.keycode = KEY_Z
	shortcut.meta_pressed = true
	shortcut.pressed = true
	town.call("_input", shortcut)
	if not is_equal_approx(house.global_rotation.y, key_rotation):
		errors.append("Command Z did not undo rotation")
	town.call("_set_town_mode", "build", false)
	var wallet = editor.get("build_wallet")
	wallet.usage["input_tokens"] = 25000
	if not wallet._save_wallet():
		errors.append("test wallet could not save")
	var start_balance: int = wallet.balance()
	editor.call("_start_catalog_item", "rose-cottage")
	await physics_frame
	for point in [Vector2(612, 368), Vector2(612, 500), Vector2(400, 420)]:
		editor.call("_update_tree_placement_preview", point)
		if editor.get("placement_has_surface"):
			break
	if not editor.get("placement_has_surface"):
		errors.append("test cottage had no placement surface")
	else:
		editor.call("_commit_tree_placement")
		if wallet.balance() >= start_balance:
			errors.append("build placement did not charge credits")
		if not editor.call("_undo_last_change"):
			errors.append("build placement could not be undone")
		if wallet.balance() != start_balance:
			errors.append("undo did not refund purchase")
		for child in editor.get_children():
			if child is UserTree and child.is_build_item and not child.is_queued_for_deletion():
				errors.append("undone build object remains")
	print("UNDO SMOKE errors=", errors)
	town.free()
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", previous_dir)
	for name in ["build-wallet.json", "town-mode.json", "town_layout.json", "build_layout.json"]:
		DirAccess.remove_absolute(test_dir.path_join(name))
	DirAccess.remove_absolute(test_dir)
	quit(0 if errors.is_empty() else 1)
