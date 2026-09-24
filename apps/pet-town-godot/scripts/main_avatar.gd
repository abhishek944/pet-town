extends "res://scripts/main_ui.gd"

func _load_avatar(model_index: int) -> void:
	if is_instance_valid(avatar_model):
		avatar_model.queue_free()
	avatar_model = MODEL_SCENES[model_index].instantiate() as Node3D
	avatar_root.add_child(avatar_model)
	avatar_root.scale = Vector3(1.12, 1.12, 1.12)
	avatar_root.position = Vector3(0.0, -0.62, 0.0)
	_reset_avatar_view()

func _reset_avatar_view() -> void:
	avatar_yaw = deg_to_rad(-18.0)
	avatar_pitch = deg_to_rad(-8.0)
	if is_instance_valid(avatar_root):
		avatar_root.rotation = Vector3(avatar_pitch, avatar_yaw, 0.0)

func _on_avatar_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		avatar_dragging = event.pressed
		avatar_drag_position = event.position
		avatar_container.grab_focus()
		avatar_container.accept_event()
	elif event is InputEventMouseMotion and avatar_dragging:
		var motion := event as InputEventMouseMotion
		var delta := motion.position - avatar_drag_position
		avatar_drag_position = motion.position
		avatar_yaw += delta.x * 0.012
		avatar_pitch = clampf(avatar_pitch + delta.y * 0.008, deg_to_rad(-30.0), deg_to_rad(20.0))
		avatar_root.rotation = Vector3(avatar_pitch, avatar_yaw, 0.0)
		avatar_container.accept_event()
	elif event is InputEventKey and event.pressed:
		if event.keycode == KEY_LEFT:
			avatar_yaw -= 0.14
		elif event.keycode == KEY_RIGHT:
			avatar_yaw += 0.14
		elif event.keycode == KEY_UP:
			avatar_pitch = clampf(avatar_pitch - 0.1, deg_to_rad(-30.0), deg_to_rad(20.0))
		elif event.keycode == KEY_DOWN:
			avatar_pitch = clampf(avatar_pitch + 0.1, deg_to_rad(-30.0), deg_to_rad(20.0))
		elif event.keycode == KEY_R:
			_reset_avatar_view()
		else:
			return
		avatar_root.rotation = Vector3(avatar_pitch, avatar_yaw, 0.0)
		avatar_container.accept_event()

func _build_help_board() -> void:
	help_scrim = ColorRect.new()
	help_scrim.color = Color("0508069a")
	help_scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	help_scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	help_scrim.visible = false
	ui_root.add_child(help_scrim)
	help_board = Panel.new()
	help_board.add_theme_stylebox_override("panel", _style(Color("0b0f0de8"), 22, Color("ffffff38"), 1))
	help_board.mouse_filter = Control.MOUSE_FILTER_STOP
	help_board.visible = false
	ui_root.add_child(help_board)
	help_close = Button.new()
	help_close.text = "×"
	help_close.tooltip_text = "Close town controls"
	help_close.add_theme_font_size_override("font_size", 24)
	help_close.add_theme_stylebox_override("normal", _style(Color("ffffff12"), 10))
	help_close.pressed.connect(func() -> void: _toggle_help(false))
	help_board.add_child(help_close)
	var header := VBoxContainer.new()
	help_board.add_child(header)
	var eyebrow := Label.new()
	eyebrow.text = "GRAND MOONHAVEN"
	eyebrow.add_theme_font_size_override("font_size", 12)
	eyebrow.add_theme_color_override("font_color", Color("d6aa61"))
	header.add_child(eyebrow)
	var title := Label.new()
	title.text = "Town controls"
	title.add_theme_font_size_override("font_size", 34)
	title.add_theme_color_override("font_color", Color("f8f5ed"))
	header.add_child(title)
	var subtitle := Label.new()
	subtitle.text = "Everything you need, only when you ask for it."
	subtitle.add_theme_font_size_override("font_size", 16)
	subtitle.add_theme_color_override("font_color", Color("b8c0b7"))
	header.add_child(subtitle)
	var groups := HBoxContainer.new()
	groups.add_theme_constant_override("separation", 14)
	help_board.add_child(groups)
	var explore_controls := [
		["Drag", "Move across town"], ["Option + Drag", "Orbit camera"],
		["Pinch", "Zoom"], ["/objects", "Browse and place objects"],
		["Double-click an object", "Open object editing"], ["R", "Town overview"],
	]
	_help_group(groups, "EXPLORE THE TOWN", explore_controls)
	_help_group(groups, "LIVE AGENTS", [["Click", "Follow pet"], ["Right-click", "Open details"], ["Option + A", "Next agent"], ["C, then WASD / arrows", "Drive the selected pet"], ["Esc", "Close or release"]])
	_help_group(groups, "TOWN COMMANDS", [["/chill", "Explore the complete island"], ["/build", "Build on open land"], ["/settings", "Open town studio"], ["F", "Fullscreen"]])
	var footer := Label.new()
	footer.text = "Press Option+H or Escape to close"
	footer.add_theme_font_size_override("font_size", 13)
	footer.add_theme_color_override("font_color", Color("9ca59b"))
	help_board.add_child(footer)

