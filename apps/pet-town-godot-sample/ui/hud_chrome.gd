extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const Dial = preload("res://ui/clock_dial.gd")

static func clock(host: CanvasLayer) -> void:
	var panel := Panel.new()
	panel.name = "Clock"
	var box := Style.panel("fff8e9", 18, "e4d2ad")
	box.shadow_color = Color("46604722")
	panel.add_theme_stylebox_override("panel", box)
	Style.position(panel, Rect2(24, 22, 192, 64))
	host.root.add_child(panel)
	host.dial = Dial.new()
	host.dial.position = Vector2(12, 12)
	panel.add_child(host.dial)
	var center := CenterContainer.new()
	Style.position(center, Rect2(62, 8, 118, 48))
	panel.add_child(center)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 4)
	center.add_child(column)
	var time_row := HBoxContainer.new()
	time_row.add_theme_constant_override("separation", 6)
	column.add_child(time_row)
	host.clock_label = Style.title("10:32", 24, "3d613f")
	time_row.add_child(host.clock_label)
	host.clock_period = Style.text("AM", 10, "736548")
	host.clock_period.size_flags_vertical = Control.SIZE_SHRINK_END
	time_row.add_child(host.clock_period)
	host.weather_label = Style.text("Sunny · Day 1", 11, "657354")
	column.add_child(host.weather_label)
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
	row.name = "CornerActions"
	row.add_theme_constant_override("separation", 8)
	row.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	row.offset_left = -160
	row.offset_right = -24
	row.offset_top = 22
	row.offset_bottom = 62
	host.root.add_child(row)
	for icon_name in ["camera", "sound", "settings-gear"]:
		var button := Style.button("", Vector2(40, 40))
		button.icon = Style.icon(icon_name)
		button.expand_icon = true
		button.add_theme_constant_override("icon_max_width", 18)
		var face := StyleBoxTexture.new()
		face.texture = Style.icon("cookie")
		face.expand_margin_left = 1
		face.expand_margin_right = 1
		face.expand_margin_top = 1
		face.expand_margin_bottom = 4
		face.set_content_margin_all(11)
		for state in ["normal", "hover", "pressed", "disabled"]:
			button.add_theme_stylebox_override(state, face)
		var focus := StyleBoxFlat.new()
		focus.bg_color = Color.TRANSPARENT
		focus.border_color = Color("355b43")
		focus.set_border_width_all(2)
		focus.set_expand_margin_all(4)
		button.add_theme_stylebox_override("focus", focus)
		var slot := Control.new()
		slot.custom_minimum_size = Vector2(40, 40)
		slot.mouse_filter = Control.MOUSE_FILTER_IGNORE
		row.add_child(slot)
		slot.add_child(button)
		var key: String = {"camera": "P", "sound": "M", "settings-gear": "H"}[icon_name]
		button.accessibility_name = {"camera": "Take photo", "sound": "World sound on", "settings-gear": "Town settings"}[icon_name]
		button.accessibility_description = "Shortcut: " + key
		var key_chip := Style.label(key, 9)
		Style.position(key_chip, Rect2(28, 28, 14, 16))
		key_chip.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		key_chip.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		key_chip.add_theme_color_override("font_color", Color("7e6f54"))
		var chip_style := Style.panel("fff9eb", 4, "d8c39e")
		chip_style.set_content_margin_all(0)
		chip_style.shadow_color = Color("50381d22")
		chip_style.shadow_offset = Vector2(0, 1)
		key_chip.add_theme_stylebox_override("normal", chip_style)
		button.add_child(key_chip)
		var hint := Style.label(button.accessibility_name + " · " + key, 13)
		var hint_box := Style.panel("fff8e9", 9, "fff8e9", false)
		hint_box.content_margin_left = 12
		hint_box.content_margin_right = 12
		hint_box.content_margin_top = 7
		hint_box.content_margin_bottom = 7
		hint_box.shadow_color = Color("24392533")
		hint_box.shadow_size = 10
		hint_box.shadow_offset = Vector2(0, 2)
		hint.add_theme_stylebox_override("normal", hint_box)
		hint.add_theme_color_override("font_color", Style.INK)
		hint.hide()
		button.add_child(hint)
		hint.position = Vector2((40 - hint.get_combined_minimum_size().x) / 2, 47)
		button.set_meta("shortcut_hint", hint)
		button.mouse_entered.connect(func() -> void:
			hint.show()
			lift_cookie(button, -1.5))
		button.mouse_exited.connect(func() -> void:
			hint.hide()
			lift_cookie(button, 0.0))
		button.focus_entered.connect(func() -> void: hint.visible = button.is_hovered())
		button.focus_exited.connect(func() -> void: hint.visible = button.is_hovered())
		if icon_name == "camera":
			button.pressed.connect(func() -> void: host.photo_requested.emit())
		elif icon_name == "sound":
			host.sound_button = button
			button.pressed.connect(func() -> void: host.set_sound(not host.sound_enabled))
		else:
			button.pressed.connect(host.toggle_settings)

static func dock_layout(host: CanvasLayer, width: float) -> void:
	var row := host.root.find_child("CornerActions", true, false) as HBoxContainer
	var compact: bool = width > 0 and host.root.size.x - width < 620
	row.offset_left = -160 - (0 if compact else width)
	row.offset_right = -24 - (0 if compact else width)
	row.offset_top = 148 if compact else 22
	row.offset_bottom = row.offset_top + 40

static func lift_cookie(button: Button, offset: float) -> void:
	var previous: Tween = button.get_meta("hover_tween") if button.has_meta("hover_tween") else null
	if is_instance_valid(previous):
		previous.kill()
	var tween := button.create_tween()
	button.set_meta("hover_tween", tween)
	tween.tween_property(button, "position:y", offset, 0.15)

static func key_input(host: CanvasLayer, event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	if host.active_panel == "Welcome":
		host.close_panel()
		host.get_viewport().set_input_as_handled()
		return
	match event.physical_keycode:
		KEY_T:
			if not event.alt_pressed or event.ctrl_pressed or event.meta_pressed: return
			host.live.toggle_usage()
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
