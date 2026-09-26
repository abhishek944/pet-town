class_name TownEditorChanges
extends RefCounted

static func rotate(editor, amount: float) -> void:
	var item: WorkshopObject = editor.preview if is_instance_valid(editor.preview) else editor.selected
	if not is_instance_valid(item):
		return
	var before: Array = editor.history.capture(editor)
	var previous := item.rotation.y
	item.rotation.y += deg_to_rad(amount)
	editor.marker.show_for(item)
	if not is_instance_valid(editor.preview):
		if editor.save():
			editor.history.push(editor.mode, before)
		else:
			item.rotation.y = previous
			editor.marker.show_for(item)
			editor.status = "Could not save the rotation."
	editor.state_changed.emit()

static func scale(editor, amount: float) -> void:
	var item: WorkshopObject = editor.preview if is_instance_valid(editor.preview) else editor.selected
	if not is_instance_valid(item):
		return
	var before: Array = editor.history.capture(editor)
	var size := clampf(item.scale.x + amount, 0.5, 2.0)
	if is_equal_approx(size, item.scale.x):
		return
	var previous := item.scale
	item.scale = Vector3.ONE * size
	editor.marker.show_for(item)
	if not is_instance_valid(editor.preview):
		if editor.save():
			editor.history.push(editor.mode, before)
		else:
			item.scale = previous
			editor.marker.show_for(item)
			editor.status = "Could not save the size."
	editor.state_changed.emit()

static func delete(editor) -> void:
	if not is_instance_valid(editor.selected) or is_instance_valid(editor.preview):
		return
	var before: Array = editor.history.capture(editor)
	var remaining := []
	for record in before:
		if record["id"] != editor.selected.object_id:
			remaining.append(record)
	if not editor.store.save_records(remaining):
		editor.status = "Could not save the removal."
		editor.state_changed.emit()
		return
	editor.selected.queue_free()
	editor.selected = null
	editor.marker.visible = false
	editor.status = "Object removed from the island."
	editor.history.push(editor.mode, before)
	editor.state_changed.emit()
