extends RefCounted
const Base = preload("res://ui/hud_style.gd")
static func box(background := "fff9eb", radius := 10, border := "dac5a1") -> StyleBoxFlat:
	return Base.panel(background,radius,border,false)
static func label(text: String, size := 11) -> Label:
	return Base.text(text,size,"716449")
static func selected(button: Button, active: bool, segment := false) -> void:
	var background := "426448" if active and segment else "edf1df" if active else "eee5d1" if segment else "fff9eb"
	var face := box(background,8 if segment else 10,"668554" if active else "dac5a1")
	face.set_border_width_all(0 if segment else 2 if active else 1)
	for kind in ["normal","pressed","hover"]: button.add_theme_stylebox_override(kind,face)
	for state in ["font_color","font_hover_color","font_pressed_color","font_focus_color"]:
		button.add_theme_color_override(state,Color("fff9e9" if active and segment else "4c402f"))
	for child in button.find_children("*","Label",true,false):
		if child is Label: child.add_theme_color_override("font_color",Color("355b43" if active else "75664d"))
static func section(host: VBoxContainer, title: String) -> void:
	var line := ColorRect.new()
	line.color = Color("ead9b9")
	line.custom_minimum_size.y = 1
	line.mouse_filter = Control.MOUSE_FILTER_IGNORE
	host.add_child(line)
	if not title.is_empty(): host.add_child(Base.title(title,17))
static func choices(host: VBoxContainer, field: String, entries: Array, emit: Callable, columns := 0, segment := false) -> Control:
	var row: Container = GridContainer.new() if columns > 0 else HBoxContainer.new()
	if row is GridContainer: row.columns = columns
	row.add_theme_constant_override("h_separation",7)
	row.add_theme_constant_override("v_separation",7)
	row.add_theme_constant_override("separation",7)
	if segment:
		var surround := PanelContainer.new()
		var panel := box("eee5d1",11,"dfceb0")
		panel.set_content_margin_all(4)
		surround.add_theme_stylebox_override("panel",panel)
		host.add_child(surround)
		surround.add_child(row)
	else: host.add_child(row)
	for entry in entries:
		var lines := str(entry[1]).split("\n")
		var button := Base.button(str(entry[1]) if lines.size() == 1 else "",Vector2(0,44 if segment else 60 if field == "held_preset" else 56 if field == "weather" else 46))
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.add_theme_font_size_override("font_size",11)
		button.set_meta("field",field)
		button.set_meta("value",entry[0])
		button.set_meta("segment",segment)
		button.accessibility_name = str(entry[1]).replace("\n"," ")
		button.pressed.connect(func(): emit.call(field,entry[0]))
		row.add_child(button)
		if lines.size() > 1:
			var copy := VBoxContainer.new()
			copy.add_theme_constant_override("separation",0)
			copy.mouse_filter = Control.MOUSE_FILTER_IGNORE
			button.add_child(copy)
			copy.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
			copy.offset_top = 5
			copy.offset_left = 6
			copy.offset_right = -6
			for i in lines.size():
				var size := 18 if i == 0 and field in ["weather","held_preset"] else 12 if i == 0 else 10 if field == "held_preset" else 9
				var text := label(lines[i],size)
				text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER if field in ["weather","held_preset"] else HORIZONTAL_ALIGNMENT_LEFT
				copy.add_child(text)
	return row
static func toggle(host: VBoxContainer, text: String, field: String, emit: Callable) -> CheckButton:
	var button := CheckButton.new()
	button.text = text
	button.custom_minimum_size.y = 44
	button.add_theme_font_size_override("font_size",12)
	button.set_meta("field",field)
	button.accessibility_name = text
	for state in ["normal","hover","pressed","disabled"]: button.add_theme_stylebox_override(state,StyleBoxEmpty.new())
	button.add_theme_icon_override("checked",Base.icon("weather-switch-on"))
	button.add_theme_icon_override("unchecked",Base.icon("weather-switch-off"))
	button.toggled.connect(func(value: bool): emit.call(field,value))
	host.add_child(button)
	return button

static func heading(host: VBoxContainer, text: String) -> Label:
	var row := HBoxContainer.new()
	row.custom_minimum_size.y = 24
	host.add_child(row)
	var title := label(text,12)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(title)
	var pill := label("",9)
	var face := box("e3ebd5",12,"e3ebd5")
	face.content_margin_top = 4
	face.content_margin_bottom = 4
	face.content_margin_left = 9
	face.content_margin_right = 9
	pill.add_theme_stylebox_override("normal",face)
	row.add_child(pill)
	return pill
