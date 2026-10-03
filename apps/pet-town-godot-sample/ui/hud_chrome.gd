extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const Dial = preload("res://ui/clock_dial.gd")

static func clock(host: CanvasLayer) -> void:
	var panel := Panel.new()
	panel.add_theme_stylebox_override("panel", Style.panel())
	Style.position(panel, Rect2(24, 22, 192, 64))
	host.root.add_child(panel)
	host.dial = Dial.new()
	host.dial.position = Vector2(15, 12)
	panel.add_child(host.dial)
	var time_row := HBoxContainer.new()
	time_row.position = Vector2(66, 8)
	time_row.add_theme_constant_override("separation", 5)
	panel.add_child(time_row)
	host.clock_label = Style.title("10:32", 24)
	time_row.add_child(host.clock_label)
	host.clock_period = Style.label("AM", 11)
	host.clock_period.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	time_row.add_child(host.clock_period)
	host.weather_label = Style.label("Sunny · Day 1", 12)
	host.weather_label.position = Vector2(66, 39)
	panel.add_child(host.weather_label)
	host.companions = Style.button("Companions · 0     ⌥ A", Vector2(166, 39))
	host.companions.add_theme_font_size_override("font_size", 12)
	host.companions.add_theme_font_override("font", Style.HEAVY)
	var wood := Style.panel("a57446", 12, "d8b788")
	wood.set_border_width_all(2)
	host.companions.add_theme_stylebox_override("normal", wood)
	host.companions.add_theme_color_override("font_color", Color("fff1d2"))
	host.companions.position = Vector2(24, 100)
	host.companions.pressed.connect(func() -> void: host.open_panel("Companions"))
	host.root.add_child(host.companions)

static func actions(host: CanvasLayer) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	row.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	row.offset_left = -172
	row.offset_right = -24
	row.offset_top = 24
	row.offset_bottom = 68
	host.root.add_child(row)
	for icon_name in ["camera", "sound", "help"]:
		var button := Style.button("", Vector2(44, 44))
		button.icon = Style.icon(icon_name)
		button.expand_icon = true
		button.add_theme_constant_override("icon_max_width", 21)
		for state in ["normal", "hover", "pressed"]:
			var box := host.root.theme.get_stylebox(state, "Button").duplicate() as StyleBoxFlat
			box.set_content_margin_all(0)
			button.add_theme_stylebox_override(state, box)
		row.add_child(button)
		var key: String = {"camera": "P", "sound": "M", "help": "H"}[icon_name]
		button.tooltip_text = {"camera": "Take photo (P)", "sound": "World sound (M)", "help": "Town settings (H)"}[icon_name]
		var hint := Style.label(key, 9)
		hint.position = Vector2(30, 34)
		var hint_style := Style.panel("f8ecd5", 5, "dec8a5", false)
		hint_style.set_content_margin_all(3)
		hint.add_theme_stylebox_override("normal", hint_style)
		button.add_child(hint)
		if icon_name == "camera":
			button.pressed.connect(func() -> void: host.photo_requested.emit())
		elif icon_name == "sound":
			host.sound_button = button
			button.pressed.connect(func() -> void: host.set_sound(not host.sound_enabled))
		else:
			button.pressed.connect(host.toggle_settings)
	for i in range(2):
		var title := "Journal" if i == 0 else "Asset library"
		var button := Style.flat_button("✿ " + title + ("    J" if i == 0 else "    K"), "fffdf2", "d5ddc4")
		button.custom_minimum_size = Vector2(119 if i == 0 else 160, 39)
		button.add_theme_color_override("font_color", Color("526054"))
		button.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
		button.offset_left = -139 if i == 0 else -180
		button.offset_right = -20
		button.offset_top = 96 + i * 44
		button.offset_bottom = 135 + i * 44
		button.pressed.connect(func() -> void: host.open_panel(title))
		host.root.add_child(button)

static func key_input(host: CanvasLayer, event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	if host.active_panel == "Welcome":
		host.close_panel()
		host.get_viewport().set_input_as_handled()
		return
	match event.physical_keycode:
		KEY_H: host.toggle_settings()
		KEY_ESCAPE:
			if not host.is_menu_open:
				return
			host.close_panel()
		KEY_J: host.open_panel("Journal")
		KEY_K: host.open_panel("Asset library")
		KEY_M:
			if event.alt_pressed: host.companion_action.emit("pet-town-mayor", "mayor_call", {})
			else: host.set_sound(not host.sound_enabled)
		_: return
	host.get_viewport().set_input_as_handled()
