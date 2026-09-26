class_name TownLayoutSwitch
extends RefCounted

static func apply_mode(editor: WorkshopEditor, value: String) -> bool:
	if value not in ["chill", "build"] or editor.catalog == null:
		return false
	editor.cancel_preview()
	editor.selected = null
	editor.marker.visible = false
	for child in editor.get_children():
		child.free()
	editor.mode = value
	editor.store.mode = value
	editor.next_id = editor.store.populate(editor, editor.catalog, editor.MAX_OBJECTS)
	editor.status = "Choose an object to place on your island."
	editor.state_changed.emit()
	return true
