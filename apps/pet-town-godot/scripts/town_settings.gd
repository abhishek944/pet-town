extends "res://scripts/town_settings_gallery.gd"

var scrim: ColorRect
var done_button: Button

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	scrim = ColorRect.new()
	scrim.color = Color("07110dc9")
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(scrim)
	panel = Panel.new()
	panel.add_theme_stylebox_override("panel", _box(Color("14231ff8"), 20, Color("d6aa6166")))
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(panel)
	_build_header()
	_build_body()
	_build_footer()
	resized.connect(_layout)
	_layout()
	_show_section()

func open_settings(section := 0) -> void:
	return_focus = get_viewport().gui_get_focus_owner()
	selected_section = clampi(section, 0, SECTIONS.size() - 1)
	visible = true
	_show_section()
	close_button.grab_focus()

func close_settings() -> void:
	visible = false
	dismissed.emit()
	if is_instance_valid(return_focus) and return_focus.is_visible_in_tree():
		return_focus.grab_focus()

func _build_header() -> void:
	var eyebrow := _label("PET TOWN  /  YOUR ISLAND", 12, GOLD)
	eyebrow.name = "Eyebrow"
	panel.add_child(eyebrow)
	var heading := _label("Town studio", 29, CREAM)
	heading.name = "Heading"
	panel.add_child(heading)
	var subtitle := _label("Explore, meet companions, and make the island yours.", 14, MUTED)
	subtitle.name = "Subtitle"
	panel.add_child(subtitle)
	close_button = _button("×", close_settings)
	close_button.tooltip_text = "Close town studio"
	close_button.add_theme_font_size_override("font_size", 25)
	panel.add_child(close_button)

func _build_body() -> void:
	var divider := ColorRect.new()
	divider.name = "HeaderDivider"
	divider.color = Color("d6aa6140")
	panel.add_child(divider)
	var sidebar := Panel.new()
	sidebar.name = "Sidebar"
	sidebar.add_theme_stylebox_override("panel", _box(Color("0d1a16"), 0))
	panel.add_child(sidebar)
	navigation = VBoxContainer.new()
	navigation.add_theme_constant_override("separation", 9)
	sidebar.add_child(navigation)
	for index in SECTIONS.size():
		var button := Button.new()
		button.text = SECTIONS[index]
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.custom_minimum_size.y = 47
		button.add_theme_font_size_override("font_size", 16)
		button.pressed.connect(_select_section.bind(index))
		navigation.add_child(button)
	scroll = ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	panel.add_child(scroll)
	content = VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 16)
	scroll.add_child(content)

func _build_footer() -> void:
	var divider := ColorRect.new()
	divider.name = "FooterDivider"
	divider.color = Color("d6aa6140")
	panel.add_child(divider)
	footer_status = _label("Changes take effect immediately  ·  Esc closes this view", 12, MUTED)
	panel.add_child(footer_status)
	done_button = _button("Done", close_settings, true)
	panel.add_child(done_button)

func _layout() -> void:
	if not is_instance_valid(panel):
		return
	var viewport_size := size
	var width := minf(1040.0, viewport_size.x - 32.0)
	var height := minf(740.0, viewport_size.y - 32.0)
	panel.position = (viewport_size - Vector2(width, height)) * 0.5
	panel.size = Vector2(width, height)
	var sidebar_width := minf(190.0, width * 0.27)
	panel.get_node("Eyebrow").position = Vector2(25, 18)
	panel.get_node("Heading").position = Vector2(25, 39)
	panel.get_node("Subtitle").position = Vector2(26, 82)
	close_button.position = Vector2(width - 65, 24)
	close_button.size = Vector2(40, 40)
	panel.get_node("HeaderDivider").position = Vector2(0, 111)
	panel.get_node("HeaderDivider").size = Vector2(width, 1)
	var sidebar := panel.get_node("Sidebar") as Panel
	sidebar.position = Vector2(0, 112)
	sidebar.size = Vector2(sidebar_width, height - 112)
	navigation.position = Vector2(12, 22)
	navigation.size = Vector2(sidebar_width - 24, height - 145)
	scroll.position = Vector2(sidebar_width + 22, 130)
	scroll.size = Vector2(width - sidebar_width - 44, height - 206)
	panel.get_node("FooterDivider").position = Vector2(sidebar_width, height - 64)
	panel.get_node("FooterDivider").size = Vector2(width - sidebar_width, 1)
	footer_status.position = Vector2(sidebar_width + 22, height - 42)
	footer_status.size = Vector2(width - sidebar_width - 165, 24)
	done_button.position = Vector2(width - 120, height - 54)
	done_button.size = Vector2(94, 40)

func _select_section(index: int) -> void:
	selected_section = index
	_show_section()
