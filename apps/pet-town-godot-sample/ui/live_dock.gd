extends PanelContainer

signal action_requested(id: String, action: String, payload: Dictionary)
signal width_changed(width: float)
const Style = preload("res://ui/hud_style.gd")
var selected_id := ""
var record: Dictionary = {}
var terminal: Dictionary = {}
var heading: Label
var status: Label
var task: Label
var body: VBoxContainer
var output: TextEdit
var feedback: Label
var terminal_visible := false
var original_grid := false
var portrait: TextureRect
var terminal_size := Vector2i.ZERO
var grid := preload("res://ui/terminal_grid.gd").new()
var input_events := preload("res://ui/terminal_input.gd").new()

func _ready() -> void:
	input_events.host = self
	get_window().focus_exited.connect(input_events.cancel)
	visibility_changed.connect(func() -> void:
		if not visible: input_events.cancel())
	var box := Style.panel("dae0bce8", 0, "fff6deed", false)
	box.set_content_margin_all(16)
	add_theme_stylebox_override("panel", box)
	var column := VBoxContainer.new()
	add_child(column)
	var header := HBoxContainer.new()
	column.add_child(header)
	portrait = Style.portrait({})
	header.add_child(portrait)
	heading = Style.title("Companion", 23)
	heading.size_flags_horizontal = SIZE_EXPAND_FILL
	header.add_child(heading)
	for entry in [["↗", "focus"], ["×", "leave"]]:
		var button := Style.flat_button(entry[0], "eef5da88", "ffffff99")
		button.pressed.connect(func() -> void: emit_action(entry[1]))
		header.add_child(button)
	status = Style.text("", 11, "3d6748")
	column.add_child(status)
	task = Style.text("", 13, "343b28")
	task.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(task)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	column.add_child(scroll)
	body = VBoxContainer.new()
	body.size_flags_horizontal = SIZE_EXPAND_FILL
	scroll.add_child(body)
	feedback = Style.text("", 11, "883e2d")
	feedback.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(feedback)
	get_viewport().size_changed.connect(layout)
	layout()
	hide()

func layout() -> void:
	var window_size := get_viewport_rect().size
	var width := minf(560, window_size.x * (0.6 if window_size.x < 900 else 0.5))
	position = Vector2(window_size.x - width, 0)
	size = Vector2(width, window_size.y)
	width_changed.emit(width if visible else 0.0)

func set_record(entry: Dictionary) -> void:
	var changed := selected_id != str(entry.get("id", ""))
	var changed_actions: bool = record.get("controlled", false) != entry.get("controlled", false) or record.get("firstPerson", false) != entry.get("firstPerson", false)
	record = entry
	selected_id = str(entry.get("id", ""))
	heading.text = str(entry.get("label", "Companion"))
	var picture := Style.portrait(entry)
	portrait.texture = picture.texture
	picture.free()
	status.text = "%s · %s" % [str(entry.get("source", "Agent")).capitalize(), str(entry.get("status", "Unknown")).capitalize()]
	task.text = str(entry.get("task", entry.get("activity", "")))
	task.visible = not task.text.is_empty()
	visible = not entry.is_empty() and entry.get("source", "") != "mayor"
	if changed:
		terminal_visible = false
		terminal = {}
		grid = preload("res://ui/terminal_grid.gd").new()
	if changed or (changed_actions and not terminal_visible): rebuild()
	layout()

