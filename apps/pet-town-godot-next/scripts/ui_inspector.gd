extends "res://scripts/ui_library.gd"

func set_undo_available(value: bool) -> void:
	if is_instance_valid(inspector_undo_button):
		inspector_undo_button.disabled = not value

func _set_inspector_size(value: float) -> void:
	if is_instance_valid(editor) and is_instance_valid(editor.selected):
		scale_requested.emit(value - editor.selected.scale.x)

func _close_inspector() -> void:
	if not is_instance_valid(editor):
		return
	editor.selected = null
	if is_instance_valid(editor.marker):
		editor.marker.visible = false
	editor.state_changed.emit()

func _refresh_inspector() -> void:
	var item := editor.selected
	inspector.visible = is_instance_valid(item) and not is_instance_valid(editor.preview)
	if not is_instance_valid(item):
		inspector_preview_asset_id = ""
		return
	inspector_name.text = "Town customization"
	inspector_kind.text = String(item.definition["name"])
	inspector_size_slider.set_value_no_signal(item.scale.x)
	inspector_size_label.text = "%d%%" % int(roundf(item.scale.x * 100.0))
	if inspector_preview_asset_id != item.asset_id:
		inspector_preview_asset_id = item.asset_id
		inspector_preview.show_scene(catalog.scenes.get(item.asset_id) as PackedScene)
