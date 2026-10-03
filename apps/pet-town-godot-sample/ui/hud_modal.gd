extends ColorRect
signal closed
signal reset_requested
signal sound_toggled(enabled: bool)
signal volume_changed(value: float)
signal camera_requested(first_person: bool)
signal companion_action(id: String, action: String, payload: Dictionary)
const Style = preload("res://ui/hud_style.gd")
const Pages = preload("res://ui/settings_pages.gd")
var card: Panel
var contents: VBoxContainer
var tabs: Array[Button] = []
var sound_enabled := true
var volume := 0.8
var selected_tab := "Companions"
var confirmation: ColorRect
var companions: Array = []
var selected_id := ""
var pet_catalog: Array = []
var gallery: Control
var header_art: TextureRect
var close_button: Button
var scroll_body: ScrollContainer
var tabs_row: HBoxContainer
var footer_bar: Panel
var reset_button: Button
var update_state: Dictionary = {}
var updates: VBoxContainer
func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	color = Color("17271d55")
	Style.scrim(self, color, 1.5)
	mouse_filter = Control.MOUSE_FILTER_STOP
	card = Panel.new()
	var panel := Style.panel("fff6e4", 23, "d4b489")
	panel.set_border_width_all(2)
	panel.shadow_color = Color("987044")
	panel.shadow_offset = Vector2(0, 6)
	card.add_theme_stylebox_override("panel", panel)
	add_child(card)
	var header := TextureRect.new()
	header_art = header
	header.texture = load("res://ui/icons/settings-header.svg")
	Style.position(header, Rect2(2, 2, 740, 91))
	header.mouse_filter = MOUSE_FILTER_IGNORE
	card.add_child(header)
	var title := Style.title("Town settings", 27, "fff0d3")
	title.position = Vector2(25, 18)
	card.add_child(title)
	var sub := Style.text("A little company for your time in town.", 12, "f2dfbf")
	sub.position = Vector2(25, 52)
	card.add_child(sub)
	var close := Style.flat_button("Close ×", "f6e5c8", "e1c299")
	close_button = close
	Style.position(close, Rect2(647, 28, 68, 38))
	close.pressed.connect(func() -> void: closed.emit())
	card.add_child(close)
	var row := HBoxContainer.new()
	tabs_row = row
	Style.position(row, Rect2(24, 109, 680, 41))
	row.add_theme_constant_override("separation", 8)
	card.add_child(row)
	for tab_name in ["Companions", "World", "How to play", "About"]:
		var tab := Style.button(tab_name)
		tab.add_theme_font_size_override("font_size", 13)
		tab.pressed.connect(func() -> void: select_tab(tab_name))
		row.add_child(tab)
		tabs.append(tab)
	var scroll := ScrollContainer.new()
	scroll_body = scroll
	Style.position(scroll, Rect2(25, 177, 694, 270))
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	card.add_child(scroll)
	contents = VBoxContainer.new()
	contents.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	contents.add_theme_constant_override("separation", 17)
	scroll.add_child(contents)
	var footer := Panel.new()
	footer_bar = footer
	footer.add_theme_stylebox_override("panel", Style.panel("f4e9d3", 0, "deccac", false))
	Style.position(footer, Rect2(2, 446, 740, 43))
	card.add_child(footer)
	var hint := Style.text("H   Close · Back to town", 11)
	hint.position = Vector2(23, 14)
	footer.add_child(hint)
	var reset := Style.flat_button("Reset world…", "f4e9d3", "f4e9d3")
	reset_button = reset
	reset.position = Vector2(606, 2)
	reset.add_theme_font_size_override("font_size", 11)
	reset.add_theme_color_override("font_color", Color("9c6244"))
	reset.pressed.connect(show_reset)
	footer.add_child(reset)
	resized.connect(layout)
	layout()
	hide()
