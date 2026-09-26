extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var previous_test_dir := OS.get_environment("PET_TOWN_TEST_DATA_DIR")
	var test_dir := OS.get_cache_dir().path_join("pet-town-build-smoke-%d" % OS.get_process_id())
	DirAccess.make_dir_recursive_absolute(test_dir)
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", test_dir)
	var town := load("res://main.tscn").instantiate() as Node3D
	root.add_child(town)
	town.set_process(false)
	var editor := town.get_node("UserTrees")
	var items: Array = editor.get("catalog_items")
	var errors := []
	if items.size() < 12:
		errors.append("too few catalog objects: %d" % items.size())
	var garden_stone: Dictionary = editor.call("_catalog_item", "garden-detail-stone")
	if garden_stone.is_empty() or not String(garden_stone.get("source_id", "")).begins_with("reference:Garden detail stone"):
		errors.append("Garden detail stone is missing from the placeable object catalog")
	for item in items:
		var sample := editor.call("_make_catalog_tree", String(item["id"]), "build-9999") as UserTree
		var source := editor.get("authored_trees").get(item["source_id"]) as UserTree
		var source_triangles := _triangles(source.get_node_or_null("AuthoredModel") if source != null else null)
		var sample_triangles := _triangles(sample)
		if source_triangles == 0 or sample_triangles != source_triangles:
			errors.append("visual mismatch for %s source=%d sample=%d" % [item["id"], source_triangles, sample_triangles])
		if sample != null:
			sample.free()
	if not town.get_node("IslandRenderSections").visible or town.get_node("BuildLand").visible:
		errors.append("Chill did not open with the authored town")
	var shared_ocean := town.get_node_or_null("CalmOpenOcean") as MeshInstance3D
	if shared_ocean == null or not shared_ocean.visible:
		errors.append("authored Chill water is missing")
	var sun := town.get_node("EveningSun") as DirectionalLight3D
	var sun_energy := sun.light_energy
	editor.call("_start_catalog_item", "garden-bench")
	await physics_frame
	for point in [Vector2(612, 368), Vector2(612, 500), Vector2(400, 420)]:
		editor.call("_update_tree_placement_preview", point)
		if editor.get("placement_has_surface"):
			break
	if not editor.get("placement_has_surface"):
		errors.append("Chill catalog could not place a free bench")
	else:
		editor.call("_commit_tree_placement")
	if editor.get("build_wallet").spent != 0:
		errors.append("Chill catalog spent credits")
	town.call("_set_town_mode", "build", false)
	if not town.get_node("BuildLand").visible or town.get_node("IslandRenderSections").visible or town.get_node("TownDecorations").visible or town.get_node("LiveAgents").visible:
		errors.append("Build did not show bare land")
	if not shared_ocean.visible or not shared_ocean.is_visible_in_tree() or not is_equal_approx(sun.light_energy, sun_energy) or not sun.is_visible_in_tree():
		errors.append("Build did not keep Chill water and sunlight")
	var wallet = editor.get("build_wallet")
	wallet.usage["input_tokens"] = 25000
	wallet.usage["output_tokens"] = 10000
	wallet.usage["cache_hit_tokens"] = 4000
	wallet.usage["estimated_cost_usd"] = 3.0
	if not wallet._save_wallet():
		errors.append("wallet could not save")
	var initial: int = wallet.balance()
	editor.call("_start_catalog_item", "rowboat")
	await physics_frame
	editor.call("_update_tree_placement_preview", Vector2(50, 350))
	if not editor.get("placement_has_surface"):
		errors.append("waterfront item could not reach water")
	editor.call("_cancel_tree_placement")
	if wallet.balance() != initial:
		errors.append("canceling a purchase spent credits")
	var item_id := "rose-cottage"
	var item: Dictionary = editor.call("_catalog_item", item_id)
	if item.is_empty():
		errors.append("cottage missing from catalog")
	else:
		editor.call("_start_catalog_item", item_id)
		if not editor.get("placement_active"):
			errors.append("could not start a cottage preview: %s; wallet=%s; path=%s" % [(editor.get("tree_status") as Label).text, wallet.last_error, wallet.path()])
		else:
			await physics_frame
			for point in [Vector2(612, 368), Vector2(612, 500), Vector2(400, 420)]:
				editor.call("_update_tree_placement_preview", point)
				if editor.get("placement_has_surface"):
					break
			if not editor.get("placement_has_surface"):
				errors.append("bare terrain was not a placement surface")
			else:
				editor.call("_commit_tree_placement")
			if wallet.balance() != initial - int(item["price"]):
				errors.append("purchase did not debit once")
			var built := 0
			for child in editor.get_children():
				if child is UserTree and child.is_build_item:
					built += 1
			if built != 1:
				errors.append("cottage placement was not saved")
	town.call("_set_town_mode", "chill", false)
	if not town.get_node("IslandRenderSections").visible or town.get_node("BuildLand").visible:
		errors.append("Chill town did not return")
	town.call("_set_town_mode", "build")
	town.free()
	var reopened := load("res://main.tscn").instantiate() as Node3D
	root.add_child(reopened)
	reopened.set_process(false)
	if reopened.get("town_mode") != "build":
		errors.append("Build mode was not remembered")
	var restored := 0
	for child in reopened.get_node("UserTrees").get_children():
		if child is UserTree and child.is_build_item and child.visible:
			restored += 1
	if restored != 1:
		errors.append("purchased object was not restored")
	reopened.call("_set_town_mode", "chill", false)
	var free_objects := 0
	for child in reopened.get_node("UserTrees").get_children():
		if child is UserTree and child.catalog_item_id == "garden-bench" and child.visible:
			free_objects += 1
	if free_objects != 1:
		errors.append("free Chill object was not restored")
	print("BUILD MODE items=", items.size(), " balance=", wallet.balance(), " errors=", errors)
	reopened.free()
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", previous_test_dir)
	for name in ["build-wallet.json", "town-mode.json", "town_layout.json", "build_layout.json"]:
		if FileAccess.file_exists(test_dir.path_join(name)):
			DirAccess.remove_absolute(test_dir.path_join(name))
	DirAccess.remove_absolute(test_dir)
	quit(0 if errors.is_empty() else 1)

func _triangles(node: Node) -> int:
	if node == null:
		return 0
	var total := 0
	for candidate in node.find_children("*", "MeshInstance3D", true, false):
		var mesh := (candidate as MeshInstance3D).mesh
		if mesh == null:
			continue
		for surface in mesh.get_surface_count():
			var arrays := mesh.surface_get_arrays(surface)
			var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
			var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
			total += (indices.size() if not indices.is_empty() else vertices.size()) / 3
	return total
