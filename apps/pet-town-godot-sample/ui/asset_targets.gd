extends VBoxContainer
# Nearby-target controls for the Asset Library. Only presentation changed for
# library:B1; the explicit New/Replace/Restore/disappearing-target behavior,
# option ids and signal emissions stay exactly as before.

signal replace_requested(target: String)
signal restore_requested(target: String)
signal target_changed(target: String)

const Style = preload("res://ui/hud_style.gd")
const Look = preload("res://ui/library_style.gd")

var entries: Array = []
var selected_id := ""
var option_ids: Array[String] = []
var picker: OptionButton
var replace: Button
var restore: Button
var status: Label
var asset_available := false
var options_initialized := false
var compact := false

func _ready() -> void:
	add_theme_constant_override("separation", 0)
	add_child(Look.heading("Nearby original or placed assets"))
	add_child(Look.spacer(12))
	picker = OptionButton.new()
	picker.custom_minimum_size.y = 44
	picker.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	picker.accessibility_name = "Nearby asset target"
	picker.fit_to_longest_item = false
	picker.clip_text = true
	picker.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	picker.add_theme_font_size_override("font_size", 11)
	for state in ["normal", "hover", "pressed", "disabled"]:
		picker.add_theme_stylebox_override(state, Look.select_box())
	for state in ["font_color", "font_focus_color", "font_hover_color", "font_pressed_color"]:
		picker.add_theme_color_override(state, Color(Look.INK))
	picker.item_selected.connect(_select_target)
	add_child(picker)
	add_child(Look.spacer(10))
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 8)
	add_child(actions)
	replace = Style.button("Replace nearby asset")
	replace.custom_minimum_size.y = 44
	replace.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	replace.pressed.connect(func() -> void: replace_requested.emit(selected_id))
	actions.add_child(replace)
	restore = Style.button("Restore original asset")
	restore.custom_minimum_size.y = 44
	restore.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	restore.pressed.connect(func() -> void: restore_requested.emit(selected_id))
	actions.add_child(restore)
	add_child(Look.spacer(8))
	status = Look.hint("")
	add_child(status)
	style_buttons()
	set_data([])

func apply_layout(value: bool) -> void:
	compact = value
	style_buttons()

func style_buttons() -> void:
	if not is_instance_valid(replace) or not is_instance_valid(restore):
		return
	var font_size := 12 if compact else 10
	var pad_h := 10 if compact else 6
	var pad_v := 10 if compact else 9
	Look.style_action(replace, not replace.disabled, font_size, pad_h, pad_v)
	Look.style_action(restore, false, font_size, pad_h, pad_v)

func set_asset_available(available: bool) -> void:
	asset_available = available
	update_actions()

func set_data(data: Array) -> void:
	var was_available := _has_target(selected_id)
	var same_ids := options_initialized and _same_ids(data)
	entries = data.duplicate(true)
	if same_ids:
		for index in range(entries.size()):
			picker.set_item_text(index + 1, _target_label(entries[index]))
		update_actions()
		var still_available := _has_target(selected_id)
		if not selected_id.is_empty() and was_available != still_available:
			target_changed.emit(selected_id)
		return

	picker.clear()
	option_ids.clear()
	picker.add_item("New asset · add to this spot")
	option_ids.append("")
	var selected_index := 0
	var selected_found := selected_id.is_empty()
	for entry in entries:
		var target_id := str(entry.get("id", ""))
		picker.add_item(_target_label(entry))
		option_ids.append(target_id)
		if target_id == selected_id:
			selected_index = picker.item_count - 1
			selected_found = true
	if not selected_id.is_empty() and not selected_found:
		picker.add_item("Previously selected target · no longer nearby")
		option_ids.append(selected_id)
		selected_index = picker.item_count - 1
	picker.select(maxi(0, selected_index))
	options_initialized = true
	update_actions()
	var still_available := _has_target(selected_id)
	if not selected_id.is_empty() and was_available != still_available:
		target_changed.emit(selected_id)

func _select_target(index: int) -> void:
	if index < 0 or index >= option_ids.size():
		return
	selected_id = option_ids[index]
	update_actions()
	target_changed.emit(selected_id)

func _same_ids(data: Array) -> bool:
	if entries.size() != data.size():
		return false
	for index in range(data.size()):
		if str(entries[index].get("id", "")) != str(data[index].get("id", "")):
			return false
	return true

func _has_target(target_id: String) -> bool:
	if target_id.is_empty():
		return false
	for entry in entries:
		if str(entry.get("id", "")) == target_id:
			return true
	return false

func _target_label(entry: Dictionary) -> String:
	return "%s · %dm · %s" % [entry.get("name", entry.get("id", "Asset")), roundi(float(entry.get("distance", 0))), str(entry.get("position", ""))]

func update_actions() -> void:
	if not is_instance_valid(replace) or not is_instance_valid(restore):
		return
	var available := _has_target(selected_id)
	var selected_replaced := false
	if available:
		for entry in entries:
			if str(entry.get("id", "")) == selected_id:
				selected_replaced = bool(entry.get("replaced", false))
				break
	replace.disabled = not asset_available or not available
	restore.disabled = not available or not selected_replaced
	if not selected_id.is_empty() and not available:
		status.text = "Selected target is no longer nearby. Choose another target or explicitly choose New asset."
	elif entries.is_empty():
		status.text = "No nearby assets are available."
	elif selected_replaced:
		status.text = "The original can be restored."
	elif not selected_id.is_empty() and not selected_id.begins_with("added:"):
		status.text = "A nearby original asset is selected."
	else:
		status.text = ""
	status.visible = not status.text.is_empty()
	style_buttons()
