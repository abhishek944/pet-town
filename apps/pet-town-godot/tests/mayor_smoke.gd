extends SceneTree

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var town: Node = load("res://main.tscn").instantiate()
	root.add_child(town)
	var snapshot := {"v": 1, "type": "snapshot", "available": true, "agents": [], "mayor": {"active": true, "name": "Mochi", "listening": true, "focusSerial": 1}}
	town.call("_handle_bridge_line", JSON.stringify(snapshot))
	if not (town.get("pets_by_id") as Dictionary).has("pet-town-mayor"):
		_fail("wake did not create mayor")
		return
	if town.get("selected_id") != "pet-town-mayor" or not town.get("following_pet"):
		_fail("wake did not focus mayor")
		return
	town.call("_update_speaking_wave")
	if not (town.get("speaking_wave") as Panel).visible:
		_fail("speaking wave is hidden")
		return
	town.call("_reset_camera")
	town.call("_handle_bridge_line", JSON.stringify(snapshot))
	if town.get("following_pet"):
		_fail("ordinary speech moved the camera")
		return
	snapshot.mayor.focusSerial = 2
	town.call("_handle_bridge_line", JSON.stringify(snapshot))
	if not town.get("following_pet"):
		_fail("second wake did not return to mayor")
		return
	snapshot.mayor.listening = false
	town.call("_handle_bridge_line", JSON.stringify(snapshot))
	town.call("_update_speaking_wave")
	if (town.get("speaking_wave") as Panel).visible:
		_fail("speaking wave stayed visible")
		return
	print("mayor Godot smoke: pass")
	quit()

func _fail(message: String) -> void:
	push_error(message)
	quit(1)
