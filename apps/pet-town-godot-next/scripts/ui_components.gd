extends Control

signal place_requested(asset_id: String)
signal move_requested
signal rotate_requested(degrees: float)
signal scale_requested(change: float)
signal delete_requested
signal cancel_requested
signal undo_requested
signal mode_requested(mode: String)
signal agent_details_requested(agent_id: String)

const CREAM := Color("f8f5ed")
const GOLD := Color("edc57d")
const MUTED := Color("bbcabd")
const GREEN := Color("315947")
const PREVIEW_SCRIPT := preload("res://scripts/ui_model_preview.gd")

var catalog: WorkshopCatalog
var wallet: BuildWallet
var editor: WorkshopEditor
var town_mode := "chill"
var agents: Array[Dictionary] = []
var companion_names: Array[String] = []
var companion_scenes: Array[PackedScene] = []
var library: PanelContainer
var library_list: VBoxContainer
var library_heading: Label
var balance_panel: PanelContainer
var balance_label: Label
var inspector: PanelContainer
var inspector_name: Label
var inspector_kind: Label
var inspector_preview: WorkshopModelPreview
var inspector_preview_asset_id := ""
var inspector_size_slider: HSlider
var inspector_size_label: Label
var inspector_undo_button: Button
var status_label: Label
var cancel_button: Button
var settings_button: Button
var settings_overlay: Control
var settings_panel: PanelContainer
var settings_tabs: VBoxContainer
var settings_content: VBoxContainer
var settings_scroll: ScrollContainer
var settings_page := 0
var agent_panel: PanelContainer
var agent_content: VBoxContainer

func _label(value: String, font_size: int, color: Color) -> Label:
	var result := Label.new()
	result.text = value
	result.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	result.add_theme_font_size_override("font_size", font_size)
	result.add_theme_color_override("font_color", color)
	return result

func _button(value: String, primary := false) -> Button:
	var result := Button.new()
	result.text = value
	result.custom_minimum_size.y = 39
	result.add_theme_stylebox_override("normal", _style(Color("aa792c") if primary else GREEN, 9, GOLD))
	result.add_theme_stylebox_override("hover", _style(Color("c99438") if primary else Color("42765c"), 9, GOLD))
	result.add_theme_stylebox_override("disabled", _style(Color("36443d"), 9, Color("607166")))
	result.add_theme_color_override("font_color", CREAM)
	result.add_theme_color_override("font_disabled_color", MUTED)
	result.add_theme_font_size_override("font_size", 14)
	return result

func _style(background: Color, radius: int, border: Color) -> StyleBoxFlat:
	var result := StyleBoxFlat.new()
	result.bg_color = background
	result.set_corner_radius_all(radius)
	result.border_color = border
	result.set_border_width_all(1)
	result.set_content_margin_all(10)
	return result

func _card(parent: Container) -> VBoxContainer:
	var shell := PanelContainer.new()
	shell.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	shell.add_theme_stylebox_override("panel", _style(Color("26392f"), 12, Color("94ae9266")))
	parent.add_child(shell)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	shell.add_child(box)
	return box

func _number(value: int) -> String:
	var digits := str(value)
	var result := ""
	for index in digits.length():
		if index > 0 and (digits.length() - index) % 3 == 0:
			result += ","
		result += digits[index]
	return result

func _clear(parent: Node) -> void:
	for child in parent.get_children():
		parent.remove_child(child)
		child.queue_free()
