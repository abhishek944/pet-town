extends "res://scripts/main_agents.gd"

func _build_ui() -> void:
	ui_root = Control.new()
	ui_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	town_ui.add_child(ui_root)
	notice = Label.new()
	notice.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	notice.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	notice.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	notice.add_theme_font_size_override("font_size", 16)
	notice.add_theme_color_override("font_color", Color("f8f5ed"))
	notice.add_theme_stylebox_override("normal", _style(Color("18201bdf"), 12, Color("ffffff2b")))
	notice.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui_root.add_child(notice)
	_build_details_panel()
	_build_speaking_wave()
	call("_build_help_board")

func _build_speaking_wave() -> void:
	speaking_wave = Panel.new()
	speaking_wave.add_theme_stylebox_override("panel", _style(Color("18201be6"), 18, Color("ffffff33"), 1))
	speaking_wave.mouse_filter = Control.MOUSE_FILTER_IGNORE
	speaking_wave.visible = false
	ui_root.add_child(speaking_wave)
	for index in 9:
		var bar := ColorRect.new()
		bar.color = Color("a8f4d2")
		bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
		bar.size = Vector2(5.0, 10.0)
		bar.position = Vector2(21.0 + index * 10.0, 23.0)
		speaking_wave.add_child(bar)
		speaking_bars.append(bar)

func _update_speaking_wave() -> void:
	if not is_instance_valid(speaking_wave):
		return
	speaking_wave.visible = mayor_listening
	if not mayor_listening:
		return
	var phase := float(Time.get_ticks_msec()) * 0.014
	for index in speaking_bars.size():
		var bar := speaking_bars[index]
		var height := 7.0 + 22.0 * absf(sin(phase + float(index) * 0.74))
		bar.size.y = height
		bar.position.y = (54.0 - height) * 0.5

func _build_details_panel() -> void:
	details_panel = Panel.new()
	details_panel.add_theme_stylebox_override("panel", _style(Color("14231ff8"), 16, Color("d6aa6166"), 1))
	details_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	details_panel.visible = false
	ui_root.add_child(details_panel)
	_setup_avatar_viewer()
	var eyebrow := Label.new()
	eyebrow.text = "PET TOWN  /  COMPANION"
	eyebrow.position = Vector2(20.0, 19.0)
	eyebrow.size = Vector2(180.0, 28.0)
	eyebrow.add_theme_font_size_override("font_size", 12)
	eyebrow.add_theme_color_override("font_color", Color("d5a75d"))
	details_panel.add_child(eyebrow)
	details_close = Button.new()
	details_close.text = "×"
	details_close.tooltip_text = "Close agent details"
	details_close.add_theme_font_size_override("font_size", 24)
	details_close.add_theme_stylebox_override("normal", _style(Color("315947"), 10, Color("d6aa6166"), 1))
	details_close.pressed.connect(_close_details)
	details_panel.add_child(details_close)
	avatar_reset = Button.new()
	avatar_reset.text = "Reset view"
	avatar_reset.tooltip_text = "Reset the live 3D avatar view"
	avatar_reset.add_theme_font_size_override("font_size", 13)
	avatar_reset.add_theme_stylebox_override("normal", _style(Color("315947"), 10, Color("d6aa6166"), 1))
	avatar_reset.pressed.connect(Callable(self, "_reset_avatar_view"))
	details_panel.add_child(avatar_reset)
	var content := VBoxContainer.new()
	content.add_theme_constant_override("separation", 7)
	details_panel.add_child(content)
	details_name = Label.new()
	details_name.add_theme_font_size_override("font_size", 28)
	details_name.add_theme_color_override("font_color", Color("f8f5ed"))
	details_name.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(details_name)
	details_subtitle = Label.new()
	details_subtitle.add_theme_font_size_override("font_size", 14)
	details_subtitle.add_theme_color_override("font_color", Color("b9c1b8"))
	content.add_child(details_subtitle)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	content.add_child(grid)
	details_status = _detail_card(grid, "Status")
	details_source = _detail_card(grid, "Source")
	details_camera = _detail_card(grid, "Camera")
	details_appearance = _detail_card(grid, "Appearance")
	details_action = Button.new()
	details_action.text = "Open in Herdr"
	details_action.tooltip_text = "Open the current live agent in Herdr"
	details_action.add_theme_font_size_override("font_size", 16)
	details_action.add_theme_stylebox_override("normal", _style(Color("bd842e"), 12, Color("ffe1a5"), 1))
	details_action.add_theme_stylebox_override("disabled", _style(Color("30342f"), 12, Color("ffffff24"), 1))
	details_action.pressed.connect(_open_in_herdr)
	details_panel.add_child(details_action)

func _detail_card(grid: GridContainer, title: String) -> Label:
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(0, 64)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.add_theme_stylebox_override("panel", _style(Color("26392f"), 10, Color("94ae9266"), 1))
	grid.add_child(card)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 4)
	box.add_theme_constant_override("margin_left", 12)
	card.add_child(box)
	var label := Label.new()
	label.text = title
	label.add_theme_font_size_override("font_size", 11)
	label.add_theme_color_override("font_color", Color("aeb7ad"))
	box.add_child(label)
	var value := Label.new()
	value.add_theme_font_size_override("font_size", 15)
	value.add_theme_color_override("font_color", Color("f8f5ed"))
	value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(value)
	return value

func _setup_avatar_viewer() -> void:
	avatar_frame = Panel.new()
	avatar_frame.clip_contents = true
	avatar_frame.add_theme_stylebox_override("panel", _style(Color("26392f"), 14, Color("94ae9266"), 1))
	details_panel.add_child(avatar_frame)
	avatar_container = SubViewportContainer.new()
	avatar_container.stretch = true
	avatar_container.focus_mode = Control.FOCUS_ALL
	avatar_container.tooltip_text = "Live 3D avatar viewer. Drag to rotate. Arrow keys rotate. Press R to reset."
	avatar_container.gui_input.connect(Callable(self, "_on_avatar_gui_input"))
	avatar_frame.add_child(avatar_container)
	avatar_viewport = SubViewport.new()
	avatar_viewport.transparent_bg = false
	avatar_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	avatar_viewport.world_3d = World3D.new()
	avatar_container.add_child(avatar_viewport)
	avatar_root = Node3D.new()
	avatar_viewport.add_child(avatar_root)
	var camera_3d := Camera3D.new()
	camera_3d.current = true
	camera_3d.position = Vector3(0.0, 0.8, 6.2)
	camera_3d.fov = 35.0
	avatar_viewport.add_child(camera_3d)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-42.0, -35.0, 0.0)
	light.light_color = Color("ffd8a3")
	light.light_energy = 1.4
	avatar_viewport.add_child(light)
	var fill := OmniLight3D.new()
	fill.position = Vector3(-2.0, 1.2, 2.0)
	fill.light_color = Color("8fa682")
	fill.light_energy = 1.2
	avatar_viewport.add_child(fill)
	var environment := WorldEnvironment.new()
	var environment_resource := Environment.new()
	environment_resource.background_mode = Environment.BG_COLOR
	environment_resource.background_color = Color("1d281f")
	environment_resource.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment_resource.ambient_light_color = Color("a5b595")
	environment_resource.ambient_light_energy = 0.7
	environment.environment = environment_resource
	avatar_viewport.add_child(environment)
