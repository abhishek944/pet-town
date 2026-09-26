extends SceneTree

func _initialize() -> void:
	call_deferred("_measure")

func _measure() -> void:
	var args := OS.get_cmdline_user_args()
	var mode := args[0] if not args.is_empty() else "normal"
	var town := (load("res://main.tscn") as PackedScene).instantiate() as Node3D
	root.add_child(town)
	var disabled_shadows := 0
	var disabled_by_section := {}
	if mode == "no-shadows":
		(town.get_node("EveningSun") as DirectionalLight3D).shadow_enabled = false
	elif mode == "no-reference":
		town.get_node("TownDecorations/ReferenceGardens").visible = false
	elif mode == "no-island":
		town.get_node("IslandRenderSections").visible = false
	elif mode == "no-lights":
		for light in town.find_children("*", "OmniLight3D", true, false):
			(light as OmniLight3D).visible = false
	elif mode == "small-shadows-off":
		var threshold := float(args[1]) if args.size() > 1 else 1.0
		for candidate in town.find_children("*", "MeshInstance3D", true, false):
			var mesh := candidate as MeshInstance3D
			if mesh.mesh == null or mesh.cast_shadow == GeometryInstance3D.SHADOW_CASTING_SETTING_OFF:
				continue
			var bounds := mesh.global_transform * mesh.get_aabb()
			if maxf(bounds.size.x, maxf(bounds.size.y, bounds.size.z)) < threshold:
				mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
				disabled_shadows += 1
				var parts := String(town.get_path_to(mesh)).split("/")
				var section := "/".join(parts.slice(0, mini(2, parts.size())))
				disabled_by_section[section] = int(disabled_by_section.get(section, 0)) + 1
	elif mode != "normal":
		push_error("Unknown render measurement mode: " + mode)
		quit(1)
		return
	if args.size() > 3 and args[3] == "close":
		town.set("camera_at_overview", false)
		town.set("camera_target", Vector3(0, 1.5, 0))
		town.set("camera_distance", 24.0)
		town.call("_update_camera")
	var draw_total := 0.0
	var samples := 0
	var sample_start := 0
	for frame in 90:
		await process_frame
		if frame < 40:
			continue
		if frame == 40:
			sample_start = Time.get_ticks_usec()
		draw_total += Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
		samples += 1
	var loop_hz := (samples - 1) * 1000000.0 / maxf(float(Time.get_ticks_usec() - sample_start), 1.0)
	print("RENDER_METRICS mode=%s cap=%d disabled_shadows=%d draws=%.1f loop_hz=%.1f static_mb=%.1f video_mb=%.1f nodes=%d window=%s" % [mode, Engine.max_fps, disabled_shadows, draw_total / samples, loop_hz, Performance.get_monitor(Performance.MEMORY_STATIC) / 1048576.0, Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED) / 1048576.0, int(Performance.get_monitor(Performance.OBJECT_NODE_COUNT)), DisplayServer.window_get_size()])
	if not disabled_by_section.is_empty():
		print("SHADOW_SECTIONS ", disabled_by_section)
	if args.size() > 2:
		assert(root.get_texture().get_image().save_png(args[2]) == OK)
	quit()