func _help_group(parent: HBoxContainer, title: String, rows: Array) -> void:
	var panel := PanelContainer.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.add_theme_stylebox_override("panel", _style(Color("ffffff07"), 12, Color("ffffff2b"), 1))
	parent.add_child(panel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	panel.add_child(box)
	var heading := Label.new()
	heading.text = title
	heading.add_theme_font_size_override("font_size", 13)
	heading.add_theme_color_override("font_color", Color("d6aa61"))
	box.add_child(heading)
	for row in rows:
		var key := Label.new()
		key.text = row[0]
		key.add_theme_font_size_override("font_size", 13)
		key.add_theme_color_override("font_color", Color("f8f5ed"))
		key.add_theme_stylebox_override("normal", _style(Color("ffffff12"), 6, Color("ffffff44"), 1))
		box.add_child(key)
		var description := Label.new()
		description.text = row[1]
		description.add_theme_font_size_override("font_size", 15)
		description.add_theme_color_override("font_color", Color("dce1da"))
		box.add_child(description)

func _toggle_help(show: bool) -> void:
	help_scrim.visible = show
	help_board.visible = show
	if show:
		help_close.grab_focus()

func _layout_ui() -> void:
	if not is_instance_valid(ui_root):
		return
	var size := get_viewport().get_visible_rect().size
	notice.position = Vector2(16.0, size.y - 88.0)
	notice.size = Vector2(290.0, 72.0)
	speaking_wave.position = Vector2((size.x - 122.0) * 0.5, size.y - 82.0)
	speaking_wave.size = Vector2(122.0, 54.0)
	var panel_width := minf(DETAILS_WIDTH, size.x * 0.9)
	details_panel.position = Vector2(size.x - panel_width - 1.0, -1.0)
	details_panel.size = Vector2(panel_width + 2.0, size.y + 2.0)
	details_close.position = Vector2(panel_width - 58.0, 10.0)
	details_close.size = Vector2(44.0, 44.0)
	var viewer_height := minf(338.0, size.y * 0.43)
	avatar_frame.position = Vector2(16.0, 64.0)
	avatar_frame.size = Vector2(panel_width - 32.0, viewer_height)
	avatar_container.position = Vector2(1.0, 1.0)
	avatar_container.size = avatar_frame.size - Vector2(2.0, 2.0)
	avatar_reset.position = Vector2(panel_width - 132.0, 78.0)
	avatar_reset.size = Vector2(104.0, 40.0)
	var content := details_name.get_parent() as VBoxContainer
	content.position = Vector2(20.0, avatar_frame.position.y + viewer_height + 14.0)
	content.size = Vector2(panel_width - 40.0, maxf(180.0, size.y - content.position.y - 94.0))
	details_action.position = Vector2(20.0, size.y - 72.0)
	details_action.size = Vector2(panel_width - 40.0, 54.0)
	var board_margin := clampf(size.x * 0.03, 22.0, 42.0)
	help_board.position = Vector2(board_margin, board_margin)
	help_board.size = Vector2(size.x - board_margin * 2.0, size.y - board_margin * 2.0)
	help_close.position = Vector2(help_board.size.x - 68.0, 15.0)
	help_close.size = Vector2(44.0, 44.0)
	var header := help_board.get_child(1) as VBoxContainer
	header.position = Vector2(42.0, 38.0)
	header.size = Vector2(help_board.size.x - 120.0, 90.0)
	var groups := help_board.get_child(2) as HBoxContainer
	groups.position = Vector2(42.0, 172.0)
	groups.size = Vector2(help_board.size.x - 84.0, minf(400.0, help_board.size.y - 260.0))
	var footer := help_board.get_child(3) as Label
	footer.position = Vector2(42.0, help_board.size.y - 50.0)
	footer.size = Vector2(360.0, 26.0)
