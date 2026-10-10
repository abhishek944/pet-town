extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const Look = preload("res://ui/journal_style.gd")

static func header(host) -> Control:
	var head := PanelContainer.new()
	host.header_style = Look.pad(Look.box(Look.PAPER, 0, Look.HAIRLINE, Vector4i(0, 0, 0, 1)), 30, 26, 30, 26)
	host.header_style.corner_radius_top_left = 15
	host.header_style.corner_radius_top_right = 15
	head.add_theme_stylebox_override("panel", host.header_style)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 18)
	head.add_child(row)
	var copy := VBoxContainer.new()
	copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	copy.add_theme_constant_override("separation", 0)
	var title := Style.title("Your island journal", 28, Look.INK)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	host.title_label = title
	copy.add_child(title)
	copy.add_child(Look.spacer(7))
	var subtitle := Look.lines(Style.text("Small adventures, lasting memories.", 12, Look.QUIET), 6)
	subtitle.custom_minimum_size.y = 20
	subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	copy.add_child(subtitle)
	row.add_child(copy)
	var close := Look.close_button()
	close.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	close.pressed.connect(func() -> void: host.closed.emit())
	row.add_child(close)
	return head

static func sidebar(host) -> Control:
	var panel := PanelContainer.new()
	host.nav_style = Look.pad(Look.box(Look.NAV, 0, Look.HAIRLINE, Vector4i(0, 0, 1, 0)), 16, 22, 16, 22)
	panel.add_theme_stylebox_override("panel", host.nav_style)
	panel.custom_minimum_size.x = 200
	host.nav_buttons = BoxContainer.new()
	host.nav_buttons.vertical = true
	host.nav_buttons.add_theme_constant_override("separation", 6)
	panel.add_child(host.nav_buttons)
	for page in ["Experiences", "Places", "Collection"]:
		var tab := Look.nav_button(page)
		tab.set_meta("journal_page", page)
		tab.accessibility_name = page
		tab.pressed.connect(func() -> void: host.select_page(page))
		tab.gui_input.connect(func(event: InputEvent) -> void: host.tab_key(event, tab))
		host.nav_buttons.add_child(tab)
		host.tabs.append(tab)
	host.nav_buttons.add_child(Look.spacer(14))
	host.progress = PanelContainer.new()
	host.progress_style = Look.pad(Look.box(Look.NAV, 0, Look.DIVIDER, Vector4i(0, 1, 0, 0)), 12, 16, 12, 16)
	host.progress.add_theme_stylebox_override("panel", host.progress_style)
	host.progress_label = Look.lines(Style.text("", 11, Look.QUIET), 4)
	host.progress.add_child(host.progress_label)
	host.nav_buttons.add_child(host.progress)
	return panel

static func footer(host) -> Control:
	var panel := PanelContainer.new()
	host.footer_style = Look.pad(Look.box(Look.NAV, 0, Look.DIVIDER, Vector4i(0, 1, 0, 0)), 24, 16, 24, 16)
	host.footer_style.corner_radius_bottom_left = 15
	host.footer_style.corner_radius_bottom_right = 15
	panel.add_theme_stylebox_override("panel", host.footer_style)
	panel.custom_minimum_size.y = 56
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 0)
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(Look.spacer(2))
	host.footer_label = Look.lines(Style.text("J / Esc · Back to town      Keep exploring; there is no hurry.", 12, Look.QUIET), 4)
	host.footer_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(host.footer_label)
	panel.add_child(column)
	return panel
