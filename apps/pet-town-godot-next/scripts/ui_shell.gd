extends "res://scripts/ui_inspector.gd"

var status_panel: PanelContainer

func _build() -> void:
	set_anchors_preset(Control.PRESET_TOP_LEFT)
	size = get_viewport_rect().size
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	inspector = PanelContainer.new()
	inspector.set_anchors_preset(Control.PRESET_TOP_LEFT)
	inspector.mouse_filter = Control.MOUSE_FILTER_STOP
	var editor_style := StyleBoxFlat.new()
	editor_style.bg_color = Color("142b20f8")
	editor_style.border_color = Color("edc57d")
	editor_style.border_width_left = 1
	editor_style.content_margin_left = 24
	editor_style.content_margin_right = 24
	editor_style.content_margin_top = 24
	editor_style.content_margin_bottom = 24
	inspector.add_theme_stylebox_override("panel", editor_style)
	add_child(inspector)
	var editor_scroll := ScrollContainer.new()
	editor_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	editor_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	editor_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	inspector.add_child(editor_scroll)
	var actions := VBoxContainer.new()
	actions.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	actions.add_theme_constant_override("separation", 11)
	editor_scroll.add_child(actions)
	var heading := HBoxContainer.new()
	heading.add_theme_constant_override("separation", 8)
	actions.add_child(heading)
	inspector_name = _label("OBJECT EDITOR", 13, GOLD)
	inspector_name.autowrap_mode = TextServer.AUTOWRAP_OFF
	inspector_name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	heading.add_child(inspector_name)
	var dismiss := _button("×")
	dismiss.custom_minimum_size = Vector2(36, 36)
	dismiss.flat = true
	dismiss.tooltip_text = "Close object editor"
	dismiss.pressed.connect(_close_inspector)
	heading.add_child(dismiss)
	var preview_frame := PanelContainer.new()
	var preview_normal := _style(Color("2b4a37"), 12, Color("698569"))
	var preview_focused := _style(Color("2b4a37"), 12, GOLD)
	preview_frame.add_theme_stylebox_override("panel", preview_normal)
	actions.add_child(preview_frame)
	inspector_preview = PREVIEW_SCRIPT.new() as WorkshopModelPreview
	inspector_preview.custom_minimum_size = Vector2(0, 218)
	inspector_preview.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	inspector_preview.focus_entered.connect(func() -> void: preview_frame.add_theme_stylebox_override("panel", preview_focused))
	inspector_preview.focus_exited.connect(func() -> void: preview_frame.add_theme_stylebox_override("panel", preview_normal))
	preview_frame.add_child(inspector_preview)
	inspector_kind = _label("", 25, CREAM)
	actions.add_child(inspector_kind)
	var description := _label("Shape your island, one piece at a time.", 13, MUTED)
	actions.add_child(description)
	var action_row := HBoxContainer.new()
	action_row.add_theme_constant_override("separation", 7)
	actions.add_child(action_row)
	var move := _button("Move")
	move.tooltip_text = "Move this object to another spot"
	move.pressed.connect(func() -> void: move_requested.emit())
	action_row.add_child(move)
	for amount in [-15.0, 15.0]:
		var turn := _button("↶ 15°" if amount < 0 else "15° ↷")
		turn.tooltip_text = "Rotate left 15 degrees" if amount < 0 else "Rotate right 15 degrees"
		turn.pressed.connect(func() -> void: rotate_requested.emit(amount))
		action_row.add_child(turn)
	for button in action_row.get_children():
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var size_row := HBoxContainer.new()
	size_row.add_theme_constant_override("separation", 8)
	actions.add_child(size_row)
	var size_title := _label("Size", 14, CREAM)
	size_title.custom_minimum_size.x = 36
	size_row.add_child(size_title)
	inspector_size_slider = HSlider.new()
	inspector_size_slider.min_value = 0.5
	inspector_size_slider.max_value = 2.0
	inspector_size_slider.step = 0.05
	_gold_slider_grabber(inspector_size_slider)
	inspector_size_slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	inspector_size_slider.tooltip_text = "Object size"
	inspector_size_slider.value_changed.connect(_set_inspector_size)
	size_row.add_child(inspector_size_slider)
	inspector_size_label = _label("100%", 13, CREAM)
	inspector_size_label.custom_minimum_size.x = 48
	size_row.add_child(inspector_size_label)
	var finish := HBoxContainer.new()
	finish.add_theme_constant_override("separation", 6)
	actions.add_child(finish)
	var remove := _button("Delete")
	remove.tooltip_text = "Delete selected object"
	remove.add_theme_stylebox_override("normal", _style(Color("583d35"), 9, Color("edc57d")))
	remove.pressed.connect(func() -> void: delete_requested.emit())
	finish.add_child(remove)
	var close := _button("Close")
	close.pressed.connect(_close_inspector)
	finish.add_child(close)
	for button in finish.get_children():
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 12
	actions.add_child(spacer)
	var browse := _button("Browse objects", true)
	browse.pressed.connect(func() -> void: open_settings(4))
	actions.add_child(browse)
	var note := _label("Right-click cancels a move · ⌘Z undoes", 12, MUTED)
	actions.add_child(note)
	status_panel = PanelContainer.new()
	status_panel.set_anchors_preset(Control.PRESET_TOP_LEFT)
	status_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	status_panel.add_theme_stylebox_override("panel", _style(Color("14231ef5"), 12, Color("d6aa6188")))
	add_child(status_panel)
	var status_row := HBoxContainer.new()
	status_panel.add_child(status_row)
	status_label = _label("", 14, CREAM)
	status_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	status_row.add_child(status_label)
	cancel_button = _button("Cancel")
	cancel_button.pressed.connect(func() -> void: cancel_requested.emit())
	status_row.add_child(cancel_button)
	agent_panel = PanelContainer.new()
	agent_panel.set_anchors_preset(Control.PRESET_TOP_LEFT)
	agent_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	agent_panel.add_theme_stylebox_override("panel", _style(Color("14231ef5"), 16, Color("f8d47c99")))
	add_child(agent_panel)
	var agent_scroll := ScrollContainer.new()
	agent_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	agent_panel.add_child(agent_scroll)
	agent_content = VBoxContainer.new()
	agent_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	agent_content.add_theme_constant_override("separation", 7)
	agent_scroll.add_child(agent_content)
	agent_panel.visible = false
	_build_settings()
