extends SceneTree

func _initialize() -> void:
	call_deferred("_check")

func _check() -> void:
	var town := (load("res://main.tscn") as PackedScene).instantiate() as Node3D
	root.add_child(town)
	assert(town.get("avatar_viewport") == null, "Hidden details allocated a 3D viewport")
	town.set("selected_id", "avatar-smoke")
	town.set("agents_by_id", {"avatar-smoke": {"label": "Test pet", "status": "working", "source": "test"}})
	town.call("_open_details")
	assert(is_instance_valid(town.get("avatar_viewport")), "Opening details did not create the 3D viewer")
	assert(is_instance_valid(town.get("avatar_model")), "Opening details did not load the pet model")
	for frame in 3:
		await process_frame
	town.call("_close_details")
	assert(town.get("avatar_viewport") == null, "Closing details retained the 3D viewer")
	for frame in 3:
		await process_frame
	assert((town.get("avatar_frame") as Panel).get_child_count() == 0, "Closing details did not free the viewer")
	town.call("_open_details")
	assert(is_instance_valid(town.get("avatar_viewport")), "Reopening details did not recreate the viewer")
	town.call("_close_details")
	print("AVATAR_VIEWER_SMOKE open-close-reopen passed")
	quit()
