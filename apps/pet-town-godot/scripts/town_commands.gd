extends "res://scripts/town_mode.gd"

var command_hint: Label
var command_panel: PanelContainer
var command_input: LineEdit
var command_feedback: Label

func _build_commands() -> void:
	command_hint = Label.new()
	command_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	command_hint.add_theme_font_size_override("font_size", 13)
	command_hint.add_theme_color_override("font_color", Color("f4e7c4"))
	command_hint.add_theme_stylebox_override("normal", _style(Color("13221ddb"), 9, Color("d6aa6170"), 1))
	ui_root.add_child(command_hint)
	command_panel = PanelContainer.new()
	command_panel.visible = false
	command_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	command_panel.add_theme_stylebox_override("panel", _style(Color("13211cf5"), 15, Color("e4c57a"), 2))
	ui_root.add_child(command_panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	command_panel.add_child(column)
	var title := Label.new()
	title.text = "TOWN COMMANDS"
	title.add_theme_font_size_override("font_size", 13)
	title.add_theme_color_override("font_color", Color("d6aa61"))
	column.add_child(title)
	command_input = LineEdit.new()
	command_input.placeholder_text = "Type /chill, /build, /objects, /settings…"
	command_input.clear_button_enabled = true
	command_input.add_theme_font_size_override("font_size", 19)
	command_input.text_submitted.connect(_run_town_command)
	column.add_child(command_input)
	var examples := Label.new()
	examples.text = "/chill   /build   /objects   /settings   /help"
	examples.add_theme_font_size_override("font_size", 13)
	examples.add_theme_color_override("font_color", Color("b8c8ba"))
	column.add_child(examples)
	command_feedback = Label.new()
	command_feedback.add_theme_font_size_override("font_size", 12)
	command_feedback.add_theme_color_override("font_color", Color("ffd18c"))
	column.add_child(command_feedback)
	get_viewport().size_changed.connect(_layout_commands)
	_layout_commands()
	_refresh_command_hint()

func _layout_commands() -> void:
	var viewport := get_viewport().get_visible_rect().size
	command_hint.position = Vector2(maxf(12.0, viewport.x - 258.0), 16.0)
	command_hint.size = Vector2(244.0, 35.0)
	command_panel.position = Vector2((viewport.x - minf(480.0, viewport.x - 24.0)) * 0.5, 24.0)
	command_panel.size = Vector2(minf(480.0, viewport.x - 24.0), 145.0)

func _refresh_command_hint() -> void:
	if is_instance_valid(command_hint):
		command_hint.text = "  %s ISLAND   ·   / commands  " % town_mode.to_upper()
		command_hint.visible = not command_panel.visible and not call("_details_are_open") and not call("_help_is_open") and not call("_settings_are_open")

func _open_command_palette() -> void:
	command_panel.visible = true
	command_input.text = "/"
	command_input.caret_column = 1
	command_feedback.text = ""
	command_input.grab_focus()
	_refresh_command_hint()

func _close_command_palette() -> void:
	command_panel.visible = false
	command_input.release_focus()
	_refresh_command_hint()

func _run_town_command(raw: String) -> void:
	var command := raw.strip_edges().trim_prefix("/").to_lower()
	match command:
		"chill", "build":
			if call("_settings_are_open"):
				(get("settings_window") as Control).call("close_settings")
			_set_town_mode(command)
			_close_command_palette()
		"objects":
			_close_command_palette()
			call("_open_settings_section", 3)
		"settings":
			_close_command_palette()
			call("_open_settings_section", 0)
		"help":
			_close_command_palette()
			call("_toggle_help", true)
		_:
			command_feedback.text = "Unknown command. Try /chill, /build, /objects, or /settings."
