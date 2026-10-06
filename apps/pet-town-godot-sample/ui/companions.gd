extends Control

signal closed
signal action_requested(id: String, action: String, payload: Dictionary)

const Style = preload("res://ui/hud_style.gd")

var entries: Array = []
var selected_id := ""
var card: PanelContainer
var scroll: ScrollContainer
var rows: VBoxContainer
var count_label: Label
var close_button: Button
var settings_button: Button
var buttons: Dictionary = {}
var portraits: Dictionary = {}
var names: Dictionary = {}
var statuses: Dictionary = {}
var following_labels: Dictionary = {}

func _ready() -> void:
	var chrome: Dictionary = preload("res://ui/companion_roster_chrome.gd").build(self)
	card = chrome.card
	scroll = chrome.scroll
	rows = chrome.rows
	count_label = chrome.count_label
	close_button = chrome.close_button
	settings_button = chrome.settings_button
	close_button.pressed.connect(func() -> void: closed.emit())
	settings_button.pressed.connect(func() -> void: action_requested.emit(selected_id, "settings", {}))
	get_viewport().size_changed.connect(layout)
	visibility_changed.connect(_visibility_changed)
	layout()
	hide()

func _visibility_changed() -> void:
	if not is_visible_in_tree():
		return
	call_deferred("_focus_initial")

func _focus_initial() -> void:
	if not is_visible_in_tree():
		return
	var focused := get_viewport().gui_get_focus_owner()
	if is_instance_valid(focused) and is_ancestor_of(focused):
		return
	if not entries.is_empty():
		for entry in entries:
			var id := str(entry.get("id", ""))
			if buttons.has(id):
				buttons[id].grab_focus()
				return
	close_button.grab_focus()

func layout() -> void:
	if not is_instance_valid(card):
		return
	var viewport := get_viewport_rect().size
	var compact := viewport.x < 700 or viewport.y < 600
	var origin := Vector2(14 if compact else 24, 142 if viewport.y < 600 else 152)
	var width := minf(348.0, maxf(0.0, viewport.x - origin.x - 16.0))
	var height := minf(420.0, maxf(0.0, viewport.y - origin.y - 12.0))
	card.position = origin
	card.size = Vector2(width, height)

func set_data(data: Array, selected: String) -> void:
	var previous_scroll := scroll.scroll_vertical if is_instance_valid(scroll) else 0
	var focused := get_viewport().gui_get_focus_owner()
	var focused_id := ""
	var focused_index := -1
	for id in buttons:
		if buttons[id] == focused:
			focused_id = str(id)
			focused_index = rows.get_children().find(buttons[id])
			break

	entries = data
	selected_id = selected
	count_label.text = str(entries.size())
	var ids: Array[String] = []
	for entry in entries:
		var id := str(entry.get("id", ""))
		if not id.is_empty():
			ids.append(id)

	for id in buttons.keys():
		if id in ids:
			continue
		buttons[id].queue_free()
		buttons.erase(id)
		portraits.erase(id)
		names.erase(id)
		statuses.erase(id)
		following_labels.erase(id)

	for entry in entries:
		var id := str(entry.get("id", ""))
		if id.is_empty():
			continue
		if not buttons.has(id):
			_create_row(id, entry)
		var label := Style.text_or(entry.get("label", entry.get("displayLabel")), "Companion")
		var state := str(entry.get("status", ""))
		var status := _status_text(state)
		names[id].text = label
		statuses[id].text = "● " + status
		statuses[id].add_theme_color_override("font_color", Color("946329") if state == "blocked" else Color("54703d") if state in ["done", "completed"] else Color("6b6a50"))
		following_labels[id].text = "✓ Following" if id == selected_id else ""
		buttons[id].accessibility_name = "Follow %s, %s" % [label, status]
		buttons[id].accessibility_description = "Choose this companion to follow. This does not open an agent or terminal."
		portraits[id].texture = Style.portrait_texture(entry)
		_style_row(buttons[id], id == selected_id)
		rows.move_child(buttons[id], ids.find(id))

	var empty := rows.get_node_or_null("Empty") as Label
	if entries.is_empty() and not is_instance_valid(empty):
		empty = Style.text("No companions are available right now.\nYour explorer can still wander around town.", 12)
		empty.name = "Empty"
		empty.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		empty.custom_minimum_size = Vector2(0, 72)
		rows.add_child(empty)
	elif not entries.is_empty() and is_instance_valid(empty):
		empty.queue_free()

	scroll.set_deferred("scroll_vertical", previous_scroll)
	if not focused_id.is_empty() and not buttons.has(focused_id) and is_visible_in_tree():
		call_deferred("_restore_row_focus", focused_index)

func _create_row(id: String, entry: Dictionary) -> void:
	var button := Style.flat_button("")
	button.custom_minimum_size.y = 72
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.pressed.connect(func() -> void: action_requested.emit(id, "follow", {}))
	rows.add_child(button)
	buttons[id] = button

	var content := HBoxContainer.new()
	content.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	content.offset_left = 10
	content.offset_right = -10
	content.offset_top = 8
	content.offset_bottom = -8
	content.add_theme_constant_override("separation", 12)
	content.mouse_filter = Control.MOUSE_FILTER_IGNORE
	button.add_child(content)
	portraits[id] = Style.portrait(entry, Vector2(46, 46))
	content.add_child(portraits[id])

	var identity := VBoxContainer.new()
	identity.mouse_filter = Control.MOUSE_FILTER_IGNORE
	identity.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	identity.alignment = BoxContainer.ALIGNMENT_CENTER
	content.add_child(identity)
	names[id] = Style.label("", 14)
	names[id].text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	identity.add_child(names[id])
	statuses[id] = Style.text("", 11, "6b6a50")
	identity.add_child(statuses[id])
	following_labels[id] = Style.text("", 10, "54703d")
	content.add_child(following_labels[id])
	var arrow := Style.text("→", 18, "7c8b60")
	content.add_child(arrow)

func _style_row(button: Button, selected: bool) -> void:
	var fill := "e8edce" if selected else "fffaf1"
	var border := "aebc8b" if selected else "eadac0"
	for state in ["normal", "hover", "pressed"]:
		var box := Style.panel("ffffff" if state == "hover" and not selected else fill, 12, border, false)
		box.set_content_margin_all(0)
		button.add_theme_stylebox_override(state, box)

func _status_text(state: String) -> String:
	return {
		"working": "Working",
		"blocked": "Needs you",
		"done": "Completed",
		"completed": "Completed",
		"idle": "Ready",
	}.get(state, "Status unavailable")

func _restore_row_focus(index: int) -> void:
	if not is_visible_in_tree():
		return
	var live_rows: Array[Button] = []
	for entry in entries:
		var id := str(entry.get("id", ""))
		if buttons.has(id):
			live_rows.append(buttons[id])
	if live_rows.is_empty():
		close_button.grab_focus()
		return
	live_rows[clampi(index, 0, live_rows.size() - 1)].grab_focus()
