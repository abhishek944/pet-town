extends Control

signal action_requested(id: String)
signal helm_requested(action: String, held: bool)
const Style = preload("res://ui/hud_style.gd")
const Layout = preload("res://ui/ocean_controls_layout.gd")
var compass: PanelContainer
var title: Label
var hint: Label
var action: Button
var dive: Button
var helm: GridContainer
var heading_available := false
var action_available := false
var is_piloting := false
var is_swimming := false
var captured := false
var heading_layout_available := false
var action_layout_available := false
var layout_helper := Layout.new()

func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	compass = PanelContainer.new()
	var compass_style := Style.panel("fffaf0f2", 16, "c4d7c3")
	compass_style.content_margin_left = 14
	compass_style.content_margin_right = 14
	compass_style.content_margin_top = 12
	compass_style.content_margin_bottom = 12
	compass_style.shadow_color = Color("47665322")
	compass_style.shadow_size = 3
	compass_style.shadow_offset = Vector2(0, 3)
	compass.add_theme_stylebox_override("panel", compass_style)
	compass.position = Vector2(24, 154)
	compass.custom_minimum_size = Vector2(310, 66)
	compass.size = Vector2(310, 66)
	add_child(compass)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 6)
	compass.add_child(column)
	title = Style.label("", 13)
	title.add_theme_color_override("font_color", Color("4c6146"))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint = Style.text("", 11, "6b7961")
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(title)
	column.add_child(hint)
	action = Style.flat_button("", "e7efd8", "c3d4ae")
	var action_style := Style.panel("e7efd8", 12, "c3d4ae", false)
	action_style.content_margin_left = 0
	action_style.content_margin_right = 40
	action_style.content_margin_top = 9
	action_style.content_margin_bottom = 9
	for state in ["normal", "hover", "pressed"]:
		action.add_theme_stylebox_override(state, action_style)
	action.add_theme_color_override("font_color", Color("405d42"))
	action.add_theme_color_override("font_hover_color", Color("405d42"))
	action.add_theme_color_override("font_pressed_color", Color("405d42"))
	action.custom_minimum_size = Vector2(230, 44)
	var action_key := PanelContainer.new()
	action_key.mouse_filter = MOUSE_FILTER_IGNORE
	action_key.position = Vector2(146, 12)
	action_key.custom_minimum_size = Vector2(20, 20)
	action_key.size = Vector2(20, 20)
	var key_style := Style.panel("fffaf0", 5, "cbdbb7", false)
	key_style.set_content_margin_all(0)
	action_key.add_theme_stylebox_override("panel", key_style)
	var key_label := Style.label("F", 10)
	key_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	key_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	action_key.add_child(key_label)
	action.add_child(action_key)
	action.set_anchors_and_offsets_preset(PRESET_CENTER_BOTTOM)
	action.offset_left = -115
	action.offset_right = 115
	action.offset_top = -191
	action.offset_bottom = -147
	action.pressed.connect(func() -> void: action_requested.emit("ocean-interact"))
	add_child(action)
	dive = Style.flat_button("Hold to dive", "d7f0ef", "c4dedc")
	dive.custom_minimum_size = Vector2(136, 44)
	dive.set_anchors_and_offsets_preset(PRESET_BOTTOM_RIGHT)
	dive.offset_left = -158
	dive.offset_right = -22
	dive.offset_top = -174
	dive.offset_bottom = -130
	dive.button_down.connect(func() -> void: Input.action_press("dive"))
	dive.button_up.connect(func() -> void: Input.action_release("dive"))
	add_child(dive)
	helm = GridContainer.new()
	helm.columns = 2
	helm.custom_minimum_size = Vector2(180, 92)
	helm.size = Vector2(180, 92)
	add_child(helm)
	for entry in [["Forward", "move_forward"], ["Back", "move_back"], ["Left", "move_left"], ["Right", "move_right"]]:
		var button := Style.flat_button(entry[0], "d7f0ef", "c4dedc")
		button.custom_minimum_size = Vector2(88, 44)
		button.button_down.connect(func() -> void: helm_requested.emit(entry[1], true))
		button.button_up.connect(func() -> void: helm_requested.emit(entry[1], false))
		helm.add_child(button)
	resized.connect(_layout_touch_controls)
	get_viewport().size_changed.connect(_layout_touch_controls)
	_layout_touch_controls()
	set_data({}, "", false)

func _layout_touch_controls() -> void:
	var touch := DisplayServer.is_touchscreen_available() or "--touch" in OS.get_cmdline_user_args()
	var helm_requested := touch and is_piloting and not captured and size.x >= 180.0 and size.y >= 420.0
	var dive_requested := touch and is_swimming and not is_piloting and not captured and size.x >= 136.0 and size.y >= 420.0
	var result: Vector2i = layout_helper.layout(self, compass, action, dive, helm, helm_requested, dive_requested)
	heading_layout_available = result.x == 1
	action_layout_available = result.y == 1
	refresh_visibility()

func set_data(heading: Dictionary, interaction: String, piloting: bool, swimming: bool = false) -> void:
	heading_available = not heading.is_empty()
	title.text = str(heading.get("title", ""))
	var heading_hint := str(heading.get("hint", "")).replace("WASD to steer", "Arrow keys to steer")
	if heading_hint.begins_with("F to board or take the helm"):
		if interaction == "Take helm":
			heading_hint = "F to take helm · Arrow keys to steer"
		elif piloting and interaction == "Leave helm":
			heading_hint = "Arrow keys to steer · F to leave helm"
	hint.text = heading_hint
	action.text = interaction
	action.tooltip_text = interaction + " (F)" if not interaction.is_empty() else ""
	action_available = not interaction.is_empty()
	is_piloting = piloting
	is_swimming = swimming
	refresh_visibility()
	_layout_touch_controls()

func _process(_delta: float) -> void:
	refresh_visibility()
	if layout_helper.changed(self, dive, helm): _layout_touch_controls()

func refresh_visibility() -> void:
	var focused := get_viewport().gui_get_focus_owner()
	var keyboard_capture := focused is TextEdit or focused is LineEdit
	if keyboard_capture and not captured: release_controls()
	captured = keyboard_capture
	compass.visible = heading_available and heading_layout_available and not captured
	action.visible = action_available and action_layout_available and not captured
	var touch := DisplayServer.is_touchscreen_available() or "--touch" in OS.get_cmdline_user_args()
	var old_dive_visible := dive.visible
	var old_helm_visible := helm.visible
	dive.visible = touch and is_swimming and not is_piloting and not captured and size.x >= 136.0 and size.y >= 420.0 and layout_helper.dive_layout_available
	helm.visible = touch and is_piloting and not captured and size.x >= 180.0 and size.y >= 420.0 and layout_helper.helm_layout_available
	if (old_dive_visible and not dive.visible) or (old_helm_visible and not helm.visible):
		release_controls()

func release_controls() -> void:
	if InputMap.has_action("dive"): Input.action_release("dive")
	for action_name in ["move_forward", "move_back", "move_left", "move_right"]: helm_requested.emit(action_name, false)
