extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var town: Node3D = load("res://main.tscn").instantiate()
	root.add_child(town)
	town.set_process(false)
	var record := {"v": 1, "type": "snapshot", "available": true, "agents": [{"id": "path-test", "label": "Scout", "status": "working", "source": "test"}], "mayor": {"active": false}}
	town.call("_handle_bridge_line", JSON.stringify(record))
	var pet: CharacterBody3D = town.get("pets_by_id")["path-test"]
	var start := pet.global_position
	for frame in 240:
		await physics_frame
	print("PET PATH start=", start, " end=", pet.global_position, " destination=", pet.get("destination"), " nav_finished=", pet.get_node("NavigationAgent3D").is_navigation_finished(), " ready=", pet.get("ready_to_walk"))
	var failed := pet.global_position.distance_to(start) < 1.0
	town.free()
	quit(1 if failed else 0)
