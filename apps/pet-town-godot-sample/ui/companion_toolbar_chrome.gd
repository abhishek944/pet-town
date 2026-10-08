extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const ACTIONS := [
	{"key": "focus", "icon": "companion-toolbar-open"},
	{"key": "interact", "icon": "companion-toolbar-interact"},
	{"key": "control", "icon": "companion-toolbar-control"},
	{"key": "camera", "icon": "companion-toolbar-camera"},
	{"key": "leave", "icon": "companion-toolbar-leave"},
]

static func build(host: Control, activate: Callable, show_hint: Callable, sync_hint: Callable) -> Dictionary:
	host.clip_contents = false
	var panel := Style.panel("fff6e6f5", 18, "d4b78c", false)
	panel.corner_radius_top_left = 0
	panel.corner_radius_top_right = 0
	panel.shadow_color = Color("27332233")
	panel.shadow_size = 8
	panel.shadow_offset = Vector2(0, 4)
	panel.set_content_margin_all(0)
	host.add_theme_stylebox_override("panel", panel)
	var content := Control.new()
	content.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	content.clip_contents = false
	content.mouse_filter = Control.MOUSE_FILTER_IGNORE
	host.add_child(content)
	var row := HBoxContainer.new()
	row.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	row.offset_left = 14
	row.offset_right = -14
	row.offset_top = 10
	row.offset_bottom = -10
	row.add_theme_constant_override("separation", 10)
	content.add_child(row)
	var portrait_center := CenterContainer.new()
	portrait_center.custom_minimum_size = Vector2(56, 56)
	portrait_center.size_flags_vertical = Control.SIZE_EXPAND_FILL
	row.add_child(portrait_center)
	var portrait := Style.portrait({}, Vector2(56, 56))
	portrait_center.add_child(portrait)
	var identity := VBoxContainer.new()
	identity.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	identity.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	identity.custom_minimum_size.x = 72
	identity.add_theme_constant_override("separation", 3)
	row.add_child(identity)
	var heading := Style.title("Companion", 18)
	heading.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	identity.add_child(heading)
	var status := Style.text("Status unavailable", 11, "3d6748")
	status.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	identity.add_child(status)

	var action_scroll := ScrollContainer.new()
	action_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	action_scroll.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	action_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	action_scroll.follow_focus = true
	action_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	row.add_child(action_scroll)
	var action_row := HBoxContainer.new()
	action_row.add_theme_constant_override("separation", 7)
	action_scroll.add_child(action_row)
	var hint_layer := Control.new()
	hint_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hint_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint_layer.z_index = 2
	content.add_child(hint_layer)
	var buttons: Dictionary = {}
	var hints: Dictionary = {}
	for spec in ACTIONS:
		_create_action(action_row, hint_layer, spec, activate, show_hint, sync_hint, buttons, hints)
	return {"portrait": portrait, "heading": heading, "status": status,
		"action_scroll": action_scroll, "action_row": action_row, "hint_layer": hint_layer,
		"buttons": buttons, "hints": hints}

static func _create_action(action_row: HBoxContainer, hint_layer: Control, spec: Dictionary,
		activate: Callable, show_hint: Callable, sync_hint: Callable,
		buttons: Dictionary, hints: Dictionary) -> void:
	var key := str(spec.key)
	var button := Style.button("", Vector2(44, 44))
	button.icon = Style.icon(str(spec.icon))
	button.expand_icon = true
	button.add_theme_constant_override("icon_max_width", 22)
	button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.accessibility_name = key.capitalize()
	button.focus_mode = Control.FOCUS_ALL
	button.mouse_filter = Control.MOUSE_FILTER_STOP
	for icon_state in ["icon_normal_color", "icon_hover_color", "icon_pressed_color"]:
		button.add_theme_color_override(icon_state, Color("725638"))
	button.gui_input.connect(func(event: InputEvent) -> void:
		if event is InputEventMouseButton: button.set_meta("pointer", true)
		elif event is InputEventKey: button.set_meta("pointer", false))
	button.pressed.connect(func() -> void:
		# Return pointer actions to gameplay before dispatch can hide the toolbar.
		if button.get_meta("pointer", false): button.release_focus()
		activate.call(key))
	button.mouse_entered.connect(func() -> void: show_hint.call(key))
	button.mouse_exited.connect(func() -> void: sync_hint.call(key))
	button.focus_entered.connect(func() -> void: sync_hint.call(key))
	button.focus_exited.connect(func() -> void: sync_hint.call(key))
	action_row.add_child(button)
	buttons[key] = button
	var hint := Style.label("", 11)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hint.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
	hint.add_theme_color_override("font_color", Style.INK)
	var hint_style := Style.panel("fff8e9", 8, "e5d5b8", false)
	hint_style.content_margin_left = 10
	hint_style.content_margin_right = 10
	hint_style.content_margin_top = 6
	hint_style.content_margin_bottom = 6
	hint_style.shadow_color = Color("263f3233")
	hint_style.shadow_size = 5
	hint_style.shadow_offset = Vector2(0, 2)
	hint.add_theme_stylebox_override("normal", hint_style)
	hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint.z_index = 2
	hint.hide()
	hint_layer.add_child(hint)
	hints[key] = hint
