extends RefCounted

const Style = preload("res://ui/hud_style.gd")

func build(host: Control, column: VBoxContainer, terminal: Dictionary, terminal_visible: bool, input_events: RefCounted, viewport_height: float, grid_error: String) -> Dictionary:
	return _terminal(host, column, terminal, input_events, viewport_height, grid_error) if terminal_visible else {}

func _terminal(host: Control, column: VBoxContainer, terminal: Dictionary, input_events: RefCounted, viewport_height: float, grid_error: String) -> Dictionary:
	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 12)
	header.custom_minimum_size.y = 44
	column.add_child(header)
	var back := _action_button(host, "Back", "terminal_release")
	back.accessibility_name = "Back to companion"
	back.accessibility_description = "Return to the followed companion without stopping it or clearing the selection."
	back.tooltip_text = back.accessibility_description
	header.add_child(back)
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	header.add_child(spacer)
	var open := _action_button(host, "Open terminal", "focus")
	open.accessibility_name = "Open terminal"
	open.accessibility_description = "Open the existing terminal in its validated native destination."
	open.tooltip_text = open.accessibility_description
	header.add_child(open)

	var frame := PanelContainer.new()
	frame.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	frame.size_flags_vertical = Control.SIZE_EXPAND_FILL
	frame.accessibility_name = "Terminal output"
	var paper := Style.panel("0b0e0b", 10, "2a332a", false)
	paper.set_content_margin_all(0)
	frame.add_theme_stylebox_override("panel", paper)
	column.add_child(frame)
	var sections := VBoxContainer.new()
	sections.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sections.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sections.add_theme_constant_override("separation", 0)
	frame.add_child(sections)

	var feedback := _feedback()
	feedback.custom_minimum_size.y = 34
	feedback.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	feedback.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	feedback.add_theme_color_override("font_color", Color("76552d"))
	var notice_style := Style.panel("f6edd9", 0, "dac8a5", false)
	notice_style.set_border_width_all(0)
	notice_style.border_width_bottom = 1
	notice_style.content_margin_left = 12
	notice_style.content_margin_right = 12
	notice_style.content_margin_top = 7
	notice_style.content_margin_bottom = 7
	notice_style.corner_radius_top_left = 9
	notice_style.corner_radius_top_right = 9
	feedback.add_theme_stylebox_override("normal", notice_style)
	sections.add_child(feedback)

	var output_inset := MarginContainer.new()
	output_inset.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	output_inset.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout_output(output_inset, 20)
	sections.add_child(output_inset)
	var output = preload("res://ui/terminal_surface.gd").new()
	output.editable = false
	output.context_menu_enabled = false
	output.clip_contents = true
	output.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	output.focus_mode = Control.FOCUS_ALL
	output.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	output.size_flags_vertical = Control.SIZE_EXPAND_FILL
	output.custom_minimum_size = Vector2(0, maxf(120, viewport_height - 280))
	output.accessibility_name = "Terminal output"
	output.accessibility_description = "Last terminal output. Select and copy text; scroll to read."
	var clear := Style.panel("0b0e0b", 0, "0b0e0b", false)
	clear.set_border_width_all(0)
	clear.set_content_margin_all(0)
	output.add_theme_stylebox_override("normal", clear)
	output.add_theme_stylebox_override("read_only", clear)
	output.resized.connect(input_events.resize)
	output.focus_exited.connect(input_events.cancel)
	output.gui_input.connect(input_events.handle)
	output_inset.add_child(output)

	var footer := _action_button(host, "Reconnect", "", true)
	footer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	footer.pressed.connect(Callable(host, "emit_terminal_footer"))
	column.add_child(footer)
	var refs := {"output": output, "feedback": feedback, "footer_button": footer, "output_inset": output_inset}
	update_terminal(terminal, grid_error, output, feedback, footer)
	return refs

func update_terminal(terminal: Dictionary, grid_error: String, output: TextEdit, feedback: Label, footer: Button) -> void:
	var state := str(terminal.get("state", "connecting"))
	var message := notice_text(terminal, grid_error)
	feedback.text = message
	feedback.visible = not message.is_empty()
	feedback.accessibility_name = "Terminal status"
	var detail := notice_detail(terminal, grid_error)
	feedback.accessibility_description = detail if not detail.is_empty() else message
	feedback.tooltip_text = detail
	output.accessibility_description = "Last terminal output. Select and copy text; scroll to read."
	var attached := state == "ready"
	footer.text = "Disconnect" if attached else "Reconnect"
	footer.disabled = state == "connecting"
	footer.accessibility_name = "Disconnect terminal viewer" if attached else "Reconnect to existing terminal"
	footer.accessibility_description = "Detach this view; the companion keeps running." if attached else "Reconnect explicitly to the existing terminal. This does not take input from another window."
	footer.tooltip_text = footer.accessibility_description

func notice_text(terminal: Dictionary, grid_error: String) -> String:
	var state := str(terminal.get("state", ""))
	if terminal.get("reconnectFailed", false): return "Reconnect failed. Last output remains available."
	if state == "connecting": return "Connecting to the existing terminal."
	if state == "conflict": return "Another window controls input. This view stays read-only."
	if not grid_error.is_empty(): return grid_error
	if state in ["error", "stale", "disconnected"]: return notice_detail(terminal, "")
	return ""

func notice_detail(terminal: Dictionary, grid_error: String) -> String:
	var details := PackedStringArray()
	for value in [grid_error, str(terminal.get("error", "")), str(terminal.get("message", ""))]:
		if not value.is_empty() and not details.has(value): details.append(value)
	return "\n".join(details)

func layout_output(output_inset: MarginContainer, inset: int) -> void:
	for side in ["left", "right", "top", "bottom"]: output_inset.add_theme_constant_override("margin_" + side, inset)

func _action_button(host: Control, label: String, action: String, primary := false) -> Button:
	var background := "426448" if primary else "fff9ec"
	var border := "426448" if primary else "c9baa0"
	var button := Style.flat_button(label, background, border)
	button.custom_minimum_size = Vector2(0 if primary else 96, 44)
	button.add_theme_font_size_override("font_size", 14)
	button.focus_mode = Control.FOCUS_ALL
	for state in ["normal", "hover", "pressed", "disabled"]:
		var stylebox := button.get_theme_stylebox(state) as StyleBoxFlat
		stylebox.set_corner_radius_all(10)
		stylebox.content_margin_left = 18
		stylebox.content_margin_right = 18
	if primary:
		for color in ["font_color", "font_hover_color", "font_pressed_color"]: button.add_theme_color_override(color, Color("fff9e9"))
		var disabled := button.get_theme_stylebox("disabled") as StyleBoxFlat
		disabled.bg_color = Color("d5cebb")
		disabled.border_color = Color("c9baa0")
		button.add_theme_color_override("font_disabled_color", Color("625b4d"))
	else:
		button.pressed.connect(Callable(host, "emit_action").bind(action))
	return button

func _feedback() -> Label:
	var value := Style.text("", 13, "76552d")
	value.focus_mode = Control.FOCUS_NONE
	value.accessibility_live = int(DisplayServer.LIVE_POLITE)
	value.accessibility_name = "Terminal status"
	value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	value.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return value
