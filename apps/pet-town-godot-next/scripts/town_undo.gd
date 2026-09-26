class_name TownUndo
extends RefCounted

const MAX_ACTIONS := 50
var stacks := {"chill": [], "build": []}

func capture(editor) -> Array:
	var records := []
	for child in editor.get_children():
		var item := child as WorkshopObject
		if item == null or item.is_queued_for_deletion() or (item == editor.preview and not editor.moving):
			continue
		records.append(item.record())
	return records

func push(mode: String, records: Array, item_id := "", price := 0) -> void:
	var stack: Array = stacks[mode]
	stack.append({"records": records, "item_id": item_id, "price": price})
	if stack.size() > MAX_ACTIONS:
		stack.pop_front()

func can_undo(mode: String) -> bool:
	return not (stacks[mode] as Array).is_empty()

func undo(editor) -> bool:
	if is_instance_valid(editor.preview):
		editor.cancel_preview()
	var stack: Array = stacks[editor.mode]
	if stack.is_empty():
		editor.status = "There is no change to undo in this mode."
		editor.state_changed.emit()
		return false
	var action: Dictionary = stack.back()
	var current := capture(editor)
	if not editor.store.save_records(action["records"]):
		editor.status = "Could not save the undone layout."
		editor.state_changed.emit()
		return false
	if int(action["price"]) > 0 and not editor.wallet.undo_last_purchase(String(action["item_id"]), int(action["price"])):
		editor.store.save_records(current)
		editor.status = "Could not refund the last purchase. The island was not changed."
		editor.state_changed.emit()
		return false
	stack.pop_back()
	editor.reload_mode_layout(editor.mode)
	editor.status = "Last change undone."
	editor.state_changed.emit()
	return true
