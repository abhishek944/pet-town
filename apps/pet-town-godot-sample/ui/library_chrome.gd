extends RefCounted
# Structural chrome for the approved library:B1 three-zone workbench:
# anchored header and footer around a 280px catalog, the model stage and the
# 260px placement controls, with a stacked single-body-scroll compact mode.

const Style = preload("res://ui/hud_style.gd")
const Look = preload("res://ui/library_style.gd")
const Detail = preload("res://ui/library_detail.gd")

static func build(host) -> void:
	host.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	host.color = Color("17271d33")
	Style.scrim(host, host.color, 2.0)
	host.card = PanelContainer.new()
	host.card.add_theme_stylebox_override("panel", Look.card_box())
	host.add_child(host.card)
	host.content = VBoxContainer.new()
	host.content.add_theme_constant_override("separation", 0)
	host.content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.card.add_child(host.content)
	build_header(host)
	build_body(host)
	build_footer(host)
	host.resized.connect(host.resize_card)
	host.card.minimum_size_changed.connect(func() -> void: host.call_deferred("resize_card"))
	host.resize_card()
	host.hide()

static func build_header(host) -> void:
	host.header = PanelContainer.new()
	host.header.add_theme_stylebox_override("panel", Look.box_edges(Look.header_box(), 22, 28, 15, 28))
	host.content.add_child(host.header)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 20)
	host.header.add_child(row)
	var titles := VBoxContainer.new()
	titles.add_theme_constant_override("separation", 7)
	titles.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(titles)
	host.header_title = Look.title_label("Asset library", 28)
	host.header_title.custom_minimum_size.y = 34
	host.header_title.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	titles.add_child(host.header_title)
	host.header_subtitle = Style.text("Choose a design, then a spot.", 12, Look.QUIET)
	host.header_subtitle.custom_minimum_size.y = 17
	host.header_subtitle.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	titles.add_child(host.header_subtitle)
	host.close = Style.button("×", Vector2(44, 44))
	host.close.accessibility_name = "Close Asset library"
	host.close.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	Look.style_close(host.close)
	host.close.pressed.connect(func() -> void: host.closed.emit())
	row.add_child(host.close)

static func build_body(host) -> void:
	host.body_scroll = ScrollContainer.new()
	host.body_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	host.body_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER
	host.body_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.body_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.content.add_child(host.body_scroll)
	host.grid = GridContainer.new()
	host.grid.add_theme_constant_override("h_separation", 0)
	host.grid.add_theme_constant_override("v_separation", 0)
	host.grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.body_scroll.add_child(host.grid)
	build_catalog(host)
	host.detail_scroll = ScrollContainer.new()
	host.detail_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	host.detail_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER
	host.detail_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.detail_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.grid.add_child(host.detail_scroll)
	Detail.build(host)

static func build_catalog(host) -> void:
	host.catalog_panel = PanelContainer.new()
	host.catalog_panel.add_theme_stylebox_override("panel", Look.box_edges(Look.catalog_box(false), 18, 12, 18, 12))
	host.catalog_panel.custom_minimum_size = Vector2(280, 0)
	host.catalog_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.grid.add_child(host.catalog_panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 0)
	host.catalog_panel.add_child(column)
	var title_margin := MarginContainer.new()
	Look.edges(title_margin, 4, 8, 6, 8)
	column.add_child(title_margin)
	host.catalog_note = Style.text("Loading available assets…", 12, Look.QUIET)
	host.catalog_note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	host.catalog_note.custom_minimum_size.y = 14
	host.catalog_note.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	title_margin.add_child(host.catalog_note)
	host.catalog_scroll = ScrollContainer.new()
	host.catalog_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	host.catalog_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER
	host.catalog_scroll.follow_focus = true
	host.catalog_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.catalog_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(host.catalog_scroll)
	host.cards = GridContainer.new()
	host.cards.add_theme_constant_override("h_separation", 8)
	host.cards.add_theme_constant_override("v_separation", 8)
	host.cards.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.cards.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.catalog_scroll.add_child(host.cards)

static func build_footer(host) -> void:
	host.footer = PanelContainer.new()
	host.footer.add_theme_stylebox_override("panel", Look.box_edges(Look.footer_box(), 14, 24, 14, 24))
	host.footer.custom_minimum_size.y = 72
	host.content.add_child(host.footer)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	host.footer.add_child(row)
	host.footer_hint = Style.text("K / Esc · Back to town", 11, Look.QUIET)
	host.footer_hint.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	host.footer_hint.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(host.footer_hint)
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 10)
	actions.size_flags_horizontal = Control.SIZE_SHRINK_END
	row.add_child(actions)
	host.undo = Style.button("Undo latest asset change")
	host.undo.custom_minimum_size.y = 44
	host.undo.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	Look.style_action(host.undo)
	host.undo.pressed.connect(func() -> void: host.undo_requested.emit())
	actions.add_child(host.undo)
	host.add = Style.button("Add to this spot")
	host.add.custom_minimum_size.y = 44
	host.add.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	Look.style_action(host.add, true)
	host.add.pressed.connect(func() -> void: host.place_requested.emit(host.selected_id, host.angle, host.distance))
	actions.add_child(host.add)
	for field in [host.turn, host.distance_slider, host.add, host.undo, host.targets.picker, host.targets.replace, host.targets.restore]:
		wire_scroll(host, field)

static func wire_scroll(host, field: Control) -> void:
	field.focus_entered.connect(func() -> void:
		if host.body_scroll.is_ancestor_of(field):
			host.body_scroll.ensure_control_visible(field)
		if host.detail_scroll.is_ancestor_of(field):
			host.detail_scroll.ensure_control_visible(field))

static func apply_layout(host, compact: bool) -> void:
	if host.layout_ready and host.layout_compact == compact:
		return
	host.layout_ready = true
	host.layout_compact = compact
	Detail.apply_layout(host, compact)
	host.grid.columns = 1 if compact else 2
	host.header.add_theme_stylebox_override("panel", Look.box_edges(Look.header_box(), 16 if compact else 22, 20 if compact else 28, 13 if compact else 15, 20 if compact else 28))
	host.header_title.add_theme_font_size_override("font_size", 24 if compact else 28)
	host.header_title.custom_minimum_size.y = 29 if compact else 34
	host.catalog_panel.add_theme_stylebox_override("panel", Look.box_edges(Look.catalog_box(compact), 12 if compact else 18, 12, 12 if compact else 18, 12))
	host.catalog_panel.custom_minimum_size = Vector2(0, 156) if compact else Vector2(280, 0)
	host.catalog_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED if compact else ScrollContainer.SCROLL_MODE_SHOW_NEVER
	host.catalog_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER if compact else ScrollContainer.SCROLL_MODE_DISABLED
	host.detail_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED if compact else ScrollContainer.SCROLL_MODE_SHOW_NEVER
	host.cards.columns = 64 if compact else 1
	for asset_id in host.asset_buttons:
		var button: Button = host.asset_buttons[asset_id]
		button.custom_minimum_size.x = 244 if compact else 0
	host.footer.add_theme_stylebox_override("panel", Look.box_edges(Look.footer_box(), 10 if compact else 14, 16 if compact else 24, 10 if compact else 14, 16 if compact else 24))
	host.footer_hint.add_theme_font_size_override("font_size", 10 if compact else 11)
	Look.style_action(host.undo, false, 11 if compact else 12, 10 if compact else 12, 10)
	Look.style_action(host.add, true, 11 if compact else 12, 10 if compact else 12, 10)
	host.targets.apply_layout(compact)
