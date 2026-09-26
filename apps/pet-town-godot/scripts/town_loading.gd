extends Control

const TOWN_SCENE := "res://main.tscn"

@onready var status_label: Label = $Status/Contents/StatusLabel

func _ready() -> void:
	Engine.max_fps = 30
	call_deferred("_start_loading")

func _start_loading() -> void:
	# Draw the welcome screen before loading the authored island on the main thread.
	# Threaded resource loading intermittently fails on its nested scene instances.
	await get_tree().process_frame
	await get_tree().process_frame
	var started := Time.get_ticks_msec()
	var scene := load(TOWN_SCENE) as PackedScene
	if scene == null:
		status_label.text = "The island could not open. Please try again."
		push_error("Pet Town scene loading failed")
		return
	var change_result := get_tree().change_scene_to_packed(scene)
	if change_result != OK:
		status_label.text = "The island could not open. Please try again."
		push_error("Pet Town scene change failed: %s" % change_result)
	elif OS.is_debug_build():
		print("[pet-town] island scene loaded in %d ms" % (Time.get_ticks_msec() - started))
