extends PanelContainer

signal action_requested(id: String, action: String, payload: Dictionary)

const Style = preload("res://ui/hud_style.gd")
const MAYOR_ID := "pet-town-mayor"
const TOOLBAR_WIDTH := 640.0
const TOOLBAR_HEIGHT := 96.0

var state: Dictionary = {}
var latest_reply := ""
var heading: Button
var phase: Label
var status: Label
var talk: Button
var mode: OptionButton
var retry: Button
var settings: Button
var controls: HFlowContainer
var content: VBoxContainer

func _ready() -> void:
	var frame := Style.panel("fff8e9f7", 18, "e9d7b5")
	frame.corner_radius_top_left = 0
	frame.corner_radius_top_right = 0
	frame.content_margin_left = 18
	frame.content_margin_right = 18
	frame.content_margin_top = 14
	frame.content_margin_bottom = 14
	frame.shadow_color = Color("263f3228")
	frame.shadow_size = 7
	frame.shadow_offset = Vector2(0, 3)
	add_theme_stylebox_override("panel", frame)
	mouse_filter = Control.MOUSE_FILTER_PASS

	content = VBoxContainer.new()
	content.add_theme_constant_override("separation", 4)
	add_child(content)
	controls = HFlowContainer.new()
	controls.add_theme_constant_override("h_separation", 8)
	controls.add_theme_constant_override("v_separation", 6)
	controls.alignment = FlowContainer.ALIGNMENT_CENTER
	content.add_child(controls)

	var identity := HBoxContainer.new()
	identity.add_theme_constant_override("separation", 6)
	identity.custom_minimum_size = Vector2(120, 44)
	controls.add_child(identity)
	identity.add_child(Style.portrait({"id": MAYOR_ID, "isMayor": true}, Vector2(38, 42)))
	var name_and_phase := VBoxContainer.new()
	name_and_phase.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	name_and_phase.add_theme_constant_override("separation", 0)
	identity.add_child(name_and_phase)
	heading = Style.flat_button("Mayor", "fff8e900", "fff8e900")
	heading.add_theme_font_override("font", Style.TITLE)
	heading.add_theme_font_size_override("font_size", 20)
	heading.alignment = HORIZONTAL_ALIGNMENT_LEFT
	heading.custom_minimum_size = Vector2(52, 24)
	heading.clip_text = true
	heading.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	for state_name in ["normal", "hover", "pressed", "disabled"]:
		var title_style := heading.get_theme_stylebox(state_name).duplicate() as StyleBoxFlat
		title_style.content_margin_left = 2
		title_style.content_margin_right = 2
		title_style.content_margin_top = 0
		title_style.content_margin_bottom = 0
		heading.add_theme_stylebox_override(state_name, title_style)
	heading.accessibility_name = "Mayor"
	heading.accessibility_description = "Follow Mayor"
	heading.pressed.connect(func() -> void: action_requested.emit(MAYOR_ID, "follow", {}))
	name_and_phase.add_child(heading)
	phase = Style.text("Standard mode", 10, "54703d")
	phase.clip_text = true
	phase.tooltip_text = "Standard mode"
	phase.accessibility_name = "Mayor voice phase"
	name_and_phase.add_child(phase)

	talk = _action_button("Start talking", Vector2(106, 44), "745231", "745231")
	talk.add_theme_color_override("font_color", Color("fff7e4"))
	talk.add_theme_color_override("font_hover_color", Color("fff7e4"))
	talk.add_theme_color_override("font_pressed_color", Color("fff7e4"))
	talk.accessibility_name = "Start talking"
	talk.pressed.connect(talk_action)
	controls.add_child(talk)

	mode = OptionButton.new()
	mode.add_item("Standard mode")
	mode.add_item("Live mode")
	mode.custom_minimum_size = Vector2(118, 44)
	mode.fit_to_longest_item = false; mode.clip_text = true
	mode.add_theme_font_size_override("font_size", 11)
	for state_name in ["normal", "hover", "pressed", "disabled"]:
		var mode_style := Style.panel("fff9e9", 9, "d7c09a", false)
		mode_style.content_margin_left = 5
		mode_style.content_margin_right = 15
		mode_style.content_margin_top = 0
		mode_style.content_margin_bottom = 0
		mode.add_theme_stylebox_override(state_name, mode_style)
	mode.accessibility_name = "Mayor voice mode"
	mode.tooltip_text = "Choose Standard or Live voice mode. Starting Live voice is a separate action."
	mode.item_selected.connect(func(index: int) -> void:
		action_requested.emit(MAYOR_ID, "mayor_mode", {"mode": "firstmate" if index == 0 else "live"}))
	controls.add_child(mode)

	settings = _action_button("Voice settings", Vector2(104, 44), "fff9e9", "d7c09a")
	settings.accessibility_name = "Mayor voice settings"
	settings.tooltip_text = "Open native Mayor voice settings"
	settings.pressed.connect(func() -> void: action_requested.emit(MAYOR_ID, "mayor_settings", {}))
	controls.add_child(settings)

	retry = _action_button("Retry voice", Vector2(100, 44), "fff9e9", "d7c09a")
	retry.accessibility_name = "Retry Mayor voice"
	retry.pressed.connect(func() -> void: action_requested.emit(MAYOR_ID, "mayor_retry", {}))
	controls.add_child(retry)

	status = Style.text("", 11, "716449")
	status.clip_text = true
	status.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	status.custom_minimum_size.y = 16
	status.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	status.accessibility_name = "Mayor voice status"
	content.add_child(status)

	get_viewport().size_changed.connect(layout)
	layout()
	hide()

