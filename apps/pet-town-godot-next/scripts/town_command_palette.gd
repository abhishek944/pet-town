class_name TownCommandPalette
extends Control

signal command_requested(command: String)
signal mayor_talk_requested(active: bool)
signal mayor_retry_requested

var town_mode := "chill"
var first_person_view := false
var driving_companion := false
var panel: PanelContainer
var input: LineEdit
var feedback: Label
var hint: Label
var driving_status: PanelContainer
var mayor_status: Label
var mayor_talk_button: Button
var mayor_retry_available := false

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint = Label.new()
	hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint.add_theme_font_size_override("font_size", 13)
	hint.add_theme_color_override("font_color", Color("f4e7c4"))
	add_child(hint)
	driving_status = PanelContainer.new()
	driving_status.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var status_style := StyleBoxFlat.new()
	status_style.bg_color = Color("14231ed9")
	status_style.set_corner_radius_all(5)
	status_style.content_margin_left = 6
	status_style.content_margin_right = 6
	status_style.content_margin_top = 2
	status_style.content_margin_bottom = 2
	driving_status.add_theme_stylebox_override("panel", status_style)
	add_child(driving_status)
	var status_row := HBoxContainer.new()
	status_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	status_row.add_theme_constant_override("separation", 0)
	driving_status.add_child(status_row)
	for text in ["● DRIVING", " · C release"]:
		var part := Label.new()
		part.text = text
		part.mouse_filter = Control.MOUSE_FILTER_IGNORE
		part.add_theme_font_size_override("font_size", 13)
		part.add_theme_color_override("font_color", Color("edc57d") if text == "● DRIVING" else Color("f4e7c4"))
		status_row.add_child(part)
	driving_status.visible = false
	mayor_status = Label.new()
	mayor_status.mouse_filter = Control.MOUSE_FILTER_IGNORE
	mayor_status.add_theme_font_size_override("font_size", 15)
	mayor_status.add_theme_color_override("font_color", Color("f5c87d"))
	add_child(mayor_status)
	mayor_status.visible = false
	mayor_talk_button = Button.new()
	mayor_talk_button.toggle_mode = true
	mayor_talk_button.text = "Start talking"
	mayor_talk_button.toggled.connect(_on_mayor_talk_toggled)
	add_child(mayor_talk_button)
	mayor_talk_button.visible = false
	panel = PanelContainer.new()
	panel.visible = false
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	var style := StyleBoxFlat.new()
	style.bg_color = Color("13211cf5")
	style.border_color = Color("e4c57a")
	style.set_border_width_all(2)
	style.set_corner_radius_all(15)
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	panel.add_child(column)
	var title := Label.new()
	title.text = "TOWN COMMANDS"
	title.add_theme_color_override("font_color", Color("d6aa61"))
	column.add_child(title)
	input = LineEdit.new()
	input.placeholder_text = "Type /chill, /build, /objects, /settings…"
	input.clear_button_enabled = true
	input.add_theme_font_size_override("font_size", 19)
	input.text_submitted.connect(_submit)
	column.add_child(input)
	var examples := Label.new()
	examples.text = "/chill   /build   /objects   /settings   /help"
	examples.add_theme_color_override("font_color", Color("b8c8ba"))
	column.add_child(examples)
	feedback = Label.new()
	feedback.add_theme_color_override("font_color", Color("ffd18c"))
	column.add_child(feedback)
	get_viewport().size_changed.connect(_layout)
	_layout()
	set_mode(town_mode)

func set_mode(value: String) -> void:
	town_mode = value
	_refresh_hint()

func set_camera_state(first_person: bool, driving: bool) -> void:
	if first_person_view == first_person and driving_companion == driving:
		return
	first_person_view = first_person
	driving_companion = driving
	_refresh_hint()

func show_driving_status(value: bool) -> void:
	driving_status.visible = value

func show_mayor_status(active: bool, status: String, keyboard_held: bool, phase: String) -> void:
	mayor_status.visible = active and not panel.visible
	mayor_talk_button.visible = mayor_status.visible
	var message := "Ready · hold Control+Option to talk" if status in ["", "Ready · hold to talk"] else status
	mayor_retry_available = status.contains("Retry voice")
	mayor_status.text = "MAYOR  ·  %s" % message
	var busy := phase in ["working", "speaking"]
	mayor_talk_button.disabled = (busy and not mayor_retry_available) or (keyboard_held and not mayor_talk_button.button_pressed and not mayor_retry_available)
	if not mayor_talk_button.button_pressed:
		mayor_talk_button.text = "Retry voice" if mayor_retry_available else "Working…" if phase == "working" else "Speaking…" if phase == "speaking" else "Recording · release keys" if keyboard_held and phase == "listening" else "Start talking"

func reset_mayor_talk() -> void:
	mayor_talk_button.set_pressed_no_signal(false)
	mayor_talk_button.text = "Start talking"

func _on_mayor_talk_toggled(active: bool) -> void:
	if active and mayor_retry_available:
		mayor_talk_button.set_pressed_no_signal(false)
		mayor_retry_requested.emit()
		return
	mayor_talk_button.text = "Stop and send" if active else "Start talking"
	mayor_talk_requested.emit(active)

func _refresh_hint() -> void:
	if not is_instance_valid(hint):
		return
	hint.text = "  FIRST-PERSON   ·   Trackpad: look   ·   V: view   ·   C: %s%s  " % ["stop driving" if driving_companion else "drive", "   ·   Space: jump" if driving_companion else ""] if first_person_view else "  %s ISLAND   ·   / commands  " % town_mode.to_upper()

func open_palette() -> void:
	panel.visible = true
	hint.visible = false
	input.text = "/"
	input.caret_column = 1
	feedback.text = ""
	input.grab_focus()

func close_palette() -> void:
	panel.visible = false
	hint.visible = true
	input.release_focus()

func _submit(raw: String) -> void:
	var command := raw.strip_edges().trim_prefix("/").trim_prefix("/").to_lower()
	if command in ["chill", "build", "objects", "settings", "help"]:
		close_palette()
		command_requested.emit(command)
	else:
		feedback.text = "Unknown command. Try /chill, /build, /objects, /settings, or /help."

func _unhandled_input(event: InputEvent) -> void:
	if not (event is InputEventKey) or not event.pressed or event.echo:
		return
	var key := event as InputEventKey
	if key.keycode == KEY_SLASH and not panel.visible:
		open_palette()
		get_viewport().set_input_as_handled()

func _layout() -> void:
	var viewport := get_viewport().get_visible_rect().size
	hint.position = Vector2(maxf(12.0, viewport.x - 358.0), 16.0)
	hint.size = Vector2(344.0, 35.0)
	driving_status.position = Vector2(16.0, 16.0 if viewport.x >= 550.0 else 54.0)
	driving_status.size = driving_status.get_combined_minimum_size()
	mayor_status.position = Vector2(16.0, 54.0 if viewport.x >= 550.0 else 90.0)
	mayor_status.size = Vector2(maxf(0.0, viewport.x - 32.0), 48.0)
	mayor_talk_button.position = Vector2(16.0, 89.0 if viewport.x >= 550.0 else 125.0)
	mayor_talk_button.size = Vector2(190.0, 34.0)
	panel.position = Vector2((viewport.x - minf(480.0, viewport.x - 24.0)) * 0.5, 24.0)
	panel.size = Vector2(minf(480.0, viewport.x - 24.0), 145.0)
