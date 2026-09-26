extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var test_dir := OS.get_cache_dir().path_join("pet-town-workshop-smoke-%d" % OS.get_process_id())
	DirAccess.make_dir_recursive_absolute(test_dir)
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", test_dir)
	var town := load("res://scenes/main.tscn").instantiate() as Node3D
	root.add_child(town)
	await physics_frame
	await physics_frame
	var catalog := town.get("catalog") as WorkshopCatalog
	var editor := town.get_node("BuildEditor") as WorkshopEditor
	var modes := town.get_node("TownModes") as TownModeController
	var wallet := town.get("wallet") as BuildWallet
	var camera := town.get_node("OrbitCamera") as Camera3D
	var marker := town.get_node("FootprintMarker") as WorkshopFootprintMarker
	var errors := []
	if not modes.set_mode("build") or editor.get_child_count() != 0:
		errors.append("Build did not open with empty land")
	if catalog.items.size() < 48:
		errors.append("legacy object catalog is incomplete")
	for item in catalog.items:
		var instance := editor.create_object(String(item["id"]), "audit")
		if instance == null:
			errors.append("could not create %s" % item["id"])
			continue
		instance.global_position = Vector3(0, 5, 0)
		var bounds := _model_bounds(instance)
		if absf(bounds.position.y) > 0.04:
			errors.append("%s pivot is above ground" % item["id"])
		if absf(bounds.size.x - float(item["width"])) > 0.08 or absf(bounds.size.z - float(item["depth"])) > 0.08:
			errors.append("%s footprint differs from model" % item["id"])
		marker.show_for(instance)
		if marker.mesh == null or marker.mesh.get_surface_count() != 2:
			errors.append("%s has no yellow footprint" % item["id"])
		elif marker.get_aabb().size.x < bounds.size.x or marker.get_aabb().size.z < bounds.size.z:
			errors.append("%s footprint does not cover visible base" % item["id"])
		await physics_frame
		editor.select_at(camera.unproject_position(instance.global_position + Vector3.UP * float(item["height"]) * 0.5))
		if editor.selected != instance:
			errors.append("%s could not be selected" % item["id"])
		editor.selected = null
		instance.free()
	marker.visible = false
	var hill_ray := PhysicsRayQueryParameters3D.create(Vector3(-23, 20, -14), Vector3(-23, -30, -14), 16)
	var hill_hit := root.get_world_3d().direct_space_state.intersect_ray(hill_ray)
	if hill_hit.is_empty():
		errors.append("marker terrain sample missed the hill")
	else:
		var hill_tree := editor.create_object("pine-tree", "hill-marker-audit")
		if hill_tree == null:
			errors.append("could not create tree for terrain marker audit")
		else:
			hill_tree.global_position = hill_hit.position
			marker.show_for(hill_tree)
			var vertices := marker.mesh.surface_get_arrays(0)[Mesh.ARRAY_VERTEX] as PackedVector3Array
			for vertex in vertices.slice(0, mini(vertices.size(), 24)):
				var world_point := marker.global_transform * vertex
				var ray := PhysicsRayQueryParameters3D.create(world_point + Vector3.UP * 5, world_point + Vector3.DOWN * 5, 16)
				var floor_hit := root.get_world_3d().direct_space_state.intersect_ray(ray)
				if floor_hit.is_empty() or absf(world_point.y - floor_hit.position.y - marker.LIFT) > 0.035:
					errors.append("tree yellow marker does not follow terrain")
					break
			hill_tree.free()
	marker.visible = false
	wallet.usage["input_tokens"] = 50000
	if not wallet._save_wallet():
		errors.append("wallet could not save")
	if not editor.begin_place("fishing-boat"):
		errors.append("could not start boat placement")
	else:
		editor.hover(camera.unproject_position(Vector3(55, 0, 0)))
		if not editor.hover_valid or absf(editor.preview.global_position.y + 2.72) > 0.15:
			errors.append("boat placement did not hit water")
		editor.cancel_preview()
	var initial := wallet.balance()
	if not editor.begin_place("coastal-granite"):
		errors.append("could not begin granite placement")
	else:
		var aim := camera.unproject_position(Vector3(4, 0, 2))
		editor.hover(aim)
		if not editor.hover_valid or not editor.commit_preview():
			errors.append("could not place granite on terrain")
		else:
			var placed := editor.selected
			if wallet.balance() != initial - 220:
				errors.append("purchase did not debit once")
			var first := placed.global_position
			editor.begin_move()
			editor.hover(camera.unproject_position(Vector3(8, 0, 2)))
			if not editor.commit_preview() or placed.global_position.distance_to(first) < 2:
				errors.append("moving granite failed")
			editor.rotate_selected(15)
			editor.scale_selected(0.1)
			if not is_equal_approx(placed.scale.x, 1.1):
				errors.append("resizing granite failed")
			var saved_id := placed.object_id
			if not modes.set_mode("chill") or not modes.set_mode("build") or editor.get_child_count() != 1:
				errors.append("Build layout did not survive mode switching")
			elif (editor.get_child(0) as WorkshopObject).object_id != saved_id:
				errors.append("placed object ID changed on reload")
	print("WORKSHOP_SMOKE assets=", catalog.items.size(), " errors=", errors)
	town.free()
	quit(0 if errors.is_empty() else 1)

func _model_bounds(item: WorkshopObject) -> AABB:
	var result := AABB()
	var first := true
	for candidate in item.model.find_children("*", "MeshInstance3D", true, false):
		var mesh := candidate as MeshInstance3D
		if mesh.mesh == null:
			continue
		var piece := (item.global_transform.affine_inverse() * mesh.global_transform) * mesh.get_aabb()
		result = piece if first else result.merge(piece)
		first = false
	return result
