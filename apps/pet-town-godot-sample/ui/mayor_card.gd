extends PanelContainer

signal action_requested(id: String, action: String, payload: Dictionary)
const Style = preload("res://ui/hud_style.gd")
var state: Dictionary = {}
var heading: Button
var phase: Label
var body: VBoxContainer
var status: Label
var speech: TextEdit
var error: Label
var talk: Button
var mode: OptionButton
var retry: Button
var hint: Label
var collapsed := false

func _ready() -> void:
	add_theme_stylebox_override("panel", Style.panel("fff8e9f7", 18, "e9d7b5"))
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)
	var column := VBoxContainer.new()
	column.size_flags_horizontal = SIZE_EXPAND_FILL
	column.add_theme_constant_override("separation", 8)
	scroll.add_child(column)
	var row := HBoxContainer.new()
	column.add_child(row)
	row.add_child(Style.portrait({"isMayor": true}))
	heading = Style.flat_button("Mayor", "fff8e900", "fff8e900")
	heading.add_theme_font_override("font", Style.TITLE)
	heading.add_theme_font_size_override("font_size", 21)
	heading.size_flags_horizontal = SIZE_EXPAND_FILL
	heading.pressed.connect(func() -> void: action_requested.emit("pet-town-mayor", "follow", {}))
	row.add_child(heading)
	var collapse := Style.flat_button("≋", "fff8e900", "fff8e900")
	collapse.pressed.connect(func() -> void:
		collapsed = not collapsed
		body.visible = not collapsed
		layout())
	row.add_child(collapse)
	phase = Style.text("Stopped", 12)
	column.add_child(phase)
	body = VBoxContainer.new()
	body.add_theme_constant_override("separation", 8)
	column.add_child(body)
	status = Style.text("", 12, "5f6348")
	status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(status)
	error = Style.text("", 12, "883e2d")
	error.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(error)
	speech = TextEdit.new()
	speech.editable = false
	speech.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	speech.custom_minimum_size.y = 120
	speech.add_theme_color_override("font_color", Color("5f6348"))
	speech.add_theme_stylebox_override("normal", Style.panel("fff8e900", 0, "fff8e900", false))
	body.add_child(speech)
	var actions := HFlowContainer.new()
	body.add_child(actions)
	talk = Style.flat_button("Start talking", "745231", "745231")
	talk.add_theme_color_override("font_color", Color("fff7e4"))
	talk.pressed.connect(talk_action)
	actions.add_child(talk)
	mode = OptionButton.new()
	mode.add_item("Standard mode")
	mode.add_item("Live mode")
	mode.item_selected.connect(func(index: int) -> void: action_requested.emit("pet-town-mayor", "mayor_mode", {"mode": "firstmate" if index == 0 else "live"}))
	actions.add_child(mode)
	var settings := Style.flat_button("⚙")
	settings.tooltip_text = "Mayor settings"
	settings.pressed.connect(func() -> void: action_requested.emit("pet-town-mayor", "mayor_settings", {}))
	actions.add_child(settings)
	retry = Style.flat_button("Retry voice", "fff8e900", "fff8e900")
	retry.pressed.connect(func() -> void: action_requested.emit("pet-town-mayor", "mayor_retry", {}))
	body.add_child(retry)
	hint = Style.text("⌥ M · Call Mayor · Hold Ctrl+Option to talk", 11)
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(hint)
	get_viewport().size_changed.connect(layout)
	layout()
	hide()

func layout() -> void:
	var window_size := get_viewport_rect().size
	size = Vector2(minf(302, window_size.x - 28), minf(390 if not collapsed else 85, maxf(90, window_size.y - 220)))
	position = Vector2(window_size.x - size.x - 24, window_size.y - size.y - 118)

func set_state(data: Dictionary) -> void:
	state = data
	var rendered := preload("res://ui/mayor_status.gd").render(data)
	var standard: bool = rendered.standard
	var listening: bool = rendered.listening
	heading.text = rendered.name
	phase.text = rendered.phase
	status.text = rendered.status
	status.visible = rendered.status_visible
	speech.text = rendered.speech
	speech.visible = not speech.text.is_empty()
	error.text = rendered.error
	error.visible = not error.text.is_empty()
	mode.select(0 if standard else 1)
	mode.disabled = bool(data.get("pending", false))
	talk.text = rendered.talk
	talk.disabled = not data.get("active", false) or data.get("pending", false) or (standard and not listening and (data.get("working", false) or data.get("speaking", false)))
	retry.visible = standard
	retry.disabled = not data.get("active", false) or listening or data.get("speaking", false)
	hint.text = "⌥ M · Call Mayor" + (" · Hold Ctrl+Option to talk" if standard else "")
	layout()

func talk_action() -> void:
	var standard: bool = state.get("mode", "firstmate") != "live"
	var action := "mayor_stop_talking" if state.get("listening", false) else "mayor_start_talking"
	if not standard: action = "mayor_live_stop" if state.get("liveConnected", false) or state.get("connecting", false) or state.get("wakeActivated", false) else "mayor_live_start"
	action_requested.emit("pet-town-mayor", action, {})
