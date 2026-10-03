extends RefCounted
## The server receives cell coordinates only while Original grid owns input.
var host: Control
var gesture := ""
var gesture_id := ""
var last_cell := Vector2i.ZERO
var last_modifiers := 0

func enabled() -> bool:
	return host.grid.error.is_empty() and host.terminal.get("control", false) and host.terminal.get("state", "") == "ready"

func handle(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN] and not event.shift_pressed and not enabled():
		host.feedback.text = "Interact to scroll Herdr history. Watching shows the current server view."
		host.output.accept_event()
		return
	if not enabled():
		cancel()
		return
	if event is InputEventMouseButton:
		if event.button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN] and event.pressed and not event.shift_pressed:
			var payload := {"direction": "up" if event.button_index == MOUSE_BUTTON_WHEEL_UP else "down", "lines": 3, "modifiers": modifiers(event)}
			if host.original_grid:
				var point := cell(event.position)
				payload.merge({"column": point.x, "row": point.y})
			emit("terminal_scroll", payload)
			host.output.accept_event()
			return
		if not host.original_grid: return
		var button: String = {MOUSE_BUTTON_LEFT:"left", MOUSE_BUTTON_MIDDLE:"middle", MOUSE_BUTTON_RIGHT:"right"}.get(event.button_index, "")
		if button.is_empty(): return
		if event.pressed:
			if event.shift_pressed or not gesture.is_empty(): return
			gesture = button
			gesture_id = host.selected_id
			host.output.grab_focus()
			mouse("down", event)
		elif gesture == button:
			mouse("up", event)
			gesture = ""
		else: return
		host.output.accept_event()
	elif event is InputEventMouseMotion and not gesture.is_empty():
		if event.shift_pressed: return
		if event.button_mask == 0:
			cancel()
			return
		mouse("drag", event)
		host.output.accept_event()
	elif event is InputEventKey and event.pressed:
		if event.shift_pressed and event.unicode == 0: return
		if (event.ctrl_pressed or event.meta_pressed) and event.keycode == KEY_C and host.output.has_selection(): return
		if (event.ctrl_pressed or event.meta_pressed) and event.keycode == KEY_V:
			emit("terminal_input", {"text": DisplayServer.clipboard_get(), "paste": true})
		else:
			emit("terminal_input", {"keycode": event.keycode, "unicode": event.unicode, "ctrl": event.ctrl_pressed, "alt": event.alt_pressed})
		host.output.accept_event()

func modifiers(event: InputEventWithModifiers) -> int:
	return (1 if event.shift_pressed else 0) | (2 if event.ctrl_pressed else 0) | (4 if event.alt_pressed else 0)

func cell(position: Vector2) -> Vector2i:
	if host.output.has_method("cell_at_point") and is_instance_valid(host.output.grid): return host.output.cell_at_point(position)
	var font: Font = host.output.get_theme_font("font")
	var font_size: int = host.output.get_theme_font_size("font_size")
	var width := maxf(1, font.get_string_size("M", HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x)
	var height := maxf(1, font.get_height(font_size) + host.output.get_theme_constant("line_spacing"))
	var panel: StyleBox = host.output.get_theme_stylebox("normal")
	var origin := Vector2(panel.get_content_margin(SIDE_LEFT), panel.get_content_margin(SIDE_TOP))
	var local := position - origin
	return Vector2i(clampi(int(floor(local.x / width)) + int(host.output.get_h_scroll() / width), 0, int(host.terminal.get("width", 80)) - 1), clampi(int(floor(local.y / height)) + int(host.output.get_v_scroll()), 0, int(host.terminal.get("height", 24)) - 1))

func mouse(action: String, event: InputEventMouse) -> void:
	last_cell = cell(event.position)
	last_modifiers = modifiers(event)
	host.action_requested.emit(gesture_id, "terminal_mouse", {"action": action, "button": gesture, "column": last_cell.x, "row": last_cell.y, "modifiers": last_modifiers})

func cancel() -> void:
	if gesture.is_empty(): return
	if enabled(): host.action_requested.emit(gesture_id, "terminal_mouse", {"action":"up", "button":gesture, "column":last_cell.x, "row":last_cell.y, "modifiers":last_modifiers})
	gesture = ""
	gesture_id = ""

func emit(action: String, payload: Dictionary) -> void:
	host.action_requested.emit(host.selected_id, action, payload)

func resize() -> void:
	if not is_instance_valid(host.output) or host.terminal.get("state", "") != "ready": return
	var font: Font = host.output.get_theme_font("font")
	var width := maxf(1, font.get_string_size("M", HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x)
	var dimensions: Vector2i = host.output.dimensions() if host.output.has_method("dimensions") else Vector2i(maxi(2, int((host.output.size.x - 16) / width)), maxi(1, host.output.get_visible_line_count()))
	if dimensions == host.terminal_size: return
	host.terminal_size = dimensions
	emit("terminal_resize", {"cols": dimensions.x, "rows": dimensions.y})
