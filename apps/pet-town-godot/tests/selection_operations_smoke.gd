extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var test_dir := ProjectSettings.globalize_path("res://../../var/test-checklist/selection-operations")
	DirAccess.make_dir_recursive_absolute(test_dir)
	DirAccess.remove_absolute(test_dir.path_join("town_layout.json"))
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", test_dir)
	var town := load("res://main.tscn").instantiate() as Node3D
	root.add_child(town)
	var editor := town.get_node("UserTrees") as Node3D
	var samples := {}
	var failures := []
	for node in get_nodes_in_group("editable_trees"):
		var item := node as UserTree
		if item == null or not item.is_visible_in_tree():
			continue
		var label := item.tree_id.to_lower()
		if item.tree_id.begins_with("island:"):
			_set_first(samples, "tree", item)
		elif item.tree_id.begins_with("flower:"):
			_set_first(samples, "flower", item)
		elif "bench" in label:
			_set_first(samples, "bench", item)
		elif "lantern" in label and item.tree_id.begins_with("object:"):
			_set_first(samples, "light", item)
		elif "building" in label and item.tree_id.begins_with("object:"):
			_set_first(samples, "house", item)
	for kind in ["tree", "flower", "bench", "light", "house"]:
		if not samples.has(kind):
			failures.append("missing editable %s" % kind)
	var saved := {}
	for kind in samples:
		var item := samples[kind] as UserTree
		var before := item.global_transform
		editor.set("tree_editor_open", true)
		editor.call("_select_user_tree", item)
		if UserTree.ring_owner != item or UserTree.shared_ring.mesh == null:
			failures.append("%s selection failed" % kind)
		editor.call("_rotate_selected_tree", 15.0)
		editor.call("_set_selected_tree_scale", 1.2)
		if is_equal_approx(item.global_rotation.y, before.basis.get_euler().y) or not is_equal_approx(item.size_multiplier, 1.2):
			failures.append("%s rotate or resize failed" % kind)
		editor.call("_start_moving_selected_tree")
		var motion := InputEventMouseMotion.new()
		motion.position = Vector2(640, 520)
		town.call("_input", motion)
		if not bool(editor.get("placement_has_surface")):
			failures.append("%s pointer motion did not update move preview" % kind)
		editor.call("_cancel_tree_placement")
		if not item.global_transform.origin.is_equal_approx(before.origin):
			failures.append("%s move cancel changed position" % kind)
		editor.call("_start_moving_selected_tree")
		var click := InputEventMouseButton.new()
		click.position = Vector2(640, 520)
		click.button_index = MOUSE_BUTTON_LEFT
		click.pressed = true
		town.call("_input", click)
		if bool(editor.get("placement_active")):
			failures.append("%s world click did not commit move" % kind)
			editor.call("_cancel_tree_placement")
		else:
			if item.global_position.distance_to(before.origin) < 0.5 or UserTree.ring_owner != item:
				failures.append("%s move or marker failed" % kind)
		saved[item.tree_id] = {"position": item.global_position, "rotation": item.global_rotation.y, "scale": item.size_multiplier}
		editor.call("_clear_tree_selection")
	town.free()
	var reopened := load("res://main.tscn").instantiate() as Node3D
	root.add_child(reopened)
	var restored: Dictionary = reopened.get_node("UserTrees").get("authored_trees")
	for item_id in saved:
		var item := restored.get(item_id) as UserTree
		var record: Dictionary = saved[item_id]
		if item == null or item.global_position.distance_to(record.position) > 0.05 or absf(item.global_rotation.y - record.rotation) > 0.05 or absf(item.size_multiplier - record.scale) > 0.01:
			failures.append("saved edit did not reload: " + item_id)
	print("SELECTION_OPERATIONS kinds=", samples.keys(), " errors=", failures)
	reopened.free()
	quit(0 if failures.is_empty() else 1)

func _set_first(samples: Dictionary, kind: String, item: UserTree) -> void:
	if not samples.has(kind):
		samples[kind] = item
