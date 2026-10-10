extends RefCounted
# Detail pane (selected design, model stage, placement controls) for the
# Asset Library workbench. It builds presentation only: preview rendering
# stays in library_preview.gd and placement state stays in asset_library.gd.

const Style = preload("res://ui/hud_style.gd")
const Look = preload("res://ui/library_style.gd")
const Preview = preload("res://ui/library_preview.gd")

static func build(host) -> void:
	host.detail_margin = MarginContainer.new()
	host.detail_margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.detail_margin.size_flags_vertical = Control.SIZE_EXPAND_FILL
	Look.edges(host.detail_margin, 20, 24, 20, 24)
	host.detail_scroll.add_child(host.detail_margin)
	var detail := VBoxContainer.new()
	detail.add_theme_constant_override("separation", 18)
	host.detail_margin.add_child(detail)
	var heading := VBoxContainer.new()
	heading.add_theme_constant_override("separation", 6)
	detail.add_child(heading)
	host.name_label = Look.title_label("Choose an asset", 23)
	host.name_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	host.name_label.custom_minimum_size.y = 28
	host.name_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	heading.add_child(host.name_label)
	host.note = Look.note("")
	heading.add_child(host.note)
	host.detail_layout = GridContainer.new()
	host.detail_layout.add_theme_constant_override("h_separation", 22)
	host.detail_layout.add_theme_constant_override("v_separation", 22)
	host.detail_layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.detail_layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	detail.add_child(host.detail_layout)
	build_stage(host)
	build_controls(host)

static func build_stage(host) -> void:
	var stage := VBoxContainer.new()
	stage.add_theme_constant_override("separation", 0)
	stage.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.detail_layout.add_child(stage)
	host.stage_shell = PanelContainer.new()
	host.stage_shell.add_theme_stylebox_override("panel", Look.preview_box())
	host.stage_shell.custom_minimum_size.y = 260
	host.stage_shell.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	stage.add_child(host.stage_shell)
	var fit := AspectRatioContainer.new()
	fit.ratio = 2.0
	fit.alignment_horizontal = AspectRatioContainer.ALIGNMENT_CENTER
	fit.alignment_vertical = AspectRatioContainer.ALIGNMENT_CENTER
	fit.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	fit.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.stage_shell.add_child(fit)
	host.preview = Preview.new()
	host.preview.corner_radius = 0.0
	host.preview.fit_to_stage = true
	host.preview.custom_minimum_size = Vector2(160, 80)
	host.preview.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.preview.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.preview.clip_contents = true
	fit.add_child(host.preview)
	stage.add_child(Look.spacer(12))
	var turn_row := HBoxContainer.new()
	turn_row.add_theme_constant_override("separation", 12)
	stage.add_child(turn_row)
	host.turn = Style.button("Turn 90°")
	host.turn.custom_minimum_size.y = 44
	host.turn.accessibility_name = "Turn selected asset 90 degrees"
	host.turn.pressed.connect(host._turn_asset)
	Look.style_action(host.turn)
	turn_row.add_child(host.turn)
	host.angle_label = Style.text("0°", 12, Look.QUIET)
	host.angle_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	turn_row.add_child(host.angle_label)

static func build_controls(host) -> void:
	var controls := VBoxContainer.new()
	controls.add_theme_constant_override("separation", 0)
	host.detail_layout.add_child(controls)
	host.controls = controls
	controls.add_child(Look.heading("Distance ahead"))
	controls.add_child(Look.spacer(12))
	var distance_row := HBoxContainer.new()
	distance_row.add_theme_constant_override("separation", 12)
	controls.add_child(distance_row)
	host.distance_slider = HSlider.new()
	Style.slider(host.distance_slider)
	host.distance_slider.min_value = 5
	host.distance_slider.max_value = 24
	host.distance_slider.value = host.distance
	host.distance_slider.custom_minimum_size.y = 44
	host.distance_slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.distance_slider.focus_mode = Control.FOCUS_ALL
	host.distance_slider.accessibility_name = "Placement distance"
	host.distance_slider.accessibility_description = "Choose 5 to 24 metres ahead."
	host.distance_slider.value_changed.connect(host._distance_changed)
	distance_row.add_child(host.distance_slider)
	host.distance_amount = Look.metric("12 m")
	host.distance_amount.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	distance_row.add_child(host.distance_amount)
	controls.add_child(Look.spacer(8))
	controls.add_child(Look.hint("Walk to a new spot before opening the library."))
	controls.add_child(Look.spacer(20))
	host.targets = preload("res://ui/asset_targets.gd").new()
	host.targets.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.targets.replace_requested.connect(func(target: String) -> void: host.replace_requested.emit(host.selected_id, target, host.angle))
	host.targets.restore_requested.connect(func(target: String) -> void: host.restore_requested.emit(target))
	host.targets.target_changed.connect(host._target_changed)
	controls.add_child(host.targets)
	controls.add_child(Look.spacer(20))
	host.result_box = PanelContainer.new()
	host.result_box.add_theme_stylebox_override("panel", Look.validation_box(false))
	host.result_box.visible = false
	host.result = Look.validation_label("")
	host.result_box.add_child(host.result)
	controls.add_child(host.result_box)

static func apply_layout(host, compact: bool) -> void:
	Look.edges(host.detail_margin, 16 if compact else 20, 20 if compact else 24, 16 if compact else 20, 20 if compact else 24)
	host.detail_layout.columns = 1 if compact else 2
	host.stage_shell.custom_minimum_size.y = 220 if compact else 260
	host.controls.custom_minimum_size.x = 0 if compact else 260
