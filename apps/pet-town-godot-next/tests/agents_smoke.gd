extends SceneTree

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var bridge := LiveTownBridge.new()
	bridge.set_process(false)
	root.add_child(bridge)
	var manager := LiveAgentManager.new()
	root.add_child(manager)
	var snapshots: Array[Dictionary] = []
	bridge.snapshot_received.connect(func(value: Dictionary) -> void: snapshots.append(value))
	bridge.accept_line("not json")
	bridge.accept_line('{"v":2,"type":"snapshot"}')
	bridge.accept_line('{"v":1,"type":"snapshot","available":true,"agents":[],"mayor":{"active":false}}')
	assert(snapshots.size() == 1)
	manager.apply_snapshot(snapshots[0])
	assert(manager.agents.is_empty())
	manager.apply_snapshot({"v": 1, "type": "snapshot", "available": true, "agents": [{"id": "worker", "label": "Scout", "status": "working"}, {"id": "idle", "label": "Rest", "status": "idle"}], "mayor": {"active": true, "name": "Mochi", "listening": true, "focusSerial": 1}})
	assert(manager.agents.size() == 2)
	assert(manager.agents.has("pet-town-mayor"))
	assert(not manager.agents.has("idle"))
	manager.set_mode("build")
	assert(not manager.visible)
	assert(not manager.follow_agent("missing"))
	manager.set_mode("chill")
	assert(manager.visible)
	var palette := TownCommandPalette.new()
	root.add_child(palette)
	await process_frame
	palette._submit("/build")
	assert(not palette.panel.visible)
	manager.queue_free()
	palette.queue_free()
	bridge.queue_free()
	await process_frame
	print("AGENTS_SMOKE_OK")
	quit()
