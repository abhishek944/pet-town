extends Control

signal dismissed

const SECTIONS := ["Town", "Companions", "Camera", "Objects"]
const CREAM := Color("f8f5ed")
const GOLD := Color("edc57d")
const MUTED := Color("bbcabd")
const PREVIEW := preload("res://scripts/town_preview.gd")

var host: Node
var editor: Node
var panel: Panel
var close_button: Button
var navigation: VBoxContainer
var content: VBoxContainer
var scroll: ScrollContainer
var footer_status: Label
var pet_names: Array[String] = []
var pet_scenes: Array[PackedScene] = []
var selected_section := 0
var selected_pet := -1
var return_focus: Control

func configure(town: Node, object_editor: Node, names: Array, scenes: Array) -> void:
	host = town
	editor = object_editor
	pet_names.clear()
	pet_scenes.clear()
	for name in names:
		pet_names.append(str(name))
	for scene in scenes:
		pet_scenes.append(scene as PackedScene)
	if is_instance_valid(content):
		_show_section()

func _show_section() -> void:
	pass

func _heading(eyebrow: String, title: String, summary: String) -> void:
	content.add_child(_label(eyebrow, 12, GOLD))
	content.add_child(_label(title, 25, CREAM))
	var note := _label(summary, 14, MUTED)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(note)

func _card(parent: Container, background := Color("26392f")) -> VBoxContainer:
	var shell := PanelContainer.new()
	shell.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	shell.add_theme_stylebox_override("panel", _box(background, 13, Color("94ae9266")))
	parent.add_child(shell)
	var inner := VBoxContainer.new()
	inner.add_theme_constant_override("separation", 9)
	shell.add_child(inner)
	return inner

func _label(text: String, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	return label

func _button(label: String, action: Callable, primary := false) -> Button:
	var button := Button.new()
	button.text = label
	button.custom_minimum_size.y = 42
	button.add_theme_font_size_override("font_size", 14)
	button.add_theme_stylebox_override("normal", _box(Color("bd842e") if primary else Color("315947"), 9, Color("edc57d")))
	button.add_theme_stylebox_override("hover", _box(Color("d29a45") if primary else Color("42765c"), 9, Color("ffe1a5")))
	button.add_theme_stylebox_override("disabled", _box(Color("36443d"), 9, Color("607166")))
	button.add_theme_color_override("font_color", CREAM)
	button.add_theme_color_override("font_disabled_color", Color("aeb9af"))
	button.pressed.connect(action)
	return button

func _box(background: Color, radius: int, border := Color.TRANSPARENT) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.set_corner_radius_all(radius)
	style.border_color = border
	style.set_border_width_all(1 if border != Color.TRANSPARENT else 0)
	style.set_content_margin_all(14)
	return style
