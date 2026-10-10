extends "res://ui/library_preview.gd"
## A still native render of the production model, fitted without stretching.
func _ready() -> void:
	fit_to_stage = true
	super._ready()
	_ensure_stage()
	mouse_filter = MOUSE_FILTER_IGNORE
	viewport.transparent_bg = true
	resized.connect(_redraw)

func set_entry(entry: Dictionary) -> void:
	accessibility_name = str(entry.get("name", "Wildlife")) + " portrait"
	show_asset(entry, 0.0)
	var distance := camera.position.length()
	camera.position = Vector3(0.18, 0.14, 1).normalized() * distance
	camera.look_at(Vector3.ZERO)
	_fit_camera()
	if model_root.get_child_count() > 0:
		preload("res://scripts/wildlife/materials.gd").apply(model_root.get_child(0))
	_redraw()

func _redraw() -> void:
	viewport.render_target_update_mode = SubViewport.UPDATE_ONCE
