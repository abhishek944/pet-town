extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var test_dir := ProjectSettings.globalize_path("res://../../var/test-checklist/editable-objects")
	DirAccess.make_dir_recursive_absolute(test_dir)
	DirAccess.remove_absolute(test_dir.path_join("town_layout.json"))
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", test_dir)
	var town: Node3D = load("res://main.tscn").instantiate()
	root.add_child(town)
	town.set_process(false)
	var editor: Node3D = town.get_node("UserTrees")
	var variants := {"round": 0, "pine": 0, "fir": 0, "apple": 0}
	var object_count := 0
	var reference_count := 0
	var flower_count := 0
	var light_count := 0
	var surface_count := 0
	var errors := []
	var round_tree: UserTree
	var movable_object: UserTree
	var scattered_stones: UserTree
	var flower_patch: UserTree
	for node in get_nodes_in_group("editable_trees"):
		var item := node as UserTree
		if item == null:
			continue
		if item.tree_id.begins_with("object:"):
			object_count += 1
			if movable_object == null and item.visible and ("Cottage" in item.tree_id or "BUILDING" in item.tree_id):
				movable_object = item
		if item.tree_id.begins_with("reference:"):
			reference_count += 1
			if item.tree_id == "reference:Garden detail stone [1,0]":
				scattered_stones = item
		if item.tree_id.begins_with("flower:"):
			flower_count += 1
			if flower_patch == null and item.visible:
				flower_patch = item
		if item.tree_id.begins_with("surface:"):
			surface_count += 1
		if "light" in item.tree_id.to_lower() or "lantern" in item.tree_id.to_lower():
			light_count += 1
		if item.tree_id.begins_with("island:"):
			var variant := item.tree_variant
			if not variants.has(variant):
				errors.append("unrecognized tree variant: %s" % variant)
				continue
			variants[variant] += 1
			if variant == "round" and round_tree == null and item.visible:
				round_tree = item
	if variants != {"round": 82, "pine": 82, "fir": 82, "apple": 82}:
		errors.append("tree mix %s" % str(variants))
	if object_count < 1500 or reference_count < 200 or flower_count < 20 or light_count < 100 or surface_count < 40:
		errors.append("too few editable objects: island=%d reference=%d flower=%d light=%d" % [object_count, reference_count, flower_count, light_count])
	if round_tree == null or not round_tree.pick_area.get_node("CollisionShape3D").shape is BoxShape3D:
		errors.append("round canopy lacks full pick area")
	var rest_garden := _find_by_id("object:PLACE - village rest garden")
	var camera := town.get_node("OrbitCamera") as Camera3D
	if rest_garden == null or rest_garden.tree_id != "object:PLACE - village rest garden":
		errors.append("central circular garden regression object is missing")
	else:
		var garden_point := camera.unproject_position(rest_garden.pick_area.global_position)
		var picked_garden := editor.call("_pick_user_tree", garden_point) as UserTree
		if picked_garden != rest_garden:
			errors.append("clicking the circular garden selects a different object")
		else:
			editor.set("tree_editor_open", true)
			editor.call("_select_user_tree", picked_garden)
			if UserTree.ring_owner != rest_garden or UserTree.shared_ring.mesh == null or not _ring_on_surface(rest_garden):
				errors.append("circular garden marker appears away from the selected feature")
			var garden_start := rest_garden.global_position
			editor.call("_start_moving_selected_tree")
			editor.call("_update_tree_placement_preview", Vector2(640, 520))
			if bool(editor.get("placement_has_surface")):
				editor.call("_commit_tree_placement")
				if rest_garden.global_position.distance_to(garden_start) < 0.5 or UserTree.ring_owner != rest_garden:
					errors.append("circular garden move or marker failed")
			else:
				errors.append("circular garden has no move destination")
			editor.call("_clear_tree_selection")
	if round_tree != null:
		round_tree.set_selected(true)
		if not is_instance_valid(UserTree.shared_ring) or not UserTree.shared_ring.visible or not _ring_on_surface(round_tree):
			errors.append("tree selection ring is not on the ground")
		round_tree.set_selected(false)
		await physics_frame
		town.set("camera_target", round_tree.global_position)
		town.set("camera_distance", 28.0)
		town.call("_update_camera")
		var screen_position := camera.unproject_position(round_tree.pick_area.global_position)
		if editor.call("_pick_user_tree", screen_position) == null:
			errors.append("round canopy cannot be picked")
	if scattered_stones == null:
		errors.append("garden stone regression object is missing")
	else:
		var stone_shape := scattered_stones.pick_area.get_node("CollisionShape3D") as CollisionShape3D
		if not stone_shape.shape is ConcavePolygonShape3D:
			errors.append("scattered stones still use a tile-wide pick box")
		var clicked_stone := Vector3(16.5, 2.0, -14.0)
		scattered_stones.set_selection_hit_position(clicked_stone)
		scattered_stones.set_selected(true)
		if Vector2(UserTree.shared_ring.global_position.x, UserTree.shared_ring.global_position.z).distance_to(Vector2(clicked_stone.x, clicked_stone.z)) > 0.01 or not _ring_on_surface(scattered_stones):
			errors.append("garden detail ring does not follow the click on the ground")
		scattered_stones.set_selected(false)
		if flower_patch == null or flower_patch.pick_area.get_node_or_null("CollisionShape3D") == null:
			errors.append("flower patch has no selection shape")
		var gap := Vector3(18.0, 8.0, -10.0)
		var query := PhysicsRayQueryParameters3D.create(gap, gap + Vector3.DOWN * 10.0, 4)
		query.collide_with_areas = true
		query.collide_with_bodies = false
		var hit := town.get_world_3d().direct_space_state.intersect_ray(query)
		if not hit.is_empty() and (hit.collider as Area3D).get_parent() == scattered_stones:
			errors.append("empty garden space selects a distant stone")
	if movable_object != null:
		editor.set("tree_editor_open", true)
		editor.call("_select_user_tree", movable_object)
		if UserTree.ring_owner != movable_object or not UserTree.shared_ring.visible:
			errors.append("selection ring is not on the selected object")
		if movable_object.selection_outline.size() < 3 or not _ring_on_surface(movable_object):
			errors.append("selection ring is displaced from the selected object")
		var tea_house := _find_by_id("object:Harborlight Ward 07 | Harbor Tea House")
		if tea_house == null or tea_house.tree_id != "object:Harborlight Ward 07 | Harbor Tea House":
			errors.append("tea house marker regression object is missing")
		else:
			tea_house.set_selected(true)
			if tea_house.selection_outline.size() < 4 or not _ring_on_surface(tea_house):
				errors.append("tea house selection ring floats above its floor")
			tea_house.set_selected(false)
			movable_object.set_selected(true)
		var original := movable_object.global_transform
		editor.call("_rotate_selected_tree", 15.0)
		if is_equal_approx(movable_object.global_rotation.y, original.basis.get_euler().y):
			errors.append("rotation did not change the selected object")
		editor.call("_set_selected_tree_scale", 1.25)
		if not is_equal_approx(movable_object.size_multiplier, 1.25):
			errors.append("size control did not change the selected object")
		movable_object.global_transform = original
		movable_object.set_size_multiplier(1.0)
		editor.call("_start_moving_selected_tree")
		editor.call("_update_tree_placement_preview", Vector2(640, 520))
		if not bool(editor.get("placement_has_surface")) or movable_object.global_position.distance_to(original.origin) < 0.5:
			errors.append("move preview did not reach the town surface")
		editor.call("_cancel_tree_placement")
		if not movable_object.global_transform.is_equal_approx(original):
			errors.append("move cancel changed the object")
		editor.call("_start_moving_selected_tree")
		editor.call("_update_tree_placement_preview", Vector2(640, 520))
		if bool(editor.get("placement_has_surface")):
			editor.call("_commit_tree_placement")
			if movable_object.global_position.distance_to(original.origin) < 0.5 or UserTree.ring_owner != movable_object:
				errors.append("move commit or reselection failed")
			editor.call("_delete_selected_tree")
			if movable_object.visible or not editor.get("deleted_authored_tree_ids").has(movable_object.tree_id):
				errors.append("delete did not remove the selected object")
	else:
		errors.append("no movable house found")
	print("EDITABLE OBJECTS island=", object_count, " reference=", reference_count, " flowers=", flower_count, " surfaces=", surface_count, " lights=", light_count, " variants=", variants, " errors=", errors)
	town.free()
	quit(0 if errors.is_empty() else 1)

func _find_by_id(object_id: String) -> UserTree:
	for node in get_nodes_in_group("editable_trees"):
		var item := node as UserTree
		if item != null and item.tree_id == object_id:
			return item
	return null

func _ring_on_surface(item: UserTree) -> bool:
	var ring := UserTree.shared_ring.global_position
	var query := PhysicsRayQueryParameters3D.create(ring + Vector3.UP * 5.0, ring + Vector3.DOWN * 10.0, 16)
	var hit := item.get_world_3d().direct_space_state.intersect_ray(query)
	var close := absf(ring.y - item.ground_y()) < 0.1 if hit.is_empty() else absf(ring.y - hit.position.y - 0.07) < 0.03
	if not close:
		print("MARKER_SURFACE_MISMATCH id=", item.tree_id, " ring=", ring, " ground=", item.ground_y(), " hit=", hit)
	return close
