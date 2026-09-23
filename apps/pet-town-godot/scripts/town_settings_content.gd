extends Control
## In-town settings shell. Tree editing remains in the game; no settings values are saved yet.

signal dismissed

const SECTIONS := ["Town", "Companions", "Camera & comfort", "Decorations"]
const CREAM := Color("f8f5ed")
const GOLD := Color("d6aa61")
const MUTED := Color("b8c0b7")

var panel: Panel
var scrim: ColorRect
var close_button: Button
var navigation: VBoxContainer
var content: VBoxContainer
var scroll: ScrollContainer
var footer_status: Label
var apply_button: Button
var pet_names: Array[String] = []
var selected_section := 0
var selected_pet := 0
var return_focus: Control

func _show_section() -> void:
	pass

func _pet_picker() -> void:
	if pet_names.is_empty():
		_note("No 3D pet appearances are installed.")
		return
	var picker := OptionButton.new()
	picker.tooltip_text = "Choose a 3D pet"
	for name in pet_names:
		picker.add_item(name)
	picker.select(selected_pet)
	picker.item_selected.connect(_choose_pet)
	content.add_child(picker)
	var selected_name := pet_names[selected_pet]
	_note("%s · individual 3D controls will be added later." % selected_name)

func _choose_pet(index: int) -> void:
	selected_pet = index
	_show_section()
	for child in content.get_children():
		if child is OptionButton:
			child.grab_focus()
			break

func _section_heading(title: String, description: String) -> void:
	content.add_child(_label(title, 12, GOLD))
	content.add_child(_label(description, 20, CREAM))

func _note(text: String) -> void:
	var label := _label(text, 14, MUTED)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(label)

func _label(text: String, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	return label

func _box(background: Color, radius: int, border := Color.TRANSPARENT) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.set_corner_radius_all(radius)
	style.border_color = border
	style.set_border_width_all(1 if border != Color.TRANSPARENT else 0)
	return style
