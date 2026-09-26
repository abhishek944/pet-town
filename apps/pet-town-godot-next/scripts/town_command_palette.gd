class_name TownCommandPalette
extends Control

signal command_requested(command: String)

var town_mode := "chill"
var panel: PanelContainer
var input: LineEdit
var feedback: Label
var hint: Label

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint = Label.new()
	hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint.add_theme_font_size_override("font_size", 13)
	hint.add_theme_color_override("font_color", Color("f4e7c4"))
	add_child(hint)
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
	if is_instance_valid(hint):
		hint.text = "  %s ISLAND   ·   / commands  " % town_mode.to_upper()

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
	hint.position = Vector2(maxf(12.0, viewport.x - 258.0), 16.0)
	hint.size = Vector2(244.0, 35.0)
	panel.position = Vector2((viewport.x - minf(480.0, viewport.x - 24.0)) * 0.5, 24.0)
	panel.size = Vector2(minf(480.0, viewport.x - 24.0), 145.0)
