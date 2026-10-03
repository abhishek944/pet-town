extends PanelContainer

signal closed
signal action_requested(id: String, action: String, payload: Dictionary)
const Style = preload("res://ui/hud_style.gd")
var entries: Array = []
var selected_id := ""
var title: Label
var scroll: ScrollContainer
var rows: VBoxContainer
var buttons: Dictionary = {}
var portraits: Dictionary = {}
var names: Dictionary = {}
var statuses: Dictionary = {}
var following_labels: Dictionary = {}

func _ready() -> void:
	add_theme_stylebox_override("panel", Style.panel("fff6e6", 20, "d4b78c"))
	var column := VBoxContainer.new()
	add_child(column)
	var header := HBoxContainer.new()
	column.add_child(header)
	title = Style.title("Companions  0", 23)
	title.size_flags_horizontal = SIZE_EXPAND_FILL
	header.add_child(title)
	var close := Style.flat_button("×", "f5e8d0", "d7c09a")
	close.pressed.connect(func() -> void: closed.emit())
	header.add_child(close)
	column.add_child(Style.text("A little company for your time in town.", 12))
	scroll = ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size.y = 165
	column.add_child(scroll)
	rows = VBoxContainer.new()
	rows.size_flags_horizontal = SIZE_EXPAND_FILL
	rows.add_theme_constant_override("separation", 4)
	scroll.add_child(rows)
	var footer := HBoxContainer.new()
	column.add_child(footer)
	footer.add_child(Style.text("⌥ A  Cycle companions", 11))
	var settings := Style.flat_button("Companion settings  H")
	settings.pressed.connect(func() -> void: action_requested.emit(selected_id, "settings", {}))
	footer.add_child(settings)
	get_viewport().size_changed.connect(layout)
	layout()
	hide()

func layout() -> void:
	var viewport := get_viewport_rect().size
	position = Vector2(14 if viewport.x < 700 else 24, 142 if viewport.y < 600 else 152)
	custom_minimum_size.x = minf(348, viewport.x - 28)
	size.x = custom_minimum_size.x
	scroll.custom_minimum_size.y = minf(336, maxf(96, viewport.y - position.y - 145))

func set_data(data: Array, selected: String) -> void:
	entries = data
	selected_id = selected
	title.text = "Companions  %d" % entries.size()
	var ids: Array = entries.map(func(entry: Dictionary) -> String: return str(entry.get("id", "")))
	for id in buttons.keys():
		if id not in ids:
			buttons[id].queue_free()
			buttons.erase(id)
			portraits.erase(id)
			names.erase(id)
			statuses.erase(id)
			following_labels.erase(id)
	for entry in entries:
		var id: String = str(entry.get("id", ""))
		if not buttons.has(id):
			var button := Style.flat_button("")
			button.custom_minimum_size.y = 60
			button.alignment = HORIZONTAL_ALIGNMENT_LEFT
			button.pressed.connect(func() -> void: action_requested.emit(id, "follow", {}))
			rows.add_child(button)
			buttons[id] = button
			var content := HBoxContainer.new()
			content.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
			content.offset_left = 10
			content.offset_right = -10
			content.offset_top = 8
			content.offset_bottom = -8
			content.mouse_filter = MOUSE_FILTER_IGNORE
			button.add_child(content)
			portraits[id] = Style.portrait(entry)
			content.add_child(portraits[id])
			var identity := VBoxContainer.new()
			identity.mouse_filter = MOUSE_FILTER_IGNORE
			identity.size_flags_horizontal = SIZE_EXPAND_FILL
			content.add_child(identity)
			names[id] = Style.label("", 14)
			names[id].text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
			identity.add_child(names[id])
			statuses[id] = Style.text("", 11, "6b6a50")
			identity.add_child(statuses[id])
			following_labels[id] = Style.text("", 10, "54703d")
			content.add_child(following_labels[id])
		var label: String = str(entry.get("label", entry.get("displayLabel", "Companion")))
		var state: String = str(entry.get("status", "unknown"))
		var status: String = {"working":"Working", "blocked":"Needs you", "done":"Completed", "completed":"Completed", "idle":"Ready"}.get(state, "Status unavailable")
		names[id].text = label
		statuses[id].text = "● " + status
		following_labels[id].text = "✓\nFollowing" if id == selected_id else ""
		portraits[id].texture = Style.portrait_texture(entry)
		buttons[id].add_theme_stylebox_override("normal", Style.panel("e8edce" if id == selected_id else "fff6e6", 12, "aebc8b" if id == selected_id else "fff6e6", false))
		rows.move_child(buttons[id], ids.find(id))
	var empty := rows.get_node_or_null("Empty")
	if entries.is_empty() and not empty:
		empty = Style.text("No connected companions yet.\nYour explorer can still wander around town.", 12)
		empty.name = "Empty"
		empty.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		rows.add_child(empty)
	elif not entries.is_empty() and empty:
		empty.queue_free()
