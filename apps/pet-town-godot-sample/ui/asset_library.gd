extends ColorRect

signal closed
signal place_requested(id: String, yaw: float, distance: float)
signal undo_requested
signal preview_requested(id: String, yaw: float, distance: float)
signal replace_requested(id: String, target: String, yaw: float)
signal restore_requested(target: String)
signal replace_preview_requested(id: String, target: String, yaw: float)

const Style = preload("res://ui/hud_style.gd")
const Preview = preload("res://ui/library_preview.gd")

var catalog: Array = []
var selected_id := ""
var angle := 0.0
var distance := 12.0
var card: PanelContainer
var cards: VBoxContainer
var asset_buttons: Dictionary = {}
var preview: SubViewportContainer
var name_label: Label
var note: Label
var result: Label
var angle_label: Label
var add: Button
var turn: Button
var distance_label: Label
var distance_slider: HSlider
var catalog_note: Label
var targets: VBoxContainer
var split: HFlowContainer
var left_column: VBoxContainer
var right_column: VBoxContainer
var catalog_scroll: ScrollContainer
var placement_valid := false
var preview_available := false

func _ready() -> void:
	preload("res://ui/library_chrome.gd").build(self)

func resize_card() -> void:
	if not is_instance_valid(card):
		return
	card.size = Vector2(minf(980, maxf(1, size.x - 24)), minf(600, maxf(1, size.y - 24)))
	card.position = (size - card.size) / 2
	var width := maxf(1, card.size.x - 48)
	var catalog_width := minf(310, width)
	var detail_width := minf(370, width)
	left_column.custom_minimum_size.x = catalog_width
	right_column.custom_minimum_size.x = detail_width
	catalog_scroll.custom_minimum_size = Vector2(catalog_width, minf(400, maxf(180, card.size.y - 160)))
	preview.custom_minimum_size.x = detail_width

func set_catalog(entries: Array) -> void:
	var previous_id := selected_id
	result.text = ""
	catalog = entries
	selected_id = ""
	for entry in catalog:
		if str(entry.get("id", "")) == previous_id:
			selected_id = previous_id
			break
	if selected_id.is_empty() and not catalog.is_empty():
		selected_id = str(catalog[0].get("id", ""))

	Style.clear(cards)
	asset_buttons.clear()
	for entry in catalog:
		var row := make_asset_row(entry)
		cards.add_child(row.button)
		row.preview.show_asset(entry, 0.0)
		asset_buttons[str(entry.get("id", ""))] = row.button
	catalog_note.text = "Available assets · %d" % catalog.size() if not catalog.is_empty() else "No assets are available."
	if catalog.is_empty():
		var empty := Style.text("No placeable assets are available right now.", 12, "777b64")
		empty.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		cards.add_child(empty)
	placement_valid = false
	preview_available = false
	if catalog.is_empty():
		name_label.text = "No asset selected"
		note.text = "The current catalog has no placeable assets."
		preview.show_empty("No asset is available to preview.")
		angle_label.text = "0°"
		turn.disabled = true
		distance_slider.editable = false
		targets.set_asset_available(false)
		_set_add_disabled()
		return
	turn.disabled = false
	distance_slider.editable = true
	_update_catalog_selection()
	update_preview()

func make_asset_row(entry: Dictionary) -> Dictionary:
	return preload("res://ui/library_catalog_cards.gd").make_row(self, entry)

func _style_asset_button(button: Button, selected: bool) -> void:
	var background := "eaf0dc" if selected else "fffaf0"
	var border := "9fb38a" if selected else "dfcca4"
	for state in ["normal", "hover", "pressed"]:
		button.add_theme_stylebox_override(state, Style.panel(background, 15, border, false))
	button.add_theme_stylebox_override("disabled", Style.panel("fffaf0", 15, "dfcca4", false))

func _update_catalog_selection() -> void:
	for asset_id in asset_buttons:
		var button: Button = asset_buttons[asset_id]
		_style_asset_button(button, str(asset_id) == selected_id)

func _select_asset(asset_id: String) -> void:
	if selected_id == asset_id:
		return
	selected_id = asset_id
	_update_catalog_selection()
	update_preview()

func _turn_asset() -> void:
	angle = fmod(angle + PI / 2, TAU)
	update_preview()

func _distance_changed(value: float) -> void:
	distance = value
	distance_label.text = "Distance ahead · %s" % _format_distance(value)
	placement_valid = false
	_set_add_disabled()
	preview_requested.emit(selected_id, angle, distance)

func _format_distance(value: float) -> String:
	if is_equal_approx(value, roundf(value)):
		return "%d m" % roundi(value)
	return "%.1f m" % value

func _target_changed(target: String) -> void:
	_set_add_disabled()
	if not target.is_empty():
		if preview_available:
			replace_preview_requested.emit(selected_id, target, angle)
	else:
		preview_requested.emit(selected_id, angle, distance)

func update_preview() -> void:
	var selected: Dictionary = {}
	for entry in catalog:
		if str(entry.get("id", "")) == selected_id:
			selected = entry
			break
	if selected.is_empty():
		preview_available = false
		placement_valid = false
		name_label.text = "No asset selected"
		note.text = "Choose an available asset from the collection."
		preview.show_empty("No asset is selected.")
		targets.set_asset_available(false)
		_set_add_disabled()
		return

	name_label.text = str(selected.get("name", selected_id))
	note.text = str(selected.get("footprint", "Footprint unavailable"))
	preview_available = preview.show_asset(selected, angle)
	angle_label.text = "%d°" % roundi(rad_to_deg(angle))
	placement_valid = false
	_set_add_disabled()
	targets.set_asset_available(preview_available)
	result.text = "" if preview_available else "The model preview is unavailable. Add and replace are disabled."
	preview_requested.emit(selected_id, angle, distance)
	if preview_available and not targets.selected_id.is_empty():
		replace_preview_requested.emit(selected_id, targets.selected_id, angle)

func open_panel() -> void:
	result.text = ""
	show()
	update_preview()

func set_result(message: String) -> void:
	result.text = message

func set_placement_result(message: String, valid: bool) -> void:
	result.text = message if preview_available else "The model preview is unavailable. Add and replace are disabled."
	placement_valid = valid
	_set_add_disabled()

func _set_add_disabled() -> void:
	if is_instance_valid(add):
		add.disabled = catalog.is_empty() or not preview_available or not placement_valid or not targets.selected_id.is_empty()
