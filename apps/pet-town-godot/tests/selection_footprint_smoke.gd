extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var test_dir := ProjectSettings.globalize_path("res://../../var/test-checklist/selection-footprints")
	DirAccess.make_dir_recursive_absolute(test_dir)
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", test_dir)
	var town := load("res://main.tscn").instantiate() as Node3D
	root.add_child(town)
	var checked := 0
	var failures := []
	var house: UserTree
	var new_grove: UserTree
	var bush: UserTree
	for node in get_nodes_in_group("editable_trees"):
		var item := node as UserTree
		if item == null or not item.is_visible_in_tree():
			continue
		checked += 1
		var pick_shape := item.pick_area.get_node_or_null("CollisionShape3D") as CollisionShape3D
		if pick_shape == null or pick_shape.shape == null:
			failures.append("object cannot be picked: " + item.tree_id)
		item.set_selected(true)
		if UserTree.ring_owner != item or UserTree.shared_ring.mesh == null or UserTree.shared_ring.mesh.get_surface_count() != 2:
			failures.append("missing marker: " + item.tree_id)
		elif item.selection_outline.size() < 3 or not _center_on_ground(item):
			failures.append("marker is off ground: %s at %s" % [item.tree_id, UserTree.shared_ring.global_position])
		if item.tree_id == "object:BUILDING - Tide Tea House":
			house = item
		elif item.tree_id == "island:TREE - new grove_018":
			new_grove = item
		elif item.tree_id.begins_with("flower:FlowerPatch_Woodland_") and bush == null:
			bush = item
		item.set_selected(false)
	if house == null or new_grove == null or bush == null:
		failures.append("missing house, grove tree, or complete woodland bush")
	else:
		house.set_selected(true)
		var bounds := _outline_bounds(house.selection_outline)
		if bounds.size.x < 2.5 or bounds.size.y < 2.5:
			failures.append("Tide Tea House footprint does not cover its base")
		new_grove.set_selected(true)
		if not _center_on_ground(new_grove) or UserTree.shared_ring.global_position.y > new_grove.ground_y() + 0.1:
			failures.append("New Grove tree marker is raised into its trunk")
		bush.set_selected(true)
		if bush.find_children("*", "MeshInstance3D", true, false).size() < 2:
			failures.append("Woodland bush still consists of one color fragment")
		bush.set_selected(false)
	print("SELECTION_FOOTPRINTS checked=", checked, " errors=", failures.slice(0, 20), " total_errors=", failures.size())
	town.free()
	quit(0 if failures.is_empty() else 1)

func _center_on_ground(item: UserTree) -> bool:
	var marker := UserTree.shared_ring.global_position
	var boat := "boat" in item.tree_id.to_lower() or "waterfront" in item.tree_id.to_lower()
	var query := PhysicsRayQueryParameters3D.create(marker + Vector3.UP * 2.0, marker + Vector3.DOWN * 12.0, 8 if boat else 16)
	var hit := item.get_world_3d().direct_space_state.intersect_ray(query)
	if hit.is_empty():
		query.collision_mask = 8
		hit = item.get_world_3d().direct_space_state.intersect_ray(query)
	return not hit.is_empty() and absf(marker.y - hit.position.y - 0.07) < 0.08

func _outline_bounds(points: PackedVector2Array) -> Rect2:
	var low := points[0]
	var high := points[0]
	for point in points:
		low = low.min(point)
		high = high.max(point)
	return Rect2(low, high - low)
