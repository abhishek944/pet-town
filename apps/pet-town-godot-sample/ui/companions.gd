extends Control

signal closed
signal action_requested(id: String, action: String, payload: Dictionary)

const Style = preload("res://ui/hud_style.gd")
const Chrome = preload("res://ui/companion_roster_chrome.gd")

var entries: Array = []
var selected_id := ""
var card: PanelContainer
var scroll: ScrollContainer
var rows: VBoxContainer
var count_label: Label
var close_button: Button
var settings_button: Button
var empty_label: Label
var buttons: Dictionary = {}
var wrappers: Dictionary = {}
var portraits: Dictionary = {}
var names: Dictionary = {}
var statuses: Dictionary = {}
var following_labels: Dictionary = {}

func _ready() -> void:
	var chrome: Dictionary = Chrome.build(self)
	card = chrome.card
	scroll = chrome.scroll
	rows = chrome.rows
	count_label = chrome.count_label
	close_button = chrome.close_button
	settings_button = chrome.settings_button
	empty_label = chrome.empty
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
				scroll.set_deferred("scroll_vertical", 0)
				return
	close_button.grab_focus()

func layout() -> void:
	if not is_instance_valid(card):
		return
	var rectangle := Chrome.card_rect(get_viewport_rect().size)
	card.position = rectangle.position
	card.size = rectangle.size

func set_data(data: Array, selected: String) -> void:
	var previous_scroll := scroll.scroll_vertical if is_instance_valid(scroll) else 0
	var focused := get_viewport().gui_get_focus_owner()
	var focused_id := ""
	var focused_index := -1
	for id in buttons:
		if buttons[id] == focused:
			focused_id = str(id)
			focused_index = rows.get_children().find(wrappers[id])
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
		wrappers[id].queue_free()
		buttons.erase(id)
		wrappers.erase(id)
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
		var status := Chrome.status_text(state)
		names[id].text = label
		statuses[id].text = "● " + status
		following_labels[id].visible = id == selected_id
		buttons[id].accessibility_name = "Follow %s, %s" % [label, status]
		buttons[id].accessibility_description = "Choose this companion to follow. This does not open an agent or terminal."
		portraits[id].texture = Chrome.crisp_portrait(entry)
		Chrome.apply_row_style(buttons[id], id == selected_id)
		wrappers[id].add_theme_constant_override("margin_bottom", 4 if id == selected_id else 0)
		rows.move_child(wrappers[id], ids.find(id))

	empty_label.visible = entries.is_empty()
	scroll.set_deferred("scroll_vertical", previous_scroll)
	if not focused_id.is_empty() and not buttons.has(focused_id) and is_visible_in_tree():
		call_deferred("_restore_row_focus", focused_index)

func _create_row(id: String, entry: Dictionary) -> void:
	var wrapper := MarginContainer.new()
	wrapper.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	wrapper.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rows.add_child(wrapper)
	wrappers[id] = wrapper

	var button := Style.flat_button("")
	button.custom_minimum_size.y = 88
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.pressed.connect(func() -> void: action_requested.emit(id, "follow", {}))
	wrapper.add_child(button)
	buttons[id] = button

	var content := HBoxContainer.new()
	content.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	content.offset_left = 12
	content.offset_right = -12
	content.offset_top = 12
	content.offset_bottom = -12
	content.add_theme_constant_override("separation", 12)
	content.mouse_filter = Control.MOUSE_FILTER_IGNORE
	button.add_child(content)
	portraits[id] = Style.portrait(entry, Vector2(56, 60))
	portraits[id].texture = Chrome.crisp_portrait(entry)
	portraits[id].texture_filter = Control.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	portraits[id].size_flags_vertical = Control.SIZE_SHRINK_CENTER
	content.add_child(portraits[id])

	var identity := VBoxContainer.new()
	identity.mouse_filter = Control.MOUSE_FILTER_IGNORE
	identity.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	identity.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	identity.add_theme_constant_override("separation", 4)
	content.add_child(identity)
	names[id] = Style.label("", 15)
	names[id].add_theme_color_override("font_color", Color("343b30"))
	names[id].text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	identity.add_child(names[id])
	statuses[id] = Style.text("", 12, "59634f")
	identity.add_child(statuses[id])
	following_labels[id] = Style.text("✓ Following", 11, "45623c")
	following_labels[id].visible = false
	identity.add_child(following_labels[id])
	var arrow := Style.text("→", 20, "63764f")
	arrow.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	content.add_child(arrow)

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
