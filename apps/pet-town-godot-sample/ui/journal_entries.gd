extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const Look = preload("res://ui/journal_style.gd")

static func summary(body: VBoxContainer, text: String) -> void:
	var label := Look.lines(Style.text(text, 12, Look.QUIET), 4)
	label.custom_minimum_size.y = 21
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(label)
	body.add_child(Look.spacer(16))

static func heading(body: VBoxContainer, text: String) -> void:
	body.add_child(Look.spacer(24))
	body.add_child(Style.title(text, 23, Look.INK))
	body.add_child(Look.spacer(19))

static func cards(body: VBoxContainer, entries: Array, host: Control, columns: int) -> void:
	var grid := GridContainer.new()
	grid.columns = maxi(1, columns)
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 14)
	body.add_child(grid)
	for entry in entries:
		grid.add_child(card(entry, host))

static func card(entry: Dictionary, host: Control) -> Control:
	var frame := PanelContainer.new()
	frame.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	frame.add_theme_stylebox_override("panel", Look.pad(Look.box(Look.PAPER, 12, Look.HAIRLINE, Vector4i(1, 1, 1, 1)), 16, 17, 16, 17))
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 0)
	frame.add_child(column)
	column.add_child(art(str(entry.get("art", "photo"))))
	column.add_child(Look.spacer(12))
	var title := Style.title(str(entry.get("title", "")), 19, Look.HEADING)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(title)
	column.add_child(Look.spacer(8))
	var meta := str(entry.get("meta", ""))
	if not meta.is_empty():
		var details := Look.lines(Style.text(meta, 11, Look.QUIET), 4)
		details.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		column.add_child(details)
		column.add_child(Look.spacer(10))
	var note := Look.lines(Style.text(str(entry.get("note", "")), 12, Look.QUIET), 2)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(note)
	column.add_child(Look.spacer(17))
	column.add_child(actions(entry.get("actions", []), host))
	return frame

static func art(kind: String) -> TextureRect:
	var picture := TextureRect.new()
	var path := "res://ui/icons/journal-%s.svg" % kind
	if not ResourceLoader.exists(path): path = "res://ui/icons/journal-photo.svg"
	picture.texture = load(path)
	picture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	picture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	picture.custom_minimum_size = Vector2(0, 76)
	picture.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return picture

static func actions(entries: Array, host: Control) -> Control:
	var row := HFlowContainer.new()
	row.add_theme_constant_override("h_separation", 7)
	row.add_theme_constant_override("v_separation", 7)
	for index in entries.size():
		var action: Dictionary = entries[index]
		var enabled: bool = action.get("enabled", true)
		var button := Look.action_button(str(action.get("label", "")), index == 0 and enabled)
		button.disabled = not enabled
		button.set_meta("journal_action", str(action.get("id", "")))
		button.accessibility_name = str(action.get("label", ""))
		button.pressed.connect(func() -> void: host.action_requested.emit(action.id))
		row.add_child(button)
	return row

static func places(body: VBoxContainer, entries: Array, host: Control) -> void:
	for entry in entries:
		var frame := PanelContainer.new()
		frame.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		frame.add_theme_stylebox_override("panel", Look.pad(Look.box(Look.CLEAR, 0, Look.HAIRLINE, Vector4i(0, 0, 0, 1)), 0, 14, 0, 15))
		body.add_child(frame)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 14)
		frame.add_child(row)
		var stamp := Style.text("✓" if entry.get("visited", false) else "○", 22, Look.GREEN)
		stamp.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		row.add_child(stamp)
		var copy := VBoxContainer.new()
		copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		copy.add_theme_constant_override("separation", 0)
		copy.add_child(Style.title(str(entry.get("name", "")), 19, Look.INK))
		copy.add_child(Look.spacer(7))
		var status := str(entry.get("status", ""))
		if not status.is_empty():
			var details := Look.lines(Style.text(status, 11, Look.QUIET), 4)
			details.custom_minimum_size.y = 18
			copy.add_child(details)
			copy.add_child(Look.spacer(3))
		var note := Look.lines(Style.text(str(entry.get("note", "")), 12, Look.QUIET), 4)
		note.custom_minimum_size.y = 21
		note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		copy.add_child(note)
		row.add_child(copy)
		if entry.has("action"):
			var button := Look.action_button(str(entry.get("action_label", "Visit →")), false, 12, 14)
			button.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			button.disabled = not entry.get("enabled", true)
			button.set_meta("journal_action", str(entry.action))
			button.accessibility_name = str(entry.get("action_label", "Visit →"))
			button.pressed.connect(func() -> void: host.action_requested.emit(entry.action))
			row.add_child(button)

static func reminder(body: VBoxContainer, entry: Dictionary, host: Control) -> void:
	var frame := PanelContainer.new()
	frame.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	frame.add_theme_stylebox_override("panel", Look.pad(Look.box(Look.SAGE, 12, Look.SAGE_EDGE, Vector4i(1, 1, 1, 1)), 16, 16, 16, 16))
	body.add_child(frame)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 20)
	frame.add_child(row)
	var copy := VBoxContainer.new()
	copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	copy.add_theme_constant_override("separation", 0)
	copy.add_child(Style.title(str(entry.get("title", "")), 19, Look.INK))
	copy.add_child(Look.spacer(6))
	var note := Look.lines(Style.text(str(entry.get("note", "")), 12, Look.INK), 4)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	copy.add_child(note)
	row.add_child(copy)
	var buttons := HFlowContainer.new()
	buttons.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	buttons.add_theme_constant_override("h_separation", 7)
	for action in entry.get("actions", []):
		var button := Look.action_button(str(action.get("label", "")), false, 12, 12)
		button.disabled = not action.get("enabled", true)
		button.set_meta("journal_action", str(action.get("id", "")))
		button.accessibility_name = str(action.get("label", ""))
		button.pressed.connect(func() -> void: host.action_requested.emit(action.id))
		buttons.add_child(button)
	row.add_child(buttons)
	body.add_child(Look.spacer(18))

static func tab_key(event: InputEvent, tab: Button, host: Control) -> void:
	if not event is InputEventKey or not event.pressed: return
	var index: int = host.tabs.find(tab)
	match event.keycode:
		KEY_LEFT, KEY_UP: index = posmod(index - 1, host.tabs.size())
		KEY_RIGHT, KEY_DOWN: index = posmod(index + 1, host.tabs.size())
		KEY_HOME: index = 0
		KEY_END: index = host.tabs.size() - 1
		_: return
	host.select_page(str(host.tabs[index].get_meta("journal_page", host.tabs[index].text)))
	host.tabs[index].grab_focus()
	host.accept_event()
