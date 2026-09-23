extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var town: Node3D = load("res://main.tscn").instantiate()
	root.add_child(town)
	town.set_process(false)
	var editor: Node3D = town.get_node("UserTrees")
	var variants := {"round": 0, "pine": 0, "fir": 0, "apple": 0}
	var object_count := 0
	var reference_count := 0
	var flower_count := 0
	var light_count := 0
	var round_tree: UserTree
	var movable_object: UserTree
	for node in get_nodes_in_group("editable_trees"):
		var item := node as UserTree
		if item == null:
			continue
		if item.tree_id.begins_with("object:"):
			object_count += 1
			if movable_object == null and ("Cottage" in item.tree_id or "BUILDING" in item.tree_id):
				movable_object = item
		if item.tree_id.begins_with("reference:"):
			reference_count += 1
		if item.tree_id.begins_with("flower:"):
			flower_count += 1
		if "light" in item.tree_id.to_lower() or "lantern" in item.tree_id.to_lower():
			light_count += 1
		if item.tree_id.begins_with("island:"):
			var names := ""
			for mesh in item.find_children("*", "MeshInstance3D", true, false):
				names += String(mesh.name).to_lower() + " "
			var variant := "round"
			if "faceted apple tree crown" in names:
				variant = "apple"
			elif "layered evergreen crown" in names:
				variant = "pine"
			elif "low-poly fir foliage" in names:
				variant = "fir"
			variants[variant] += 1
			if variant == "round" and round_tree == null:
				round_tree = item
	var errors := []
	if variants != {"round": 82, "pine": 82, "fir": 82, "apple": 82}:
		errors.append("tree mix %s" % str(variants))
	if object_count < 1000 or reference_count < 200 or flower_count < 20 or light_count < 100:
		errors.append("too few editable objects: island=%d reference=%d flower=%d light=%d" % [object_count, reference_count, flower_count, light_count])
	if round_tree == null or not round_tree.pick_area.get_node("CollisionShape3D").shape is BoxShape3D:
		errors.append("round canopy lacks full pick area")
	if round_tree != null:
		round_tree.set_selected(true)
		if not round_tree.selection_crown_ring.visible or round_tree.selection_crown_ring.global_position.y <= round_tree.selection_marker.global_position.y:
			errors.append("selection ring is hidden")
		round_tree.set_selected(false)
		await physics_frame
		town.set("camera_target", round_tree.global_position)
		town.set("camera_distance", 28.0)
		town.call("_update_camera")
		var camera := town.get_node("OrbitCamera") as Camera3D
		var screen_position := camera.unproject_position(round_tree.pick_area.global_position)
		if editor.call("_pick_user_tree", screen_position) == null:
			errors.append("round canopy cannot be picked")
	if movable_object != null:
		editor.call("_select_user_tree", movable_object)
		var original := movable_object.global_transform
		editor.call("_start_moving_selected_tree")
		editor.call("_update_tree_placement_preview", Vector2(640, 520))
		if not bool(editor.get("placement_has_surface")) or movable_object.global_position.distance_to(original.origin) < 0.5:
			errors.append("move preview did not reach the town surface")
		editor.call("_cancel_tree_placement")
		if not movable_object.global_transform.is_equal_approx(original):
			errors.append("move cancel changed the object")
	else:
		errors.append("no movable house found")
	print("EDITABLE OBJECTS island=", object_count, " reference=", reference_count, " flowers=", flower_count, " lights=", light_count, " variants=", variants, " errors=", errors)
	town.free()
	quit(0 if errors.is_empty() else 1)
