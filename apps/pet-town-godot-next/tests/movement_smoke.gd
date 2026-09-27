extends SceneTree

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var world := (load("res://scenes/world/WorldBase.tscn") as PackedScene).instantiate() as Node3D
	root.add_child(world)
	var catalog := WorkshopCatalog.new()
	assert(catalog.load_all())
	var editor := WorkshopEditor.new()
	root.add_child(editor)
	var cottage := WorkshopObject.new()
	cottage.configure("cottage", catalog.get_item("cottage"), catalog.instantiate_model("cottage"))
	editor.add_child(cottage)
	var tile := WorkshopObject.new()
	tile.configure("tile", catalog.get_item("paving-tile"), catalog.instantiate_model("paving-tile"))
	editor.add_child(tile)
	tile.global_position = Vector3(-5, 0, 0)
	assert(cottage.solid_body.collision_layer == 1)
	assert(tile.solid_body == null)
	cottage.set_preview(true)
	assert(cottage.solid_body.collision_layer == 0)
	cottage.set_preview(false)
	var region := world.get_node("NavigationRegion3D") as NavigationRegion3D
	var navigation := WorkshopNavigation.new()
	root.add_child(navigation)
	navigation.configure(region, editor)
	for index in range(120):
		await physics_frame
		if navigation.applied_signature != "" and not navigation.baking:
			break
	assert(navigation.applied_signature != "")
	NavigationServer3D.map_force_update(region.get_navigation_map())
	var shore := NavigationServer3D.map_get_closest_point(region.get_navigation_map(), Vector3(44, 0, 0))
	assert(shore.x > 42.0)
	var start := NavigationServer3D.map_get_closest_point(region.get_navigation_map(), Vector3(-7, 0, 0))
	var goal := NavigationServer3D.map_get_closest_point(region.get_navigation_map(), Vector3(7, 0, 0))
	var pet := (load("res://scenes/agents/live_companion.tscn") as PackedScene).instantiate() as LiveCompanion
	pet.configure("worker", "Worker", "working")
	root.add_child(pet)
	for index in range(5):
		await physics_frame
	pet.global_position = start
	pet.reset_physics_interpolation()
	pet.set_manual_control(true)
	pet.manual_direction = Vector3.RIGHT
	var walking_seen := false
	for index in range(180):
		await physics_frame
		walking_seen = walking_seen or pet.player.current_animation == "Walking_A"
	assert(walking_seen and pet.global_position.x > -4.5)
	assert(pet.global_position.x < -2.4)
	pet.set_manual_control(false)
	pet.pause_left = 0.0
	pet.navigation_agent.target_position = goal
	var reached := false
	for index in range(700):
		await physics_frame
		if pet.global_position.distance_to(goal) < 1.5:
			reached = true
			break
	assert(reached)
	var previous_signature := navigation.applied_signature
	cottage.position.z = 8.0
	editor.state_changed.emit()
	for index in range(120):
		await physics_frame
		if navigation.applied_signature != previous_signature and not navigation.baking:
			break
	assert(navigation.applied_signature != previous_signature)
	print("MOVEMENT_SMOKE_OK shore=", shore, " goal=", pet.global_position)
	pet.free()
	navigation.free()
	editor.free()
	world.free()
	quit()
