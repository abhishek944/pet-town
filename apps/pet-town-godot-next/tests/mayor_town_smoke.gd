extends SceneTree

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var test_dir := OS.get_cache_dir().path_join("pet-town-mayor-smoke-%d" % OS.get_process_id())
	DirAccess.make_dir_recursive_absolute(test_dir)
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", test_dir)
	var town := load("res://scenes/main.tscn").instantiate() as Node3D
	root.add_child(town)
	for index in 5:
		await process_frame
	var bridge := town.get_node("LiveTownBridge") as LiveTownBridge
	bridge.stop()
	var invoke_result := {"ok": false, "message": "pending"}
	bridge.mayor_invoke_result.connect(func(ok: bool, message: String) -> void:
		invoke_result.ok = ok
		invoke_result.message = message
	)
	bridge.accept_line('{"v":1,"type":"mayorInvokeResult","ok":true,"message":null}')
	assert(invoke_result.ok and invoke_result.message == "")
	var snapshot := {
		"v": 1, "type": "snapshot", "available": false, "agents": [],
		"mayor": {
			"active": true, "name": "Jarvis", "listening": false,
			"conversationActive": true, "speaking": true, "focusSerial": 1,
			"speech": "The lanterns are lit. What would you like to work on tonight?"
		}
	}
	town.call("_on_snapshot", snapshot)
	for index in 20:
		await physics_frame
	var manager := town.get_node("LiveAgents") as LiveAgentManager
	var camera := town.get_node("OrbitCamera") as WorkshopCamera
	var mayor := manager.agents.get(LiveAgentManager.MAYOR_ID) as LiveCompanion
	assert(is_instance_valid(mayor))
	assert(camera.followed == mayor)
	assert(not camera.fpv_enabled)
	assert(mayor.mayor_conversation_active and mayor.mayor_speaking)
	assert(mayor.velocity.length_squared() < 0.01)
	var toward := camera.global_position - mayor.global_position
	toward.y = 0.0
	var facing := Vector3(sin(mayor.visual.rotation.y), 0.0, cos(mayor.visual.rotation.y))
	assert(facing.dot(toward.normalized()) > 0.8)
	var ray := PhysicsRayQueryParameters3D.create(
		mayor.global_position + Vector3.UP * 0.8, camera.global_position, 1, [mayor.get_rid()]
	)
	assert(mayor.get_world_3d().direct_space_state.intersect_ray(ray).is_empty())
	var bubble := town.get("mayor_dialogue") as PanelContainer
	assert(is_instance_valid(bubble) and bubble.visible)
	assert(String(bubble.get("current_text")).contains("The lanterns are lit"))
	assert(bubble.position.x >= 0 and bubble.position.y >= 0)
	assert(bubble.position.x + bubble.size.x <= root.get_visible_rect().size.x)
	bubble.call("update_for", mayor, camera, "Sample reply", true)
	assert(not bubble.visible)
	print("MAYOR_TOWN_SMOKE_OK")
	quit()
