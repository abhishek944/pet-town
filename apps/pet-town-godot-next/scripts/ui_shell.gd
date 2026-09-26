extends "res://scripts/ui_inspector.gd"

var status_panel: PanelContainer

func _build() -> void:
	set_anchors_preset(Control.PRESET_TOP_LEFT)
	size = get_viewport_rect().size
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	inspector = PanelContainer.new()
	inspector.set_anchors_preset(Control.PRESET_TOP_LEFT)
	inspector.mouse_filter = Control.MOUSE_FILTER_STOP
	inspector.add_theme_stylebox_override("panel", _style(Color("14231ef5"), 16, Color("f8d47c99")))
	add_child(inspector)
	var actions := VBoxContainer.new()
	actions.add_theme_constant_override("separation", 8)
	inspector.add_child(actions)
	inspector_name = _label("Town customization", 23, CREAM)
	inspector_name.autowrap_mode = TextServer.AUTOWRAP_OFF
	actions.add_child(inspector_name)
	var browse := _button("Browse objects", true)
	browse.pressed.connect(func() -> void: open_settings(3))
	actions.add_child(browse)
	inspector_kind = _label("", 14, GOLD)
	inspector_kind.autowrap_mode = TextServer.AUTOWRAP_OFF
	actions.add_child(inspector_kind)
	inspector_preview = PREVIEW_SCRIPT.new() as WorkshopModelPreview
	inspector_preview.custom_minimum_size = Vector2(280, 142)
	actions.add_child(inspector_preview)
	var action_row := HBoxContainer.new()
	action_row.add_theme_constant_override("separation", 6)
	actions.add_child(action_row)
	var move := _button("Move")
	move.pressed.connect(func() -> void: move_requested.emit())
	action_row.add_child(move)
	for amount in [-15.0, 15.0]:
		var turn := _button("Left 15°" if amount < 0 else "Right 15°")
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
	inspector_size_slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	inspector_size_slider.value_changed.connect(_set_inspector_size)
	size_row.add_child(inspector_size_slider)
	inspector_size_label = _label("100%", 13, CREAM)
	inspector_size_label.custom_minimum_size.x = 48
	size_row.add_child(inspector_size_label)
	var finish := HBoxContainer.new()
	finish.add_theme_constant_override("separation", 6)
	actions.add_child(finish)
	var remove := _button("Delete")
	remove.pressed.connect(func() -> void: delete_requested.emit())
	finish.add_child(remove)
	var close := _button("Close")
	close.pressed.connect(_close_inspector)
	finish.add_child(close)
	for button in finish.get_children():
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var note := _label("Move: click a new spot · Right-click cancels · ⌘Z undoes", 12, MUTED)
	note.autowrap_mode = TextServer.AUTOWRAP_OFF
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
	agent_content = VBoxContainer.new()
	agent_content.add_theme_constant_override("separation", 8)
	agent_panel.add_child(agent_content)
	agent_panel.visible = false
	_build_settings()
