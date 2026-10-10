extends Control
## Contextual edge controls; material selection remains owned by the existing hotbar.
const Style = preload("res://ui/hud_style.gd")
const Layout = preload("res://ui/ocean_controls_layout.gd")
var host: CanvasLayer
var actor: RigidBody3D
var controlled := false
var left: HBoxContainer
var build: Button
var dive: Button
var rise: Button
var dive_key: Label
var rise_key: Label
var swimming := false
var held: Dictionary = {}
var source := "keyboard"
var layout_helper := Layout.new()

func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	left = HBoxContainer.new()
	left.add_theme_constant_override("separation", 8)
	add_child(left)
	dive = make_hold("↓ Dive", "dive")
	rise = make_hold("↑ Rise", "jump")
	dive_key = add_key(dive)
	rise_key = add_key(rise)
	build = Style.flat_button("Build ▾", "fff7e8", "dec49a")
	build.custom_minimum_size = Vector2(80, 44)
	build.accessibility_name = "Build materials"
	build.pressed.connect(func() -> void:
		if host and swimming: host.hotbar.toggle_palette())
	add_child(build)
	get_window().focus_exited.connect(release_controls)
	visibility_changed.connect(func() -> void:
		if not is_visible_in_tree(): release_controls())
	if DisplayServer.is_touchscreen_available() or "--touch" in OS.get_cmdline_user_args(): source = "touch"
	update_hints()

func make_hold(text: String, action: String) -> Button:
	var button := Style.flat_button(text, "fff7e8", "dec49a")
	button.custom_minimum_size.y = 44
	button.focus_mode = FOCUS_NONE # Gameplay A/Space must never activate a focused Dive.
	button.button_down.connect(func() -> void:
		if available():
			held[action] = true
			Input.action_press(action))
	button.button_up.connect(func() -> void: release_action(action))
	left.add_child(button)
	return button

func add_key(button: Button) -> Label:
	var label := Style.label("", 11)
	label.mouse_filter = MOUSE_FILTER_IGNORE
	label.add_theme_stylebox_override("normal", Style.panel("fffdf7", 5, "c4b69a", false))
	label.set_anchors_and_offsets_preset(PRESET_CENTER_RIGHT)
	button.add_child(label)
	return label

func update_hints() -> void:
	dive_key.text = "X" if source in ["keyboard", "controller"] else ""
	rise_key.text = "Space" if source == "keyboard" else "A" if source == "controller" else ""
	for pair in [[dive, dive_key], [rise, rise_key]]:
		var button: Button = pair[0]
		var key: Label = pair[1]
		key.visible = not key.text.is_empty()
		var width := Style.BODY.get_string_size(key.text, HORIZONTAL_ALIGNMENT_LEFT, -1, 11).x + 14 if key.visible else 0.0
		key.offset_left = -width - 10
		key.offset_right = -10
		key.offset_top = -13
		key.offset_bottom = 13
		button.custom_minimum_size.x = 66 + (width + 12 if key.visible else 0.0)
		for state in ["normal", "hover", "pressed"]:
			var box := Style.panel("fff7e8", 12, "dec49a", false)
			box.content_margin_left = 12
			box.content_margin_right = width + 20 if key.visible else 12
			button.add_theme_stylebox_override(state, box)
	dive.tooltip_text = "Hold X to dive" if source == "keyboard" else "Hold to dive"
	rise.tooltip_text = "Hold Space to rise" if source == "keyboard" else "Hold to rise"

func _input(event: InputEvent) -> void:
	var next := source
	if event is InputEventKey or (event is InputEventMouseButton and event.device != InputEvent.DEVICE_ID_EMULATION): next = "keyboard"
	elif event is InputEventJoypadButton or (event is InputEventJoypadMotion and absf(event.axis_value) > 0.3): next = "controller"
	elif event is InputEventScreenTouch: next = "touch"
	if next != source:
		source = next
		update_hints()

func available() -> bool:
	if not is_instance_valid(actor) or not actor.enabled: return false
	if not host or not swimming or not is_visible_in_tree() or not get_window().has_focus() or host.is_menu_open: return false
	var focused := get_viewport().gui_get_focus_owner()
	return not (focused is LineEdit or focused is TextEdit)

func _process(_delta: float) -> void:
	if not host: return
	var show_controls := swimming and available()
	left.visible = show_controls
	build.visible = show_controls
	if not show_controls:
		release_controls()
		return
	build.text = "Build ▴" if host.hotbar.palette_open else "Build ▾"
	build.accessibility_description = "Close materials" if host.hotbar.palette_open else "Open materials"
	layout_edges()

func set_swimming(value: bool) -> void:
	swimming = value
	if host: host.hotbar.set_swimming(value)
	if not value: release_controls()

func layout_edges() -> void:
	var owner := get_parent() as Control
	var obstacles := layout_helper._hud_obstacles(owner, false)
	left.size = left.get_combined_minimum_size()
	build.size = build.get_combined_minimum_size()
	var stacked := left.size.x + build.size.x + 36 > size.x
	var row_y := size.y - 60 - (52 if stacked else 0)
	# The edge row has priority over touch sticks and ocean prompts, which avoid it.
	var left_rect := layout_helper._first_fit(owner, left.size, [Vector2(14, row_y), Vector2(14, row_y - 52), Vector2(14, 230)], obstacles, [])
	var build_rect := layout_helper._first_fit(owner, build.size, [Vector2(size.x - build.size.x - 14, size.y - 60), Vector2(size.x - build.size.x - 14, row_y - 52), Vector2(size.x - build.size.x - 14, 230)], obstacles, [left_rect])
	left.visible = left_rect.size.x >= 44
	build.visible = build_rect.size.x >= 44
	if left.visible: left.position = left_rect.position
	else: release_controls()
	if build.visible: build.position = build_rect.position

func release_action(action: String) -> void:
	if held.get(action, false):
		Input.action_release(action)
		held.erase(action)

func release_controls() -> void:
	for action in held.keys(): release_action(action)

func set_actor(body: RigidBody3D) -> void:
	var enabled: bool = is_instance_valid(body) and body.enabled
	if body != actor or enabled != controlled:
		release_controls()
		for action in ["jump", "dive"]:
			if InputMap.has_action(action): Input.action_release(action)
	actor = body
	controlled = enabled
