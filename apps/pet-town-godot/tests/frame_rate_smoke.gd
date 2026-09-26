extends SceneTree

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	Engine.max_fps = 30
	var town := (load("res://main.tscn") as PackedScene).instantiate() as Node3D
	root.add_child(town)
	var expected := 60 if root.has_focus() else 15
	assert(Engine.max_fps == expected, "Town did not replace the loading screen FPS cap")
	town.call("_on_window_focus_entered")
	assert(Engine.max_fps == 60, "Focused town must target 60 FPS")
	town.set("smooth_frames_until_msec", 0)
	town.call("_update_frame_budget", false, true)
	assert(Engine.max_fps == 30, "Idle focused town must reduce frame work")
	town.call("_update_frame_budget", true, true)
	assert(Engine.max_fps == 60, "Agent activity must keep smooth frames")
	town.call("_on_window_focus_exited")
	assert(Engine.max_fps == 15, "Background town must reduce frame work")
	print("FRAME_RATE_SMOKE active=60 idle=30 background=15")
	quit()