func layout() -> void:
	card.size = Vector2(minf(744, size.x - 24), minf(490, size.y - 24))
	card.position = (size - card.size) / 2
	header_art.size.x = card.size.x - 4
	close_button.position.x = card.size.x - 97
	tabs_row.size.x = card.size.x - 48
	for tab in tabs: tab.add_theme_font_size_override("font_size", 10 if card.size.x < 540 else 13)
	scroll_body.position.y = 166
	scroll_body.size = Vector2(card.size.x - 50, maxf(80, card.size.y - 220))
	footer_bar.position.y = card.size.y - 44
	footer_bar.size.x = card.size.x - 4
	reset_button.position.x = maxf(150, card.size.x - 138)
func open_panel(kind: String) -> void:
	select_tab("How to play" if kind == "How to play" else "Companions")
	show()
func select_tab(tab_name: String) -> void:
	selected_tab = tab_name
	Style.clear(contents)
	for tab in tabs:
		var box := Style.panel("fff6e4", 0, "426448" if tab.text == tab_name else "fff6e4", false)
		box.set_border_width_all(0)
		box.border_width_bottom = 3
		box.content_margin_left = 17
		box.content_margin_right = 17
		for state in ["normal", "hover", "pressed"]:
			tab.add_theme_stylebox_override(state, box)
		tab.add_theme_color_override("font_color", Color("3f603f" if tab.text == tab_name else "716449"))
	match tab_name:
		"World": Pages.world(contents, self)
		"How to play": Pages.help(contents)
		"About":
			updates = preload("res://ui/app_updates.gd").new()
			contents.add_child(updates)
			updates.action_requested.connect(func(action: String) -> void: companion_action.emit("", action, {}))
			updates.set_state(update_state)
		_: preload("res://ui/companion_pages.gd").profile(contents, self)
func show_reset() -> void:
	if is_instance_valid(confirmation):
		return
	confirmation = ColorRect.new()
	confirmation.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	confirmation.color = Color("3c281e47")
	confirmation.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(confirmation)
	var box := PanelContainer.new()
	box.add_theme_stylebox_override("panel", Style.panel("fff8e9", 24, "ffffff"))
	var width := minf(440, size.x - 32)
	Style.position(box, Rect2((size.x - width) / 2, (size.y - 210) / 2, width, 210))
	confirmation.add_child(box)
	confirmation.gui_input.connect(func(event: InputEvent) -> void:
		if event is InputEventMouseButton and event.pressed and not box.get_global_rect().has_point(event.global_position): dismiss_confirmation())
	var column := VBoxContainer.new()
	box.add_child(column)
	column.add_child(Style.title("Start the world over?", 22))
	var note := Style.text("Every block you placed or broke goes back to how the island began. This can't be undone.", 15)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note.custom_minimum_size.x = width - 35
	column.add_child(note)
	var row := HBoxContainer.new()
	column.add_child(row)
	for title in ["Keep my world  Esc", "Reset  ↵"]:
		var button := Style.flat_button(title)
		row.add_child(button)
		if title == "Keep my world  Esc": button.call_deferred("grab_focus")
		button.pressed.connect(func() -> void:
			if title == "Reset  ↵": confirm_reset()
			else: dismiss_confirmation())
func dismiss_confirmation() -> void:
	if is_instance_valid(confirmation):
		confirmation.queue_free()
	confirmation = null
func show_pet_gallery() -> void:
	var pet_id := ""
	for entry in companions:
		if str(entry.id) == selected_id: pet_id = str(entry.get("petId", ""))
	Style.clear(contents)
	gallery = preload("res://ui/pet_gallery.gd").new()
	contents.add_child(gallery)
	gallery.back_requested.connect(func() -> void:
		gallery = null
		select_tab("Companions"))
	gallery.action_requested.connect(func(id: String, action: String, payload: Dictionary) -> void: companion_action.emit(id, action, payload))
	gallery.setup(pet_catalog, selected_id, pet_id)
func refresh_companions() -> void:
	if is_instance_valid(gallery):
		gallery.validate_target(selected_id, companions)
	else:
		select_tab("Companions")

func set_app_update(state: Dictionary) -> void:
	update_state = state
	if is_instance_valid(updates): updates.set_state(state)

func confirm_reset() -> void:
	if not is_instance_valid(confirmation): return
	dismiss_confirmation()
	reset_requested.emit()
	closed.emit()
