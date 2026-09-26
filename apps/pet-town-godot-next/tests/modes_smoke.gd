extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var test_dir := OS.get_cache_dir().path_join("pet-town-modes-smoke-%d" % OS.get_process_id())
	DirAccess.make_dir_recursive_absolute(test_dir)
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", test_dir)
	var town := load("res://scenes/main.tscn").instantiate() as Node3D
	root.add_child(town)
	await physics_frame
	var editor := town.get_node("BuildEditor") as WorkshopEditor
	var wallet := town.get("wallet") as BuildWallet
	var catalog := town.get("catalog") as WorkshopCatalog
	var modes := TownModeController.new()
	town.add_child(modes)
	modes.configure(editor, catalog, wallet)
	var errors: Array[String] = []
	if modes.load_initial_mode() != "chill" or not modes.set_mode("chill"):
		errors.append("fresh town did not open in Chill")
	var starter_layout := JSON.parse_string(FileAccess.get_file_as_string("res://assets/chill_layout.json")) as Dictionary
	if editor.get_child_count() != (starter_layout.get("objects", []) as Array).size() or FileAccess.file_exists(editor.store.path()):
		errors.append("Chill did not load its fixed starter layout")
	var first := editor.get_child(0) as WorkshopObject
	if first == null or first.object_id != "object-000001":
		errors.append("starter object IDs changed")
	var path_tile: WorkshopObject
	var path_count := 0
	var ground_errors := 0
	var categories := {}
	var boat_count := 0
	for child in editor.get_children():
		var object := child as WorkshopObject
		if object != null:
			var category := String(object.definition["category"])
			categories[category] = int(categories.get(category, 0)) + 1
			var surface_layer := 8 if String(object.definition["surface"]) == "water" else 16
			if surface_layer == 8:
				boat_count += 1
			var origin := object.global_position + Vector3.UP * 100
			var hit := town.get_world_3d().direct_space_state.intersect_ray(PhysicsRayQueryParameters3D.create(origin, origin + Vector3.DOWN * 200, surface_layer))
			if hit.is_empty() or absf(float(hit.position.y) - object.global_position.y) > 0.08:
				ground_errors += 1
			if object.asset_id == "paving-tile":
				path_count += 1
				if path_tile == null:
					path_tile = object
	if path_count != 252:
		errors.append("Chill does not contain editable authored path tiles")
	for category in ["Gardens", "Trees", "Furniture", "Lights", "Waterfront", "Homes", "Shops", "Landmarks"]:
		if int(categories.get(category, 0)) < {"Gardens": 150, "Trees": 120, "Furniture": 20, "Lights": 20, "Waterfront": 31, "Homes": 6, "Shops": 4, "Landmarks": 3}[category]:
			errors.append("Chill is missing authored %s density" % category)
	if boat_count != 6:
		errors.append("Chill is missing its six authored boats")
	if ground_errors != 0:
		errors.append("%d authored objects missed uneven ground" % ground_errors)
	if path_tile != null:
		var camera := town.get_node("OrbitCamera") as Camera3D
		camera.global_position = path_tile.global_position + Vector3(0, 18, 6)
		camera.look_at(path_tile.global_position + Vector3.UP * 0.07)
		await physics_frame
		editor.select_at(camera.unproject_position(path_tile.global_position + Vector3.UP * 0.07))
		if editor.selected != path_tile:
			errors.append("authored path tile could not be selected")
		else:
			var start := path_tile.position
			var tile_id := path_tile.object_id
			editor.begin_move()
			path_tile.position += Vector3(0, 0, 2)
			editor.hover_valid = true
			if not editor.commit_preview():
				errors.append("authored path tile could not be moved")
			else:
				var saved_tile := false
				for record in editor.store.load_records():
					if record is Dictionary and record.get("id") == path_tile.object_id:
						saved_tile = is_equal_approx(float(record["position"][2]), start.z + 2)
				if not saved_tile:
					errors.append("path tile move did not persist")
				if not editor.undo_last():
					errors.append("path tile move could not be undone")
				else:
					var restored_tile := false
					for record in editor.store.load_records():
						if record is Dictionary and record.get("id") == tile_id:
							restored_tile = is_equal_approx(float(record["position"][2]), start.z)
					if not restored_tile:
						errors.append("path tile undo did not restore its position")
	var initial_spent := wallet.spent
	if not editor.begin_place("flower-planter"):
		errors.append("Chill placement required credits")
	else:
		editor.preview.position = Vector3(2, 0, 16)
		editor.hover_valid = true
		if not editor.commit_preview() or wallet.spent != initial_spent:
			errors.append("Chill placement spent credits or failed")
		else:
			var placed_id := editor.selected.object_id
			editor.rotate_selected(15)
			editor.scale_selected(0.1)
			if not is_equal_approx(editor.selected.scale.x, 1.1):
				errors.append("Chill resize failed")
			editor.delete_selected()
			await process_frame
			if not editor.undo_last() or _find_object(editor, placed_id) == null:
				errors.append("Chill delete undo failed")
			if not editor.undo_last() or not is_equal_approx(_find_object(editor, placed_id).scale.x, 1.0):
				errors.append("Chill scale undo failed")
			if not editor.undo_last() or not is_zero_approx(_find_object(editor, placed_id).rotation.y):
				errors.append("Chill rotation undo failed")
			if not editor.undo_last() or _find_object(editor, placed_id) != null:
				errors.append("Chill placement undo failed")
	var chill_count := editor.get_child_count()
	if not modes.set_mode("build") or editor.get_child_count() != 0:
		errors.append("Build did not start empty")
	if editor.can_undo():
		errors.append("Chill undo leaked into Build")
	if editor.begin_place("flower-planter"):
		errors.append("Build allowed purchase without credits")
	wallet.usage["input_tokens"] = 5000
	wallet._save_wallet()
	if not editor.begin_place("flower-planter"):
		errors.append("Build could not purchase with credits")
	else:
		editor.preview.position = Vector3(2, 0, 16)
		editor.hover_valid = true
		if not editor.commit_preview() or wallet.spent != initial_spent + 400:
			errors.append("Build placement did not debit exactly once")
		elif not editor.undo_last() or wallet.spent != initial_spent or editor.get_child_count() != 0:
			errors.append("Build placement undo did not remove and refund")
		elif not editor.begin_place("flower-planter"):
			errors.append("Build could not begin a second purchase")
		else:
			editor.preview.position = Vector3(2, 0, 16)
			editor.hover_valid = true
			if not editor.commit_preview():
				errors.append("Build could not place again after undo")
	if not modes.set_mode("chill") or editor.get_child_count() != chill_count:
		errors.append("Chill layout was not preserved")
	if not modes.set_mode("build") or editor.get_child_count() != 1:
		errors.append("Build layout was not preserved")
	if modes.load_initial_mode() != "build":
		errors.append("selected mode was not persisted")
	print("MODES_SMOKE errors=", errors)
	town.free()
	quit(0 if errors.is_empty() else 1)

func _find_object(editor: WorkshopEditor, id: String) -> WorkshopObject:
	for child in editor.get_children():
		var item := child as WorkshopObject
		if item != null and item.object_id == id:
			return item
	return null
