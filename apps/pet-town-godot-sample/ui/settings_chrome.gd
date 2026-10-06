extends RefCounted

const Style = preload("res://ui/hud_style.gd")

static func build(host) -> void:
	host.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	host.color = Color("17271d55")
	Style.scrim(host, host.color, 1.5)
	host.mouse_filter = Control.MOUSE_FILTER_STOP
	host.card = Panel.new()
	var panel := Style.panel("fff6e4", 24, "d4b489")
	panel.set_border_width_all(2)
	panel.shadow_color = Color("987044")
	panel.shadow_offset = Vector2(0, 6)
	host.card.add_theme_stylebox_override("panel", panel)
	host.add_child(host.card)
	var title := Style.title("Town settings", 27)
	title.position = Vector2(24, 20)
	host.card.add_child(title)
	var sub := Style.text("A little company for your time in town.", 12, "716449")
	sub.position = Vector2(24, 57)
	host.card.add_child(sub)
	host.close_button = Style.flat_button("×", "fff9e9", "d7c09a")
	host.close_button.custom_minimum_size = Vector2(42, 42)
	host.close_button.add_theme_font_size_override("font_size", 22)
	for state in ["normal", "hover", "pressed", "disabled"]:
		var close_style := host.close_button.get_theme_stylebox(state).duplicate() as StyleBoxFlat
		close_style.content_margin_top = 4
		close_style.content_margin_bottom = 4
		close_style.content_margin_left = 4
		close_style.content_margin_right = 4
		host.close_button.add_theme_stylebox_override(state, close_style)
	host.close_button.accessibility_name = "Close settings"
	host.close_button.pressed.connect(func() -> void: host.closed.emit())
	host.card.add_child(host.close_button)
	var divider := ColorRect.new()
	host.header_divider = divider
	divider.color = Color("ead9b9")
	divider.mouse_filter = Control.MOUSE_FILTER_IGNORE
	host.card.add_child(divider)
	host.category_panel = Panel.new()
	var category_style := StyleBoxFlat.new()
	category_style.bg_color = Color("f4ead7")
	category_style.border_color = Color("ead9b9")
	category_style.set_border_width_all(0)
	category_style.border_width_right = 1
	category_style.set_corner_radius_all(0)
	category_style.set_content_margin_all(0)
	host.category_panel.add_theme_stylebox_override("panel", category_style)
	host.card.add_child(host.category_panel)
	host.tabs_scroll = ScrollContainer.new()
	host.tabs_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	host.category_panel.add_child(host.tabs_scroll)
	host.tabs_row = VBoxContainer.new()
	host.tabs_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.tabs_row.add_theme_constant_override("separation", 6)
	host.tabs_scroll.add_child(host.tabs_row)
	for tab_name in ["Companions", "World", "How to play", "About"]:
		var tab := Style.button(tab_name)
		tab.custom_minimum_size.y = 46
		tab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		tab.alignment = HORIZONTAL_ALIGNMENT_LEFT
		tab.accessibility_name = tab_name
		tab.pressed.connect(func() -> void: host.select_tab(tab_name))
		host.tabs_row.add_child(tab)
		host.tabs.append(tab)
	var scroll := ScrollContainer.new()
	host.scroll_body = scroll
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	host.card.add_child(scroll)
	var margin := MarginContainer.new()
	margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	for edge in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + edge, 22 if edge in ["left", "right"] else 20)
	scroll.add_child(margin)
	host.contents = VBoxContainer.new()
	host.contents.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(host.contents)
	var footer := Panel.new()
	host.footer_bar = footer
	var footer_style := Style.panel("f4e9d3", 0, "deccac", false)
	footer_style.set_border_width_all(0)
	footer_style.border_width_top = 1
	footer_style.corner_radius_bottom_left = 22
	footer_style.corner_radius_bottom_right = 22
	footer.add_theme_stylebox_override("panel", footer_style)
	host.card.add_child(footer)
	host.footer_hint = Style.text("H / Esc  Back to town", 11)
	host.footer_hint.position = Vector2(22, 17)
	footer.add_child(host.footer_hint)
	host.reset_button = Style.flat_button("Reset world…", "f4e9d3", "f4e9d3")
	host.reset_button.custom_minimum_size = Vector2(110, 44)
	host.reset_button.add_theme_font_size_override("font_size", 11)
	host.reset_button.add_theme_color_override("font_color", Color("9c6244"))
	host.reset_button.pressed.connect(host.show_reset)
	footer.add_child(host.reset_button)
	host.resized.connect(host.layout)
	host.visibility_changed.connect(host._panel_visibility_changed)
	host.layout()
	host.hide()
