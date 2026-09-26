extends SceneTree

func _initialize() -> void:
	call_deferred("_profile")

func _profile() -> void:
	Engine.max_fps = 30
	var args := OS.get_cmdline_user_args()
	var path := args[0] if not args.is_empty() else "empty"
	if path != "empty":
		var paths := ["res://scenes/island_render_sections.scn", "res://scenes/town_decorations.tscn"] if path == "combined" else ([] if path in ["blank", "collision", "navigation"] else ["res://main.tscn" if path == "main-no-script" else path])
		for scene_path in paths:
			var scene := load(scene_path) as PackedScene
			assert(scene != null, "Could not load " + scene_path)
			var instance := scene.instantiate()
			if path == "main-no-script":
				instance.set_script(null)
				instance.get_node("UserTrees").set_script(null)
			root.add_child(instance)
			if path == "main-no-script":
				(instance.get_node("OrbitCamera") as Camera3D).look_at_from_position(Vector3(0, 142, 153), Vector3(0, 1.5, 2), Vector3.UP)
		if path == "collision":
			var body := StaticBody3D.new()
			var collider := CollisionShape3D.new()
			collider.shape = load("res://navigation/town_collision.res")
			body.add_child(collider)
			root.add_child(body)
		elif path == "navigation":
			var region := NavigationRegion3D.new()
			region.navigation_mesh = load("res://navigation/town_walkable.res")
			root.add_child(region)
		if path not in ["res://main.tscn", "main-no-script"]:
			var world := WorldEnvironment.new()
			world.environment = load("res://environments/woodland_evening.tres")
			root.add_child(world)
			var sun := DirectionalLight3D.new()
			sun.rotation = Vector3(-0.436332, -0.610865, 0)
			sun.shadow_enabled = true
			root.add_child(sun)
			var camera := Camera3D.new()
			camera.current = true
			camera.fov = 38.0
			root.add_child(camera)
			camera.look_at_from_position(Vector3(205, 170, 205), Vector3(0, 1.5, 0), Vector3.UP)
	for frame in 600:
		await process_frame
		if frame == 90:
			print("PROFILE_SCENE pid=%d path=%s static_mb=%.1f video_mb=%.1f nodes=%d" % [OS.get_process_id(), path, Performance.get_monitor(Performance.MEMORY_STATIC) / 1048576.0, Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED) / 1048576.0, int(Performance.get_monitor(Performance.OBJECT_NODE_COUNT))])
	quit()
