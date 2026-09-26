extends SceneTree

func _initialize() -> void:
	call_deferred("_measure")

func _measure() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty():
		push_error("Pass a scene path after --")
		quit(1)
		return
	var scene := load(args[0]) as PackedScene
	if scene == null:
		push_error("Could not load scene: " + args[0])
		quit(1)
		return
	var instance := scene.instantiate()
	root.add_child(instance)
	await process_frame
	print("SCENE_MEMORY path=%s static=%d nodes=%d process=%d" % [args[0], Performance.get_monitor(Performance.MEMORY_STATIC), Performance.get_monitor(Performance.OBJECT_NODE_COUNT), OS.get_static_memory_usage()])
	quit()
