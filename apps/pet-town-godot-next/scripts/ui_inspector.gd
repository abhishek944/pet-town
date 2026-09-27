extends "res://scripts/ui_library.gd"

func set_undo_available(value: bool) -> void:
	if is_instance_valid(inspector_undo_button):
		inspector_undo_button.disabled = not value

func _set_inspector_size(value: float) -> void:
	if is_instance_valid(editor) and is_instance_valid(editor.selected):
		scale_requested.emit(value - editor.selected.scale.x)

func _close_inspector() -> void:
	_dismiss_object_editor()

func _refresh_inspector() -> void:
	var item := editor.selected
	var should_show := is_instance_valid(item) and not is_instance_valid(editor.preview)
	if should_show and not inspector.visible:
		agent_panel.visible = false
		if settings_overlay.visible:
			close_settings()
	inspector.visible = should_show
	if not is_instance_valid(item):
		inspector_preview_asset_id = ""
		return
	inspector_kind.text = String(item.definition["name"])
	inspector_size_slider.set_value_no_signal(item.scale.x)
	inspector_size_label.text = "%d%%" % int(roundf(item.scale.x * 100.0))
	if inspector_preview_asset_id != item.asset_id:
		inspector_preview_asset_id = item.asset_id
		inspector_preview.show_scene(catalog.scenes.get(item.asset_id) as PackedScene)
