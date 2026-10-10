extends RefCounted
const S = preload("res://ui/atmosphere_style.gd")
static func apply(host) -> void:
	var small: bool = host.size.x < 700
	var card: Panel = host.card
	var face := S.box("fff6e4",20 if small else 24,"d4b489")
	face.set_border_width_all(2)
	face.shadow_color = Color("987044")
	face.shadow_offset = Vector2(0,6)
	face.shadow_size = 1
	card.add_theme_stylebox_override("panel",face)
	var header := 80.0 if small else 95.0
	var footer_top := card.size.y - 54
	S.Base.position(host.title_label,Rect2(18 if small else 24,14 if small else 19,card.size.x-110,34))
	host.title_label.add_theme_color_override("font_color",Color("4c402f"))
	host.subtitle_label.add_theme_color_override("font_color",Color("716449"))
	var close_face := S.box("fff9e9",10,"d7c09a")
	close_face.set_content_margin_all(5)
	host.close_button.add_theme_stylebox_override("normal",close_face)
	host.title_label.add_theme_font_size_override("font_size",22 if small else 27)
	S.Base.position(host.subtitle_label,Rect2(18 if small else 24,46 if small else 54,card.size.x-110,20))
	S.Base.position(host.close_button,Rect2(card.size.x-(58 if small else 66),13 if small else 21,44,44))
	S.Base.position(host.header_divider,Rect2(2,header,card.size.x-4,1))
	host.header_divider.color = Color("ead9b9")
	host.category_panel.add_theme_stylebox_override("panel",S.box("f4ead7",0,"ead9b9"))
	var footer_face := S.box("f4e9d3",0,"deccac")
	footer_face.corner_radius_bottom_left = 20 if small else 22
	footer_face.corner_radius_bottom_right = 20 if small else 22
	host.footer_bar.add_theme_stylebox_override("panel",footer_face)
	S.Base.position(host.footer_bar,Rect2(2,footer_top,card.size.x-4,52))
	S.Base.position(host.footer_hint,Rect2(20,16,card.size.x-160,22))
	host.reset_button.position.y = 5
	for state in ["normal","hover","pressed"]: host.reset_button.add_theme_stylebox_override(state,StyleBoxEmpty.new())
	host.footer_hint.add_theme_color_override("font_color",Color("716449"))
	if small:
		S.Base.position(host.category_panel,Rect2(2,header+1,card.size.x-4,52))
		S.Base.position(host.tabs_scroll,Rect2(8,4,card.size.x-20,44))
		S.Base.position(host.scroll_body,Rect2(2,header+53,card.size.x-4,footer_top-header-53))
	else:
		S.Base.position(host.category_panel,Rect2(2,header+1,178,footer_top-header-1))
		S.Base.position(host.tabs_scroll,Rect2(10,16,156,footer_top-header-17))
		S.Base.position(host.scroll_body,Rect2(180,header+1,card.size.x-182,footer_top-header-1))
	for side in ["left","right"]: host.body_margin.add_theme_constant_override("margin_"+side,18 if small else 22)
	host.body_margin.add_theme_constant_override("margin_top",15 if small else 20)
	for tab in host.tabs:
		var selected: bool = tab.text == host.selected_tab
		var style := S.box("e3ebd5" if selected else "f4ead7",10,"b5c6a0" if selected else "f4ead7")
		for state in ["normal","hover","pressed","disabled"]: tab.add_theme_stylebox_override(state,style)
		for state in ["font_color","font_hover_color","font_pressed_color","font_focus_color"]:
			tab.add_theme_color_override(state,Color("355b43" if selected else "716449"))
		tab.add_theme_font_size_override("font_size",10 if small else 12)