func _action_button(label: String, minimum: Vector2, background: String, border: String) -> Button:
	var button := Style.flat_button(label, background, border)
	button.custom_minimum_size = minimum
	for state_name in ["normal", "hover", "pressed", "disabled"]:
		var style := button.get_theme_stylebox(state_name).duplicate() as StyleBoxFlat
		style.content_margin_left = 6
		style.content_margin_right = 6
		style.content_margin_top = 0
		style.content_margin_bottom = 0
		button.add_theme_stylebox_override(state_name, style)
	return button

func layout() -> void:
	if not is_instance_valid(content): return
	var viewport := get_viewport_rect().size
	var width := minf(TOOLBAR_WIDTH, maxf(1, viewport.x - 16))
	var horizontal_margin := minf(18, maxf(2, (width - 120) * 0.5))
	var frame := get_theme_stylebox("panel") as StyleBoxFlat
	frame.content_margin_left = horizontal_margin
	frame.content_margin_right = horizontal_margin
	custom_minimum_size.x = 0
	size.x = width
	var needed_height := content.get_combined_minimum_size().y + frame.content_margin_top + frame.content_margin_bottom
	size.y = maxf(TOOLBAR_HEIGHT, needed_height)
	position = Vector2((viewport.x - width) * 0.5, 0)
	call_deferred("_fit_compact_controls", width)

func _fit_compact_controls(width: float) -> void:
	if not is_instance_valid(controls): return
	for button in [talk, mode, settings, retry]:
		button.add_theme_font_size_override("font_size", 11 if width >= 500 else 10)
	controls.queue_sort()
	call_deferred("_fit_toolbar_height")

func _fit_toolbar_height() -> void:
	if not is_instance_valid(content): return
	var frame := get_theme_stylebox("panel") as StyleBoxFlat
	var needed_height := content.get_combined_minimum_size().y + frame.content_margin_top + frame.content_margin_bottom
	size.y = maxf(TOOLBAR_HEIGHT, needed_height)

func set_state(data: Dictionary) -> void:
	state = data
	var rendered := preload("res://ui/mayor_status.gd").render(data)
	latest_reply = rendered.speech
	heading.text = rendered.name
	heading.tooltip_text = rendered.name
	phase.text = rendered.phase
	phase.tooltip_text = rendered.phase
	phase.accessibility_description = rendered.phase
	status.text = rendered.error if not rendered.error.is_empty() else rendered.status
	status.visible = rendered.status_visible
	status.tooltip_text = status.text
	status.accessibility_description = status.text
	status.add_theme_color_override("font_color", Color("883e2d") if not rendered.error.is_empty() else Color("716449"))
	mode.select(0 if rendered.standard else 1)
	mode.disabled = bool(data.get("pending", false))
	talk.text = rendered.talk
	talk.accessibility_name = rendered.talk
	talk.accessibility_description = "Standard mode records only after you choose Start talking. Live mode starts only after you choose Start Live voice." if rendered.standard else rendered.status
	talk.disabled = rendered.talk_disabled
	retry.visible = rendered.retry_visible
	retry.disabled = rendered.retry_disabled
	retry.tooltip_text = "Retry the latest Mayor voice reply"
	settings.accessibility_description = "Open the native Mayor voice setup and trust settings."
	layout()

func talk_action() -> void:
	var standard: bool = state.get("mode", "firstmate") != "live"
	var action := "mayor_stop_talking" if state.get("listening", false) else "mayor_start_talking"
	if not standard:
		action = "mayor_live_stop" if state.get("liveConnected", false) or state.get("connecting", false) or state.get("wakeActivated", false) else "mayor_live_start"
	action_requested.emit(MAYOR_ID, action, {})
