extends ColorRect

signal closed
signal place_requested(id: String, yaw: float, distance: float)
signal undo_requested
signal preview_requested(id: String, yaw: float, distance: float)
signal replace_requested(id: String, target: String, yaw: float)
signal restore_requested(target: String)
signal replace_preview_requested(id: String, target: String, yaw: float)

const Style = preload("res://ui/hud_style.gd")
const Look = preload("res://ui/library_style.gd")

var catalog: Array = []
var selected_id := ""
var angle := 0.0
var distance := 12.0
var compact := false
var card: PanelContainer
var content: VBoxContainer
var header: PanelContainer
var header_title: Label
var header_subtitle: Label
var close: Button
var body_scroll: ScrollContainer
var grid: GridContainer
var catalog_panel: PanelContainer
var catalog_note: Label
var catalog_scroll: ScrollContainer
var cards: GridContainer
var detail_scroll: ScrollContainer
var detail_margin: MarginContainer
var detail_layout: GridContainer
var name_label: Label
var note: Label
var stage_shell: PanelContainer
var preview: SubViewportContainer
var turn: Button
var angle_label: Label
var distance_slider: HSlider
var distance_amount: Label
var controls: VBoxContainer
var targets: VBoxContainer
var result_box: PanelContainer
var result: Label
var footer: PanelContainer
var footer_hint: Label
var undo: Button
var add: Button
var asset_buttons: Dictionary = {}
var layout_ready := false
var layout_compact := false
var placement_valid := false
var preview_available := false

func _ready() -> void:
	preload("res://ui/library_chrome.gd").build(self)

func resize_card() -> void:
	if not is_instance_valid(card) or size.x <= 0 or size.y <= 0:
		return
	compact = size.x <= 760
	var card_size := Vector2(minf(1060, maxf(1, size.x - 28)), minf(640, maxf(1, size.y - 28)))
	card.size = card_size
	card.position = (size - card_size) / 2
	preload("res://ui/library_chrome.gd").apply_layout(self, compact)

func set_catalog(entries: Array, budget: RefCounted = null) -> void:
	var previous_id := selected_id
	_message("", false)
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
		row.preview.defer_asset(entry, 0.0)
		asset_buttons[str(entry.get("id", ""))] = row.button
		if budget: await budget.checkpoint()
	catalog_note.text = "Available designs · %d" % catalog.size()
	if catalog.is_empty():
		cards.add_child(preload("res://ui/library_catalog_cards.gd").empty_hint())
		placement_valid = false
		preview_available = false
		if is_visible_in_tree(): update_preview()
		_set_add_disabled()
		return
	turn.disabled = false
	distance_slider.editable = true
	_update_catalog_selection()
	preview_available = false
	placement_valid = false
	_set_add_disabled()
	if is_visible_in_tree(): update_preview()

func make_asset_row(entry: Dictionary) -> Dictionary:
	return preload("res://ui/library_catalog_cards.gd").make_row(self, entry)

func _update_catalog_selection() -> void:
	for asset_id in asset_buttons:
		var button: Button = asset_buttons[asset_id]
		preload("res://ui/library_catalog_cards.gd").style_button(button, str(asset_id) == selected_id)

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
	distance_amount.text = _format_distance(value)
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
		note.text = "The current catalog has no placeable assets." if catalog.is_empty() else "Choose an available asset from the collection."
		preview.show_empty("No asset is available to preview." if catalog.is_empty() else "No asset is selected.")
		if catalog.is_empty():
			angle_label.text = "0°"
			turn.disabled = true
			distance_slider.editable = false
			_message("Choose an available asset before adding or replacing.", false)
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
	_message("" if preview_available else "The model preview is unavailable. Add and replace are disabled.", not preview_available)
	preview_requested.emit(selected_id, angle, distance)
	if preview_available and not targets.selected_id.is_empty():
		replace_preview_requested.emit(selected_id, targets.selected_id, angle)

func open_panel() -> void:
	_message("", false)
	show()
	update_preview()

func set_result(message: String) -> void:
	_message(message, false)

func set_placement_result(message: String, valid: bool) -> void:
	_message(message if preview_available else "The model preview is unavailable. Add and replace are disabled.", not valid)
	placement_valid = valid
	_set_add_disabled()

func _message(text: String, error: bool) -> void:
	result.text = text
	result_box.visible = not text.is_empty()
	result_box.add_theme_stylebox_override("panel", Look.validation_box(error))
	result.add_theme_color_override("font_color", Color(Look.ERROR_INK if error else Look.SAGE_INK))

func _set_add_disabled() -> void:
	if is_instance_valid(add):
		add.disabled = catalog.is_empty() or not preview_available or not placement_valid or not targets.selected_id.is_empty()
