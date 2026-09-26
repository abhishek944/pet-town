extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var test_dir := ProjectSettings.globalize_path("res://../../var/test-checklist/paver-selection")
	DirAccess.make_dir_recursive_absolute(test_dir)
	DirAccess.remove_absolute(test_dir.path_join("town_layout.json"))
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", test_dir)
	var town := (load("res://main.tscn") as PackedScene).instantiate() as Node3D
	root.add_child(town)
	var editor := town.get_node("UserTrees")
	var registry := editor.get("paver_registry") as Node3D
	var failures := []
	var stones: Array = registry.get("stones")
	if stones.size() != 5323:
		failures.append("expected 5323 individually selectable pavers, found %d" % stones.size())
	var ids := {}
	var cells: Dictionary = registry.get("cells")
	for index in stones.size():
		var stone: Dictionary = stones[index]
		var id: String = stone["id"]
		var center: Vector3 = (stone["bounds"] as AABB).get_center()
		if ids.has(id) or not cells.get(registry.call("_cell", center), []).has(index):
			failures.append("duplicate or unindexed paving stone: " + id)
			break
		ids[id] = true
	var first: Dictionary = {}
	for stone in stones:
		if not (registry.get("converted") as Dictionary).has(stone["id"]):
			first = stone
			break
	var bounds: AABB = first["bounds"]
	var paver := registry.call("pick", bounds.get_center()) as UserTree
	if paver == null or paver.tree_id != first["id"]:
		failures.append("picking first authored stone failed")
	else:
		editor.call("_select_user_tree", paver)
		if UserTree.ring_owner != paver or paver.selection_outline.size() < 3:
			failures.append("stone selection marker missing")
		var start := paver.global_position
		editor.call("_rotate_selected_tree", 15.0)
		editor.call("_set_selected_tree_scale", 1.2)
		paver.global_position += Vector3(2.0, 0.0, 0.0)
		editor.call("_save_tree_layout")
		if paver.global_position.is_equal_approx(start):
			failures.append("stone did not move")
		if registry.call("pick", bounds.get_center()) == paver:
			failures.append("moved stone still selects at its old location")
		var layout := JSON.parse_string(FileAccess.get_file_as_string(test_dir.path_join("town_layout.json"))) as Dictionary
		if layout == null or not layout.get("trees", []).any(func(record: Dictionary) -> bool: return record.get("id") == paver.tree_id):
			failures.append("moved stone was not saved")
	await physics_frame
	var camera := town.get_node("OrbitCamera") as Camera3D
	var screen_hit := false
	for stone in stones:
		var center: Vector3 = (stone["bounds"] as AABB).get_center()
		if camera.is_position_behind(center):
			continue
		var screen := camera.unproject_position(center)
		if not Rect2(Vector2.ZERO, camera.get_viewport().get_visible_rect().size).has_point(screen):
			continue
		var click := InputEventMouseButton.new()
		click.button_index = MOUSE_BUTTON_LEFT
		click.pressed = true
		click.double_click = true
		click.position = screen
		var handled := bool(editor.call("_handle_tree_customization_input", click))
		var active := editor.get("selected_user_tree") as UserTree
		if handled and active != null and active.tree_id.begins_with("paver:"):
			screen_hit = true
			break
	if not screen_hit:
		failures.append("visible paving could not be selected through a screen double-click")
	editor.call("_select_user_tree", paver)
	editor.call("_delete_selected_tree")
	if paver.visible or not editor.get("deleted_authored_tree_ids").has(paver.tree_id):
		failures.append("stone deletion failed")
	if not bool(editor.call("_undo_last_change")) or not paver.visible:
		failures.append("stone deletion undo failed")
	print("PAVER_SELECTION stones=", stones.size(), " errors=", failures)
	town.free()
	var reloaded := (load("res://main.tscn") as PackedScene).instantiate() as Node3D
	root.add_child(reloaded)
	var restored := (reloaded.get_node("UserTrees").get("authored_trees") as Dictionary).get(first["id"]) as UserTree
	if restored == null or not is_equal_approx(restored.size_multiplier, 1.2):
		failures.append("edited stone did not reload")
	print("PAVER_RELOAD errors=", failures)
	reloaded.free()
	quit(0 if failures.is_empty() else 1)
