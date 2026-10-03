extends VBoxContainer

signal replace_requested(target: String)
signal restore_requested(target: String)
signal target_changed(target: String)
const Style = preload("res://ui/hud_style.gd")
var entries: Array = []
var selected_id := ""
var picker: OptionButton
var replace: Button
var restore: Button

func _ready() -> void:
	add_child(Style.label("Nearby original assets", 12))
	picker = OptionButton.new()
	picker.item_selected.connect(func(index: int) -> void:
		selected_id = str(entries[index-1].id) if index > 0 else ""
		update_actions()
		target_changed.emit(selected_id))
	add_child(picker)
	replace = Style.flat_button("Replace nearby asset", "e7efd8", "d0ddbd")
	replace.pressed.connect(func() -> void: replace_requested.emit(selected_id))
	add_child(replace)
	restore = Style.flat_button("Restore original asset")
	restore.pressed.connect(func() -> void: restore_requested.emit(selected_id))
	add_child(restore)
	set_data([])

func set_data(data: Array) -> void:
	if entries == data and picker.item_count > 0: return
	entries = data.duplicate(true)
	picker.clear()
	picker.add_item("New asset · add to this spot")
	var index := 0
	for entry in entries:
		picker.add_item("%s · %dm · %s" % [entry.get("name", entry.id), roundi(float(entry.get("distance", 0))), str(entry.get("position", ""))])
		if str(entry.id) == selected_id: index = picker.item_count - 1
	picker.select(index)
	if index == 0: selected_id = ""
	update_actions()

func update_actions() -> void:
	replace.disabled = selected_id.is_empty()
	restore.disabled = true
	for entry in entries:
		if str(entry.id) == selected_id: restore.disabled = not entry.get("replaced", false)
