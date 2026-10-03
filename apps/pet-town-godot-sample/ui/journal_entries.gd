extends RefCounted

const Style = preload("res://ui/hud_style.gd")

static func experiences(body: VBoxContainer, entries: Array, host: Control) -> void:
	var grid := GridContainer.new()
	grid.columns = 1 if host.size.x < 740 or entries.size() == 1 else 2
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 16)
	grid.add_theme_constant_override("v_separation", 16)
	body.add_child(grid)
	for entry in entries:
		var card := PanelContainer.new()
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var box := Style.panel("fffdf6", 16, "e3e2d2", false)
		box.set_content_margin_all(17)
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
		art.custom_minimum_size = Vector2(0, 108)
		column.add_child(art)
		column.add_child(Style.title(entry.get("title", "Collect a view"), 18, "516d56"))
		column.add_child(Style.text(entry.get("meta", ""), 11, "899078"))
		var note := Style.text(entry.get("note", ""), 12, "74806c")
		note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		column.add_child(note)
		var buttons := HFlowContainer.new()
		column.add_child(buttons)
		for action in entry.get("actions", []):
			var button := Style.flat_button(action.label, "fffdf2", "d5ddc4")
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
			button.custom_minimum_size.y = 38
			button.disabled = not entry.get("enabled", true)
			button.set_meta("journal_action", str(entry.action))
			button.pressed.connect(func() -> void: host.action_requested.emit(entry.action))
			row.add_child(button)
