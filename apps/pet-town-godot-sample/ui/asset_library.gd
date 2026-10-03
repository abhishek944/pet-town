extends ColorRect

signal closed
signal place_requested(id: String, yaw: float, distance: float)
signal undo_requested
signal preview_requested(id: String, yaw: float, distance: float)
signal replace_requested(id: String, target: String, yaw: float)
signal restore_requested(target: String)
signal replace_preview_requested(id: String, target: String, yaw: float)
const Style = preload("res://ui/hud_style.gd")
var catalog: Array = []
var selected_id := ""
var angle := 0.0
var distance := 12.0
var card: PanelContainer
var cards: VBoxContainer
var preview: SubViewportContainer
var name_label: Label
var note: Label
var result: Label
var angle_label: Label
var add: Button
var catalog_note: Label
var targets: VBoxContainer
var split: HFlowContainer
var left_column: VBoxContainer
var right_column: VBoxContainer
var catalog_scroll: ScrollContainer
var placement_valid := true

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	color = Color("263f3255")
	Style.scrim(self, color, 2.0)
	card = PanelContainer.new()
	var box := Style.panel("fcf8e9", 26, "fff9dc")
	box.set_content_margin_all(24)
	card.add_theme_stylebox_override("panel", box)
	add_child(card)
	var scroll_content := ScrollContainer.new()
	scroll_content.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	card.add_child(scroll_content)
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.add_theme_constant_override("separation", 12)
	scroll_content.add_child(column)
	var header := HBoxContainer.new()
	column.add_child(header)
	var heading := VBoxContainer.new()
	heading.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	heading.add_child(Style.text("MAKE A PLACE YOUR OWN", 10, "7d8859"))
	heading.add_child(Style.title("Asset library", 26, "3d613f"))
	header.add_child(heading)
	var close := Style.button("×", Vector2(42, 42))
	close.size_flags_vertical = SIZE_SHRINK_BEGIN
	close.size_flags_horizontal = SIZE_SHRINK_BEGIN
	close.add_theme_font_size_override("font_size", 21)
	for state in ["normal", "hover", "pressed", "disabled"]:
		var circle := Style.panel("fcf8e900", 21, "d5ddc4", false)
		circle.set_content_margin_all(0)
		close.add_theme_stylebox_override(state, circle)
	close.pressed.connect(func() -> void: closed.emit())
	header.add_child(close)
	catalog_note = Style.text("", 11, "777b64")
	catalog_note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(catalog_note)
	var layout := HFlowContainer.new()
	split = layout
	layout.add_theme_constant_override("separation", 20)
	column.add_child(layout)
	var left := VBoxContainer.new()
	left_column = left
	left.custom_minimum_size.x = 365
	layout.add_child(left)
	left.add_child(Style.label("Collection", 12))
	var scroll := ScrollContainer.new()
	catalog_scroll = scroll
	scroll.custom_minimum_size = Vector2(365, 365)
	left.add_child(scroll)
	cards = VBoxContainer.new()
	cards.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cards.add_theme_constant_override("separation", 8)
	scroll.add_child(cards)
	var right := VBoxContainer.new()
	right_column = right
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right.add_theme_constant_override("separation", 9)
	layout.add_child(right)
	preview = preload("res://ui/library_preview.gd").new()
	right.add_child(preview)
	name_label = Style.title("Choose an asset", 22, "3d613f")
	right.add_child(name_label)
	note = Style.text("", 11, "777b64")
	right.add_child(note)
	var turn_row := HBoxContainer.new()
	right.add_child(turn_row)
	var turn := Style.flat_button("Turn 90°")
	turn.pressed.connect(func() -> void:
		angle = fmod(angle + PI / 2, TAU)
		update_preview())
	turn_row.add_child(turn)
	angle_label = Style.text("0°", 12)
	turn_row.add_child(angle_label)
	var distance_label := Style.label("Distance ahead  12 m", 12)
	right.add_child(distance_label)
	var slider := HSlider.new()
	Style.slider(slider)
	slider.min_value = 5
	slider.max_value = 24
	slider.value = distance
	slider.value_changed.connect(func(value: float) -> void:
		distance = value
		distance_label.text = "Distance ahead  %d m" % value
		preview_requested.emit(selected_id, angle, distance))
	right.add_child(slider)
	add = Style.flat_button("Add to this spot", "e7efd8", "d0ddbd")
	add.pressed.connect(func() -> void: place_requested.emit(selected_id, angle, distance))
	right.add_child(add)
	var undo := Style.flat_button("Undo latest asset change")
	undo.pressed.connect(func() -> void: undo_requested.emit())
	right.add_child(undo)
	targets = preload("res://ui/asset_targets.gd").new()
	right.add_child(targets)
	targets.replace_requested.connect(func(target: String) -> void: replace_requested.emit(selected_id, target, angle))
	targets.restore_requested.connect(func(target: String) -> void: restore_requested.emit(target))
	targets.target_changed.connect(func(target: String) -> void:
		add.disabled = not target.is_empty() or not placement_valid
		if not target.is_empty(): replace_preview_requested.emit(selected_id, target, angle))
	result = Style.text("", 11, "777b64")
	result.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	right.add_child(result)
	column.add_child(Style.text("Walk to a new spot before opening the library. K or Escape closes. H opens help; P takes a photo.", 11, "777b64"))
	resized.connect(resize_card)
	resize_card()
	hide()

func resize_card() -> void:
	card.size = Vector2(minf(880, size.x - 24), minf(760, size.y - 24))
	card.position = (size - card.size) / 2
	var width := card.size.x - 48
	left_column.custom_minimum_size.x = 365 if width > 740 else minf(365, width)
	catalog_scroll.custom_minimum_size = Vector2(left_column.custom_minimum_size.x, 365 if width > 740 else 180)
	right_column.custom_minimum_size.x = 370 if width > 740 else minf(370, width)
	preview.custom_minimum_size.x = right_column.custom_minimum_size.x

func set_catalog(entries: Array) -> void:
	catalog = entries
	Style.clear(cards)
	catalog_note.text = "%d crafted buildings, seats, lights and little landmarks. Choose one, check its preview, then place it deliberately." % catalog.size()
	for entry in catalog:
		var button := Style.flat_button(entry.get("name", entry.id) + "\n" + entry.get("category", ""))
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.pressed.connect(func() -> void:
			selected_id = entry.id
			update_preview())
		cards.add_child(button)
	add.disabled = catalog.is_empty()
	if not catalog.is_empty():
		selected_id = catalog[0].id
		update_preview()

func update_preview() -> void:
	for entry in catalog:
		if entry.id == selected_id:
			name_label.text = entry.get("name", entry.id)
			note.text = entry.get("footprint", "")
			preview.show_asset(entry, angle)
			angle_label.text = "%d°" % rad_to_deg(angle)
			preview_requested.emit(selected_id, angle, distance)
			if not targets.selected_id.is_empty(): replace_preview_requested.emit(selected_id, targets.selected_id, angle)
			return

func open_panel() -> void:
	result.text = ""
	show()
	preview_requested.emit(selected_id, angle, distance)

func set_result(message: String) -> void:
	result.text = message

func set_placement_result(message: String, valid: bool) -> void:
	result.text = message
	placement_valid = valid
	add.disabled = not valid or not targets.selected_id.is_empty()
