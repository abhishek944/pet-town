extends RefCounted

## Settings shell presentation. The approved cream/woodland/sage layout keeps the
## existing modal lifecycle, page cache and signals owned by hud_modal.gd.

const Style = preload("res://ui/hud_style.gd")
const Palette = preload("res://ui/settings_style.gd")

const TABS := ["Companions", "World", "Time & weather", "Wildlife", "Coins & usage", "How to play", "About"]

static func build(host) -> void:
	host.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	host.color = Color("17271d33")
	Style.scrim(host, host.color, 1.5)
	host.mouse_filter = Control.MOUSE_FILTER_STOP
	host.card = Panel.new()
	host.card.add_theme_stylebox_override("panel", Palette.card())
	host.add_child(host.card)
	host.title_label = Style.title("Town settings", 28, Palette.INK)
	host.card.add_child(host.title_label)
	host.subtitle_label = Palette.ink_label("A little company for your time in town.", 12, Palette.QUIET)
	host.card.add_child(host.subtitle_label)
	host.close_button = Palette.close_button()
	host.close_button.accessibility_name = "Close settings"
	host.close_button.pressed.connect(func() -> void: host.closed.emit())
	host.card.add_child(host.close_button)
	host.header_divider = Palette.divider(Palette.DIVIDER)
	host.card.add_child(host.header_divider)
	host.category_panel = Panel.new()
	host.card.add_child(host.category_panel)
	host.tabs_scroll = ScrollContainer.new()
	host.tabs_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	host.tabs_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	host.category_panel.add_child(host.tabs_scroll)
	host.tabs_row = GridContainer.new()
	host.tabs_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.tabs_scroll.add_child(host.tabs_row)
	for tab_name in TABS:
		var tab := Palette.nav_button(tab_name)
		tab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		tab.accessibility_name = tab_name
		tab.pressed.connect(func() -> void: host.select_tab(tab_name))
		host.tabs_row.add_child(tab)
		host.tabs.append(tab)
	host.scroll_body = ScrollContainer.new()
	host.scroll_body.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	host.scroll_body.follow_focus = true
	host.scroll_body.get_v_scroll_bar().focus_mode = Control.FOCUS_ALL
	host.scroll_body.get_v_scroll_bar().accessibility_name = "Scroll Settings details"
	host.card.add_child(host.scroll_body)
	host.body_margin = MarginContainer.new()
	host.body_margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.scroll_body.add_child(host.body_margin)
	host.contents = VBoxContainer.new()
	host.contents.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.contents.add_theme_constant_override("separation", 0)
	host.body_margin.add_child(host.contents)
	host.footer_bar = Panel.new()
	host.card.add_child(host.footer_bar)
	host.footer_hint = Palette.ink_label("H / Esc · Back to town", 12, Palette.QUIET)
	host.footer_bar.add_child(host.footer_hint)
	host.reset_button = Palette.reset_button("Reset world…")
	host.reset_button.pressed.connect(host.show_reset)
	host.footer_bar.add_child(host.reset_button)
	host.resized.connect(host.layout)
	host.visibility_changed.connect(host._panel_visibility_changed)
	layout(host)
	host.hide()

static func compact(host) -> bool:
	return host.size.x < 900 or host.size.y < 650

static func layout(host) -> void:
	host.card.add_theme_stylebox_override("panel",Palette.card())
	host.title_label.add_theme_color_override("font_color",Color(Palette.INK))
	host.subtitle_label.add_theme_color_override("font_color",Color(Palette.QUIET))
	host.header_divider.color = Color(Palette.DIVIDER)
	host.close_button.add_theme_stylebox_override("normal",Palette.box(Palette.CREAM,Palette.CONTROL_BORDER,10,5,5,5,5))
	host.reset_button.add_theme_stylebox_override("normal",Palette.box("",Palette.RESET_BORDER,10,14,14,10,10))
	var card: Panel = host.card
	card.size = Vector2(minf(800, maxf(0, host.size.x - 28)), minf(600, maxf(0, host.size.y - 28)))
	card.position = (host.size - card.size) / 2
	var small: bool = compact(host)
	var horizontal: bool = host.size.x < 700
	var header := 85.0 if small else 102.0
	var footer := 68.0 if small else 69.0
	var footer_top := card.size.y - 1.0 - footer
	host.title_label.add_theme_font_size_override("font_size", 24 if small else 28)
	Style.position(host.title_label, Rect2(20 if small else 28, 16 if small else 24, card.size.x - 120, 40))
	Style.position(host.subtitle_label, Rect2(20 if small else 28, 52 if small else 65, card.size.x - 120, 20))
	Style.position(host.close_button, Rect2(card.size.x - (65 if small else 73), 16 if small else 24, 44, 44))
	Style.position(host.header_divider, Rect2(1, header, card.size.x - 2, 1))
	host.category_panel.add_theme_stylebox_override("panel", Palette.nav_panel(horizontal))
	host.footer_bar.add_theme_stylebox_override("panel", Palette.footer())
	Style.position(host.footer_bar, Rect2(1, footer_top, card.size.x - 2, footer))
	Style.position(host.footer_hint, Rect2(20 if small else 24, 26, card.size.x - 150, 20))
	host.reset_button.size = host.reset_button.get_combined_minimum_size()
	host.reset_button.position = Vector2(host.footer_bar.size.x - (20 if small else 24) - host.reset_button.size.x, (footer - host.reset_button.size.y) / 2.0)
	if horizontal:
		host.tabs_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
		host.tabs_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
		host.tabs_scroll.follow_focus = true
		host.tabs_row.columns = TABS.size()
		host.tabs_row.add_theme_constant_override("h_separation", 8)
		host.tabs_row.add_theme_constant_override("v_separation", 0)
		Style.position(host.category_panel, Rect2(1, header + 1, card.size.x - 2, 57))
		Style.position(host.tabs_scroll, Rect2(8, 2, card.size.x - 18, 52))
		Style.position(host.scroll_body, Rect2(1, header + 58, card.size.x - 2, footer_top - header - 58))
	else:
		host.tabs_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		host.tabs_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
		host.tabs_scroll.follow_focus = true
		host.tabs_row.columns = 1
		host.tabs_row.add_theme_constant_override("h_separation", 0)
		host.tabs_row.add_theme_constant_override("v_separation", 6)
		Style.position(host.category_panel, Rect2(1, header + 1, 180, footer_top - header - 1))
		Style.position(host.tabs_scroll, Rect2(12, 18, 156, footer_top - header - 19))
		Style.position(host.scroll_body, Rect2(181, header + 1, card.size.x - 182, footer_top - header - 1))
	var side := 20.0 if small else 28.0
	host.body_margin.add_theme_constant_override("margin_left", side)
	host.body_margin.add_theme_constant_override("margin_right", side)
	host.body_margin.add_theme_constant_override("margin_bottom", 16 if small else 6)
	apply_body_margin(host)
	style_tabs(host)
	preload("res://ui/atmosphere_chrome.gd").apply(host)

static func apply_body_margin(host) -> void:
	var top := 16.0 if compact(host) else 22.0
	host.body_margin.add_theme_constant_override("margin_top", top)

static func style_tabs(host) -> void:
	for tab in host.tabs:
		Palette.style_tab(tab, tab.text == host.selected_tab, host.size.x < 700)
