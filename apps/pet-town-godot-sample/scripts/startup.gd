extends Control

const WORLD := "res://scenes/sample.tscn"
var welcome: Control

func _ready() -> void:
	preload("res://ui/dpi_scale.gd").apply(get_window())
	welcome = preload("res://ui/welcome.gd").new()
	add_child(welcome)
	welcome.set_loading(true)
	ResourceLoader.load_threaded_request(WORLD)

func _process(_delta: float) -> void:
	var status := ResourceLoader.load_threaded_get_status(WORLD)
	if status == ResourceLoader.THREAD_LOAD_FAILED or status == ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
		welcome.set_loading(true, "The town could not load. Please reopen Pet Town.")
		set_process(false)
	elif status == ResourceLoader.THREAD_LOAD_LOADED:
		# Keep the branded loading screen drawn during synchronous world setup.
		set_process(false)
		launch.call_deferred()

func launch() -> void:
	await get_tree().process_frame
	await get_tree().process_frame
	var scene: PackedScene = ResourceLoader.load_threaded_get(WORLD)
	var town := scene.instantiate()
	get_tree().root.add_child(town)
	if not town.get("initialized") or not is_instance_valid(town.get("actor")):
		town.queue_free()
		welcome.set_loading(true, "The town could not load. Please reopen Pet Town.")
		return
	get_tree().current_scene = town
	queue_free()
