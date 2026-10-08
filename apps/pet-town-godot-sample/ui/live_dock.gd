extends PanelContainer

signal action_requested(id: String, action: String, payload: Dictionary)
signal width_changed(width: float)
const Style = preload("res://ui/hud_style.gd")
const DockView = preload("res://ui/terminal_dock_view.gd")
const MIN_DOCK_WIDTH := 320.0
const MAX_DOCK_WIDTH := 560.0
var selected_id := ""
var terminal: Dictionary = {}
var column: VBoxContainer
var output: TextEdit
var feedback: Label
var footer_button: Button
var output_inset: MarginContainer
var terminal_visible := false
var original_grid := true
var terminal_size := Vector2i.ZERO
var grid_generation := -1
var resize_pending := false
var dock_view := DockView.new()
var grid := preload("res://ui/terminal_grid.gd").new()
var input_events := preload("res://ui/terminal_input.gd").new()

func _ready() -> void:
	input_events.host = self
	get_window().focus_exited.connect(input_events.cancel)
	visibility_changed.connect(func() -> void:
		if not is_visible_in_tree(): input_events.cancel()
		layout.call_deferred())
	var shell := Style.panel("e9e3d3", 0, "e9e3d3", false)
	shell.set_border_width_all(0)
	shell.set_content_margin_all(20)
	add_theme_stylebox_override("panel", shell)
	column = VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(column)
	minimum_size_changed.connect(layout.call_deferred)
	get_viewport().size_changed.connect(layout)
	layout()
	hide()

func layout() -> void:
	var window_size := get_viewport_rect().size
	var width := minf(window_size.x, clampf(window_size.x * 0.5, MIN_DOCK_WIDTH, MAX_DOCK_WIDTH))
	position = Vector2(window_size.x - width, 0)
	size = Vector2(width, window_size.y)
	var compact := width <= 430
	var inset := 12 if compact else 20
	var shell := get_theme_stylebox("panel") as StyleBoxFlat
	shell.set_content_margin_all(inset)
	column.add_theme_constant_override("separation", 10 if compact else 16)
	if is_instance_valid(output_inset): dock_view.layout_output(output_inset, inset)
	width_changed.emit(width if visible else 0.0)
	if is_instance_valid(output): output.custom_minimum_size.y = maxf(120, size.y - 280)

func set_record(entry: Dictionary) -> void:
	var changed := selected_id != str(entry.get("id", ""))
	selected_id = str(entry.get("id", ""))
	if changed:
		terminal_visible = false
		terminal = {}
		reset_grid()
		terminal_size = Vector2i.ZERO
	visible = terminal_visible and not entry.is_empty() and entry.get("source", "") != "mayor"
	if changed: rebuild()
	layout()

func rebuild() -> void:
	input_events.cancel()
	Style.clear(column)
	var refs: Dictionary = dock_view.build(self, column, terminal, terminal_visible, input_events, size.y, grid.error)
	output = refs.get("output")
	feedback = refs.get("feedback")
	footer_button = refs.get("footer_button")
	output_inset = refs.get("output_inset")
	update_terminal_view()

func emit_terminal_footer() -> void:
	if terminal.get("state", "") == "ready": emit_action("terminal_disconnect")
	elif terminal.get("state", "") != "connecting": emit_action("terminal_reconnect")

func emit_action(action: String) -> void:
	if action == "terminal_release":
		terminal_visible = false
		rebuild()
		action_requested.emit(selected_id, action, {})
		return
	action_requested.emit(selected_id, action, {})

func reset_grid() -> void:
	grid = preload("res://ui/terminal_grid.gd").new()
	grid_generation = -1

func set_terminal(state: Dictionary, defer_view := false) -> void:
	var was_attached: bool = terminal.get("state", "") == "ready" and bool(terminal.get("control", false))
	var generation_changed: bool = state.has("viewGeneration") and state.get("viewGeneration") != terminal.get("viewGeneration")
	if generation_changed: terminal_size = Vector2i.ZERO
	if not state.get("control", false) or state.get("state", "") != "ready": input_events.cancel()
	if state.get("state", "closed") == "closed":
		reset_grid()
		terminal_size = Vector2i.ZERO
		resize_pending = false
	elif state.has("rawFrame"): feed_grid(state)
	terminal = state
	terminal_visible = state.get("state", "closed") != "closed"
	resize_pending = resize_pending or generation_changed or not was_attached
	if not defer_view: refresh_terminal()

func refresh_terminal() -> void:
	var rebuild_needed := terminal_visible != is_instance_valid(output)
	if rebuild_needed: rebuild()
	else: update_terminal_view()
	if terminal_visible: update_output()
	if terminal.get("state", "") == "ready" and terminal.get("control", false) and (resize_pending or rebuild_needed):
		input_events.call_deferred("resize")
	resize_pending = false

func feed_grid(state: Dictionary) -> void:
	if not state.has("viewGeneration"): return
	var generation := int(state.viewGeneration)
	var frame: Dictionary = state.rawFrame
	if frame.get("full", false):
		if generation != grid_generation:
			reset_grid()
			grid_generation = generation
	elif generation != grid_generation: return
	grid.feed(frame)

func update_terminal_view() -> void:
	if is_instance_valid(footer_button): dock_view.update_terminal(terminal, grid.error, output, feedback, footer_button)

func update_output() -> void:
	if not is_instance_valid(output): return
	output.custom_minimum_size.y = maxf(120, size.y - 280)
	output.capture_grid = original_grid and terminal.get("control", false) and terminal.get("state", "") == "ready"
	if grid.sequence >= 0:
		output.set_grid(grid, original_grid)
		return
	output.set_plain(str(terminal.get("text", "")), terminal.get("colors", {}))
