extends Button
const Palette = preload("res://ui/settings_style.gd")
const Style = preload("res://ui/hud_style.gd")
var portrait: Control
var heading: Label
var mood: Label
var meter: ProgressBar
var population: Label

func _ready() -> void:
	custom_minimum_size = Vector2(112, 108)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	for state in ["normal", "hover", "pressed"]:
		add_theme_stylebox_override(state, Palette.box(Palette.CREAM, Palette.BORDER, 10, 7, 7, 6, 6))
	var column := VBoxContainer.new()
	column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	column.offset_left = 7
	column.offset_right = -7
	column.offset_top = 6
	column.offset_bottom = -6
	column.add_theme_constant_override("separation", 2)
	add_child(column)
	portrait = preload("res://ui/wildlife_portrait.gd").new()
	portrait.custom_minimum_size = Vector2(1, 30)
	column.add_child(portrait)
	heading = Palette.ink_label("", 12)
	column.add_child(heading)
	mood = Palette.ink_label("", 9)
	column.add_child(mood)
	meter = ProgressBar.new()
	meter.show_percentage = false
	meter.custom_minimum_size.y = 5
	meter.mouse_filter = Control.MOUSE_FILTER_IGNORE
	meter.add_theme_stylebox_override("background", Palette.box("e6e9db", "", 3, 0, 0, 0, 0))
	column.add_child(meter)
	population = Palette.ink_label("", 8, Palette.QUIET)
	column.add_child(population)
	for label in [heading, mood, population]: label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	for label in [heading, mood, population]: label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

func setup(entry: Dictionary) -> void:
	portrait.set_entry(entry)
	heading.text = entry.name
	update_state(entry)

func update_state(entry: Dictionary) -> void:
	var low: bool = entry.happiness < 40
	mood.text = entry.mood
	mood.add_theme_color_override("font_color", Color("86532f" if low else Palette.SAGE_INK))
	meter.value = entry.happiness
	meter.add_theme_stylebox_override("fill", Palette.box("c39769" if low else "8da477", "", 3, 0, 0, 0, 0))
	population.text = "%d in town · %d / 100" % [entry.count, entry.happiness]
	accessibility_name = "%s, %s, happiness %d out of 100, %d in town. Open details." % [entry.name, entry.mood, entry.happiness, entry.count]
	tooltip_text = accessibility_name