func rebuild() -> void:
	input_events.cancel()
	Style.clear(body)
	output = null
	if not terminal_visible:
		body.add_child(Style.title("Your companion", 20))
		body.add_child(Style.text("You’re in control of this companion." if record.get("controlled", false) else "Following · roaming freely", 13))
		add_actions([["Open in Herdr ↗" if record.get("source", "") == "herdr" else "Open agent ↗", "focus"]])
		if record.get("source", "") == "herdr": add_actions([["Observe", "observe"], ["Interact", "interact"]])
		body.add_child(Style.text("Observe the terminal, or choose Interact to type into it." if record.get("source", "") == "herdr" else "Open the agent in its coding tool.", 12))
		body.add_child(Style.title("In the town", 20))
		add_actions([["Release control" if record.get("controlled", false) else "Control companion", "control"]])
		add_actions([["Third person" if record.get("firstPerson", false) else "First person", "camera"], ["Leave companion", "leave"]])
		return
	add_actions([["← Back to companion", "terminal_release"], ["Original grid", "grid"]])
	output = preload("res://ui/terminal_surface.gd").new()
	output.editable = false
	output.context_menu_enabled = false
	output.wrap_mode = TextEdit.LINE_WRAPPING_NONE
	output.custom_minimum_size = Vector2(0, maxf(150, size.y - 330))
	var monospace := SystemFont.new()
	monospace.font_names = PackedStringArray(["Menlo", "Monaco", "monospace"])
	output.add_theme_font_override("font", monospace)
	output.add_theme_font_size_override("font_size", 12)
	output.add_theme_color_override("font_color", Color("edf5d9"))
	var plane := Style.panel("1e271bcf", 12, "ffffff32", false)
	output.add_theme_stylebox_override("normal", plane)
	output.add_theme_stylebox_override("read_only", plane)

	output.resized.connect(input_events.resize)
	output.focus_exited.connect(input_events.cancel)
	output.gui_input.connect(input_events.handle)
	body.add_child(output)
	var state: String = str(terminal.get("state", "connecting"))
	var control: bool = terminal.get("control", false)
	body.add_child(Style.text("Terminal input is on" if control else "Another window controls input" if state == "conflict" else "Watching the terminal", 12))
	add_actions([["Back to watching", "terminal_watch"]] if control else [["Take over input", "terminal_takeover"]] if state == "conflict" else [["Interact", "interact"]] if state == "ready" else [["Reconnect", "observe"]])
	add_actions([["Return to live output", "terminal_live"], ["Open in Herdr ↗", "focus"]])
	update_output()

func add_actions(entries: Array) -> void:
	var row := HFlowContainer.new()
	body.add_child(row)
	for entry in entries:
		var button := Style.flat_button(entry[0], "eef5da88", "ffffff99")
		button.custom_minimum_size.y = 36
		button.pressed.connect(func() -> void: emit_action(entry[1]))
		row.add_child(button)

func emit_action(action: String) -> void:
	if action == "grid":
		input_events.cancel()
		original_grid = not original_grid
		update_output()
		return
	if action == "terminal_release":
		terminal_visible = false
		rebuild()
	action_requested.emit(selected_id, action, {})

func set_terminal(state: Dictionary) -> void:
	var rebuild_needed: bool = not terminal_visible or terminal.get("state") != state.get("state") or terminal.get("control") != state.get("control")
	if not state.get("control", false) or state.get("state", "") != "ready": input_events.cancel()
	if state.has("viewGeneration") and state.get("viewGeneration") != terminal.get("viewGeneration"): grid = preload("res://ui/terminal_grid.gd").new()
	terminal = state
	if state.get("state", "closed") == "closed": grid = preload("res://ui/terminal_grid.gd").new()
	if state.has("rawFrame"): grid.feed(state.rawFrame)
	terminal_visible = state.get("state", "closed") != "closed"
	if rebuild_needed: rebuild()
	update_output()
	feedback.text = grid.error if not grid.error.is_empty() else str(state.get("error", state.get("message", "")))

func update_output() -> void:
	if not is_instance_valid(output): return
	output.custom_minimum_size.y = maxf(150, size.y - 330)
	output.capture_grid = original_grid and terminal.get("control", false) and terminal.get("state", "") == "ready"
	if grid.sequence >= 0:
		output.set_grid(grid, original_grid)
		return
	output.set_plain(str(terminal.get("text", "")), terminal.get("colors", {}))
