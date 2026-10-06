extends RefCounted

const Style = preload("res://ui/hud_style.gd")

static func experiences(body: VBoxContainer, entries: Array, host: Control, content_width: float = 900.0) -> void:
	var grid := GridContainer.new()
	var columns := 1 if content_width < 520 else 2 if content_width < 760 else 3
	grid.columns = mini(columns, maxi(entries.size(), 1))
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 14)
	body.add_child(grid)
	for entry in entries:
		var card := PanelContainer.new()
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var box := Style.panel("fffdf6", 16, "e3e2d2", false)
		box.set_content_margin_all(14)
		card.add_theme_stylebox_override("panel", box)
		grid.add_child(card)
		var column := VBoxContainer.new()
		column.add_theme_constant_override("separation", 11)
		card.add_child(column)
		var art := TextureRect.new()
		var art_path: String = "res://ui/icons/journal-%s.svg" % entry.get("art", "photo")
		if not ResourceLoader.exists(art_path): art_path = "res://ui/icons/journal-photo.svg"
		art.texture = load(art_path)
		art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		art.custom_minimum_size = Vector2(0, 82)
		column.add_child(art)
		var title := Style.title(entry.get("title", "Collect a view"), 18, "516d56")
		title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		column.add_child(title)
		var meta: String = str(entry.get("meta", ""))
		if not meta.is_empty():
			var details := Style.text(meta, 10, "899078")
			details.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			column.add_child(details)
		var note := Style.text(entry.get("note", ""), 12, "74806c")
		note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		note.custom_minimum_size.y = 60
		column.add_child(note)
		var buttons := HFlowContainer.new()
		column.add_child(buttons)
		for action in entry.get("actions", []):
			var button := Style.flat_button(action.label, "fffdf2", "d5ddc4")
			button.add_theme_font_size_override("font_size", 11)
			button.custom_minimum_size.y = 44
			button.accessibility_name = str(action.label)
			for state in ["normal", "hover", "pressed", "disabled"]:
				var button_style := button.get_theme_stylebox(state) as StyleBoxFlat
				button_style.content_margin_left = 9
				button_style.content_margin_right = 9
				button_style.content_margin_top = 0
				button_style.content_margin_bottom = 0
			button.disabled = not action.get("enabled", true)
			button.set_meta("journal_action", str(action.id))
			button.pressed.connect(func() -> void: host.action_requested.emit(action.id))
			buttons.add_child(button)

static func places(body: VBoxContainer, entries: Array, host: Control) -> void:
	for entry in entries:
		var card := PanelContainer.new()
		card.add_theme_stylebox_override("panel", Style.panel("fffdf4", 15, "e1e3d1", false))
		body.add_child(card)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 12)
		card.add_child(row)
		var stamp := Style.text("✓" if entry.get("visited", false) else "○", 21, "487143")
		stamp.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		row.add_child(stamp)
		var copy := VBoxContainer.new()
		copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		copy.add_theme_constant_override("separation", 3)
		copy.add_child(Style.text(entry.get("name", ""), 12, "56674c"))
		if entry.has("status"):
			copy.add_child(Style.text(entry.status, 10, "90917a"))
		var note := Style.text(entry.get("note", ""), 10, "90917a")
		note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		copy.add_child(note)
		row.add_child(copy)
		if entry.has("action"):
			var button := Style.flat_button(entry.get("action_label", "Find the way"))
			button.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			button.custom_minimum_size.y = 44
			button.accessibility_name = str(entry.get("action_label", "Find the way"))
			button.disabled = not entry.get("enabled", true)
			button.set_meta("journal_action", str(entry.action))
			button.pressed.connect(func() -> void: host.action_requested.emit(entry.action))
			row.add_child(button)

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
