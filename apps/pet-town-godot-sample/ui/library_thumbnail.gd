extends "res://ui/library_preview.gd"
## Catalog artwork stays still between model, size and visibility changes.

func _ready() -> void:
	super._ready()
	resized.connect(_request_render)
	visibility_changed.connect(_request_render)
	_request_render()

func show_asset(entry: Dictionary, angle: float) -> bool:
	var available := super.show_asset(entry, angle)
	_request_render()
	return available

func show_empty(message: String) -> void:
	super.show_empty(message)
	_request_render()

func _request_render() -> void:
	# Fit and SubViewportContainer sizing must finish before the still is drawn.
	_render_once.call_deferred()

func _render_once() -> void:
	if is_instance_valid(viewport):
		viewport.render_target_update_mode = SubViewport.UPDATE_ONCE if is_visible_in_tree() else SubViewport.UPDATE_DISABLED
