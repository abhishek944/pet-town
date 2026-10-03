extends Control

signal action_requested(id: String)
signal helm_requested(action: String, held: bool)
const Style = preload("res://ui/hud_style.gd")
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

func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	compass = PanelContainer.new()
	compass.add_theme_stylebox_override("panel", Style.panel("fffdf0ee", 14, "c4dedc", false))
	compass.position = Vector2(18, 145)
	compass.size = Vector2(310, 66)
	add_child(compass)
	var column := VBoxContainer.new()
	compass.add_child(column)
	title = Style.label("", 13)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint = Style.text("", 11, "537b78")
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(title)
	column.add_child(hint)
	action = Style.flat_button("Board boat  F", "d7f0ef", "c4dedc")
	action.set_anchors_and_offsets_preset(PRESET_CENTER_BOTTOM)
	action.offset_left = -115
	action.offset_right = 115
	action.offset_top = -185
	action.offset_bottom = -147
	action.pressed.connect(func() -> void: action_requested.emit("ocean-interact"))
	add_child(action)
	dive = Style.flat_button("Hold to dive", "d7f0ef", "c4dedc")
	dive.set_anchors_and_offsets_preset(PRESET_BOTTOM_RIGHT)
	dive.offset_left = -158
	dive.offset_right = -22
	dive.offset_top = -167
	dive.offset_bottom = -130
	dive.button_down.connect(func() -> void: Input.action_press("dive"))
	dive.button_up.connect(func() -> void: Input.action_release("dive"))
	add_child(dive)
	helm = GridContainer.new()
	helm.columns = 2
	helm.position = Vector2(22, 160)
	add_child(helm)
	for entry in [["Forward", "move_forward"], ["Back", "move_back"], ["Left", "move_left"], ["Right", "move_right"]]:
		var button := Style.flat_button(entry[0], "d7f0ef", "c4dedc")
		button.button_down.connect(func() -> void: helm_requested.emit(entry[1], true))
		button.button_up.connect(func() -> void: helm_requested.emit(entry[1], false))
		helm.add_child(button)
	set_data({}, "", false)

func set_data(heading: Dictionary, interaction: String, piloting: bool, swimming: bool = false) -> void:
	heading_available = not heading.is_empty()
	title.text = str(heading.get("title", ""))
	hint.text = str(heading.get("hint", ""))
	action.text = interaction + "  F"
	action_available = not interaction.is_empty()
	is_piloting = piloting
	is_swimming = swimming
	refresh_visibility()

func _process(_delta: float) -> void:
	refresh_visibility()

func refresh_visibility() -> void:
	var focused := get_viewport().gui_get_focus_owner()
	var keyboard_capture := focused is TextEdit or focused is LineEdit
	if keyboard_capture and not captured: release_controls()
	captured = keyboard_capture
	compass.visible = heading_available and not captured
	action.visible = action_available and not captured
	var touch := DisplayServer.is_touchscreen_available() or "--touch" in OS.get_cmdline_user_args()
	dive.visible = touch and is_swimming and not is_piloting and not captured
	helm.visible = touch and is_piloting and not captured

func release_controls() -> void:
	if InputMap.has_action("dive"): Input.action_release("dive")
	for action_name in ["move_forward", "move_back", "move_left", "move_right"]: helm_requested.emit(action_name, false)
