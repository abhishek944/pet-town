extends Control

const WORLD := "res://scenes/sample.tscn"
var welcome: Control

func _ready() -> void:
	preload("res://ui/dpi_scale.gd").apply(get_window())
	# Stay above the town HUD while asynchronous construction adds new layers.
	var overlay := CanvasLayer.new()
	overlay.layer = 100
	add_child(overlay)
	welcome = preload("res://ui/welcome.gd").new()
	overlay.add_child(welcome)
	welcome.set_loading(true)
	welcome.suspend_world_rendering()
	if ResourceLoader.load_threaded_request(WORLD) != OK: fail()

func _process(_delta: float) -> void:
	var status := ResourceLoader.load_threaded_get_status(WORLD)
	if status == ResourceLoader.THREAD_LOAD_FAILED or status == ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
		fail()
	elif status == ResourceLoader.THREAD_LOAD_LOADED:
		set_process(false)
		launch.call_deferred()

func fail() -> void:
	set_process(false)
	welcome.set_loading(true, welcome.FAILURE)

func launch() -> void:
	await get_tree().process_frame
	var scene: PackedScene = ResourceLoader.load_threaded_get(WORLD)
	if not scene:
		fail()
		return
	var town := scene.instantiate()
	get_tree().root.add_child(town)
	if not town.initialization_complete: await town.initialization_finished
	if not town.initialized or not is_instance_valid(town.actor):
		town.queue_free()
		fail()
		return
	# Preserve the loop across the loading/ready handoff without an extra wait.
	town.hud.welcome.picnic.elapsed = welcome.picnic.elapsed
	town.hud.welcome.picnic.queue_redraw()
	# Transfer ownership of the opaque opening's viewport suspension. Physics
	# and initialization continue; only unseen 3D drawing waits for dismissal.
	town.hud.welcome.world_rendering_suspended = welcome.world_rendering_suspended
	welcome.world_rendering_suspended = false
	if not town.hud.welcome.is_visible_in_tree(): town.hud.welcome.resume_world_rendering()
	get_tree().current_scene = town
	queue_free()
