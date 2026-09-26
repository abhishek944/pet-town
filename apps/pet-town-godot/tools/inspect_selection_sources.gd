extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", ProjectSettings.globalize_path("res://../../var/test-checklist/selection-inspection"))
	var town := load("res://main.tscn").instantiate() as Node3D
	root.add_child(town)
	var woodland_count := 0
	for node in get_nodes_in_group("editable_trees"):
		var item := node as UserTree
		if item == null:
			continue
		if "Woodland detail" in item.tree_id:
			woodland_count += 1
		if ("Woodland detail" in item.tree_id and woodland_count <= 5) or "TREE - new grove_018" in item.tree_id or "BUILDING - Tide Tea House" in item.tree_id or "FlowerPatch_Garden_0_4_000" in item.tree_id:
			var mesh_count := item.find_children("*", "MeshInstance3D", true, false).size()
			print("SELECTION_SOURCE id=", item.tree_id, " path=", item.get_path(), " meshes=", mesh_count, " origin=", item.global_position, " floor=", item.ground_y())
			for shape in item.pick_area.get_children():
				if shape is CollisionShape3D:
					print("  PICK_SHAPE name=", shape.name, " type=", shape.shape, " disabled=", shape.disabled)
			for candidate in item.find_children("*", "MeshInstance3D", true, false):
				var visual := candidate as MeshInstance3D
				print("  mesh=", visual.name, " bounds=", visual.global_transform * visual.get_aabb())
	print("WOODLAND_DETAIL_COUNT=", woodland_count)
	town.free()
	quit()
