extends "res://scripts/ui_gallery_details.gd"

func _gallery_grid(parent: Node, columns: int) -> GridContainer:
	var grid := GridContainer.new()
	grid.columns = columns
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 7 if columns == 4 else 11)
	grid.add_theme_constant_override("v_separation", 7 if columns == 4 else 11)
	parent.add_child(grid)
	return grid

func _gallery_tile(grid: GridContainer, title: String, subtitle: String, compact := false) -> Button:
	var tile := _button("", false)
	tile.custom_minimum_size = Vector2(174 if compact else 160, 176 if compact else 244)
	tile.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tile.add_theme_stylebox_override("normal", _style(Color("294637"), 10, Color("769073")))
	tile.add_theme_stylebox_override("hover", _style(Color("355a43"), 10, GOLD))
	tile.add_theme_stylebox_override("focus", _style(Color("294637"), 10, GOLD))
	grid.add_child(tile)
	var content := VBoxContainer.new()
	content.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	content.offset_left = 3
	content.offset_top = 3
	content.offset_right = -3
	content.offset_bottom = -3
	content.add_theme_constant_override("separation", 2)
	content.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tile.add_child(content)
	var name := _label(title, 14 if compact else 15, CREAM)
	name.custom_minimum_size.y = 23
	name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name.mouse_filter = Control.MOUSE_FILTER_IGNORE
	content.add_child(name)
	if not subtitle.is_empty():
		var caption := _label(subtitle, 11, MUTED)
		caption.custom_minimum_size.y = 18
		caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		caption.mouse_filter = Control.MOUSE_FILTER_IGNORE
		content.add_child(caption)
	return tile

func _tile_picture(tile: Button, scene: PackedScene) -> void:
	var content := tile.get_child(0) as VBoxContainer
	var preview := PREVIEW_SCRIPT.new() as WorkshopModelPreview
	preview.custom_minimum_size = Vector2(140, 176)
	preview.size_flags_vertical = Control.SIZE_EXPAND_FILL
	preview.mouse_filter = Control.MOUSE_FILTER_IGNORE
	content.add_child(preview)
	content.move_child(preview, 0)
	preview.show_scene(scene)

func _tile_thumbnail(tile: Button, path: String) -> void:
	var content := tile.get_child(0) as VBoxContainer
	var picture := TextureRect.new()
	picture.custom_minimum_size.y = 120
	picture.size_flags_vertical = Control.SIZE_EXPAND_FILL
	picture.texture = load(path) as Texture2D
	picture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	picture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	picture.mouse_filter = Control.MOUSE_FILTER_IGNORE
	content.add_child(picture)
	content.move_child(picture, 0)

func _companions_page() -> void:
	if not selected_agent_id.is_empty():
		for record in agents:
			if String(record.get("id", "")) == selected_agent_id:
				_companion_detail(record)
				return
		selected_agent_id = ""
	if selected_companion >= 0 and selected_companion < companion_scenes.size():
		_character_detail(selected_companion)
		return
	_heading("Meet your companions", "Ten characters ready for your island.")
	if agents.is_empty() and companion_scenes.is_empty():
		settings_content.add_child(_label("Companions will appear here when they visit the island.", 14, MUTED))
		return
	if not companion_scenes.is_empty():
		var character_grid := _gallery_grid(settings_content, 5)
		for index in companion_scenes.size():
			var name := companion_names[index] if index < companion_names.size() else "Companion %d" % (index + 1)
			var tile := _gallery_tile(character_grid, name, "")
			tile.set_meta("focus_key", "character:%d" % index)
			_tile_picture(tile, companion_scenes[index])
			tile.pressed.connect(_select_character.bind(index))
	if not agents.is_empty():
		settings_content.add_child(_label("VISITING YOUR ISLAND", 12, GOLD))
		var active_grid := _gallery_grid(settings_content, 5)
		for record in agents:
			var tile := _gallery_tile(active_grid, String(record.get("label", "Companion")), String(record.get("status", "Visiting")))
			tile.set_meta("focus_key", "agent:%s" % String(record.get("id", "")))
			if not companion_scenes.is_empty():
				var index := clampi(int(record.get("appearance_index", 0)), 0, companion_scenes.size() - 1)
				_tile_picture(tile, companion_scenes[index])
			tile.pressed.connect(_select_agent.bind(String(record.get("id", ""))))

func _select_agent(id: String) -> void:
	selected_agent_id = id
	selected_companion = -1
	_show_settings_page()

func _select_character(index: int) -> void:
	selected_companion = index
	selected_agent_id = ""
	_show_settings_page()

func _objects_page() -> void:
	if not selected_object_id.is_empty():
		var item := catalog.get_item(selected_object_id)
		if not item.is_empty():
			_object_detail(item)
			return
		selected_object_id = ""
	var row := HBoxContainer.new()
	row.custom_minimum_size.y = get_viewport_rect().size.y - 16
	row.add_theme_constant_override("separation", 8)
	settings_content.add_child(row)
	var categories := VBoxContainer.new()
	categories.custom_minimum_size.x = 145
	categories.add_theme_constant_override("separation", 3)
	row.add_child(categories)
	categories.add_child(_label("%d OBJECTS" % catalog.items.size(), 11, GOLD))
	var names: Array[String] = ["All objects"]
	for item in catalog.items:
		var category := String(item["category"])
		if not names.has(category):
			names.append(category)
	for category in names:
		var filter := _button(category)
		filter.alignment = HORIZONTAL_ALIGNMENT_LEFT
		filter.custom_minimum_size.y = 38
		if category == object_category:
			filter.add_theme_stylebox_override("normal", _style(Color("3b5740"), 9, Color("3b5740")))
		else:
			filter.add_theme_stylebox_override("normal", _style(Color.TRANSPARENT, 9, Color.TRANSPARENT))
			filter.add_theme_stylebox_override("hover", _style(Color("315947"), 9, Color.TRANSPARENT))
		filter.pressed.connect(_set_object_category.bind(category))
		categories.add_child(filter)
	var spacer := Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	categories.add_child(spacer)
	var close := _button("×")
	close.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	close.pressed.connect(close_settings)
	categories.add_child(close)
	var results := ScrollContainer.new()
	results.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	results.size_flags_vertical = Control.SIZE_EXPAND_FILL
	results.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	row.add_child(results)
	var grid := _gallery_grid(results, 5 if get_viewport_rect().size.x >= 1300 else 4)
	for item in catalog.items:
		if object_category != "All objects" and String(item["category"]) != object_category:
			continue
		var subtitle := String(item["category"])
		if town_mode == "build":
			subtitle += " · %s credits" % _number(int(item["price"]))
		var tile := _gallery_tile(grid, String(item["name"]), subtitle, true)
		_tile_thumbnail(tile, String(item["thumbnail"]))
		tile.pressed.connect(_select_object.bind(String(item["id"])))

func _set_object_category(category: String) -> void:
	object_category = category
	_show_settings_page()

func _select_object(id: String) -> void:
	selected_object_id = id
	_show_settings_page()
