extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const Format = preload("res://ui/usage_format.gd")
const METRICS := [["inputTokens", "Input"], ["outputTokens", "Output"], ["cachedInputTokens", "Cached input"], ["reasoningOutputTokens", "Reasoning"]]
var title: Label
var total: Label
var coverage: Label
var following_row: HBoxContainer
var following_name: Label
var following_status: Label
var following_total: Label
var details_button: Button
var details: VBoxContainer
var primary_details: VBoxContainer
var following_details: VBoxContainer
var primary_details_title: Label
var following_details_title: Label
var primary_metrics: Dictionary = {}
var following_metrics: Dictionary = {}
var primary_price: Label
var following_price: Label
var primary_note: Label
var following_note: Label
var primary_model: Label
var following_model: Label
var footer_hint: Label

func build(host: PanelContainer, toggle: Callable) -> void:
	host.custom_minimum_size.x = 276
	var panel := Style.panel("fff8e9f5", 18, "e9d7b5", false)
	panel.corner_radius_bottom_left = 0
	panel.border_width_left = 0
	panel.border_width_bottom = 0
	host.add_theme_stylebox_override("panel", panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 6)
	host.add_child(column)
	var top := HBoxContainer.new()
	top.add_theme_constant_override("separation", 4)
	column.add_child(top)
	title = Style.text("Town usage", 12, "4c402f")
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top.add_child(title)
	details_button = Style.flat_button("+", "fff8e900", "fff8e900")
	details_button.custom_minimum_size = Vector2(44, 44)
	details_button.tooltip_text = "Show Pet Town and followed token breakdowns and credit estimates"
	details_button.pressed.connect(toggle)
	top.add_child(details_button)
	var summary := HBoxContainer.new()
	column.add_child(summary)
	total = Style.title("—", 25)
	total.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	summary.add_child(total)
	summary.add_child(Style.text("tokens", 11, "817258"))
	coverage = Style.text("Usage unavailable", 10, "54703d")
	coverage.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(coverage)
	var divider := ColorRect.new()
	divider.color = Color("e9d7b5")
	divider.custom_minimum_size.y = 1
	divider.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(divider)
	following_row = HBoxContainer.new()
	following_row.add_theme_constant_override("separation", 8)
	column.add_child(following_row)
	var following_labels := VBoxContainer.new()
	following_labels.add_theme_constant_override("separation", 1)
	following_labels.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	following_row.add_child(following_labels)
	following_name = Style.text("Following", 11, "4c402f")
	following_name.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	following_labels.add_child(following_name)
	following_status = Style.text("Usage unavailable", 9, "54703d")
	following_status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	following_labels.add_child(following_status)
	following_total = Style.text("—", 15, "4c402f")
	following_total.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	following_row.add_child(following_total)
	details = VBoxContainer.new()
	details.add_theme_constant_override("separation", 6)
	preload("res://ui/usage_details_scroll.gd").wrap(details, column)
	primary_details = VBoxContainer.new()
	primary_details.add_theme_constant_override("separation", 4)
	details.add_child(primary_details)
	primary_details_title = Style.text("Town breakdown", 11, "4c402f")
	primary_details.add_child(primary_details_title)
	primary_model = Style.text("", 10, "817258")
	primary_details.add_child(primary_model)
	_add_metrics(primary_details, primary_metrics)
	primary_price = _price_label()
	primary_details.add_child(primary_price)
	primary_note = _note_label()
	primary_details.add_child(primary_note)
	var following_divider := ColorRect.new()
	following_divider.color = Color("e9d7b5")
	following_divider.custom_minimum_size.y = 1
	following_divider.mouse_filter = Control.MOUSE_FILTER_IGNORE
	details.add_child(following_divider)
	following_details = VBoxContainer.new()
	following_details.add_theme_constant_override("separation", 4)
	details.add_child(following_details)
	following_details_title = Style.text("Followed breakdown", 11, "4c402f")
	following_details.add_child(following_details_title)
	following_model = Style.text("", 10, "817258")
	following_details.add_child(following_model)
	_add_metrics(following_details, following_metrics)
	following_price = _price_label()
	following_details.add_child(following_price)
	following_note = _note_label()
	following_details.add_child(following_note)
	footer_hint = Style.text("⌥ T · Hide usage", 10, "817258")
	footer_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	column.add_child(footer_hint)
	details.hide()

func render_combined(primary: Dictionary, following: Dictionary, selected_label: String, expanded: bool) -> void:
	_render_primary(primary, "Town usage", str(primary.get("coverage", "")), true)
	following_row.visible = not selected_label.is_empty()
	if following_row.visible:
		following_name.text = "Following · " + selected_label
		following_name.tooltip_text = following_name.text
		following_status.text = str(following.get("status", "Usage unavailable"))
		following_total.text = _compact(following)
		following_total.tooltip_text = _tooltip(following)
	following_model.text = "Model · " + str(following.get("model", "")) if not str(following.get("model", "")).is_empty() else ""
	following_model.visible = not following_model.text.is_empty()
	_follow_details(following)
	footer_hint.visible = true
	set_expanded(expanded)

func render_single(primary: Dictionary, name: String, expanded: bool) -> void:
	var is_town: bool = primary.get("is_town", true)
	_render_primary(primary, name, str(primary.get("coverage", "")), is_town)
	following_row.hide()
	following_details.hide()
	footer_hint.hide()
	set_expanded(expanded)

func _render_primary(data: Dictionary, name: String, summary: String, is_town: bool) -> void:
	title.text = name
	total.text = _compact(data)
	total.tooltip_text = _tooltip(data)
	coverage.text = summary
	coverage.visible = not summary.is_empty()
	primary_details_title.text = "Town breakdown" if is_town else "Usage breakdown"
	primary_model.text = "Model · " + str(data.get("model", "")) if not is_town and not str(data.get("model", "")).is_empty() else ""
	primary_model.visible = not primary_model.text.is_empty()
	_fill_details(data, primary_metrics, primary_price, primary_note)

func _follow_details(data: Dictionary) -> void:
	following_details_title.text = "Followed breakdown"
	_fill_details(data, following_metrics, following_price, following_note)

func _fill_details(data: Dictionary, values: Dictionary, price: Label, note: Label) -> void:
	var reading: Dictionary = data.get("reading", {})
	var available: bool = data.get("available", false)
	for key in values:
		values[key].text = Format.count(reading.get(key, null)) if available else "—"
	price.text = "Est. standard credits · %s" % (Format.credits(reading.get("estimatedCredits", null)) if available else "unavailable")
	note.text = str(data.get("note", ""))

func _compact(data: Dictionary) -> String:
	var reading: Dictionary = data.get("reading", {})
	return Format.compact(reading.get("totalTokens", null)) if data.get("available", false) else "—"

func _tooltip(data: Dictionary) -> String:
	var reading: Dictionary = data.get("reading", {})
	return "%s tokens" % Format.count(reading.get("totalTokens")) if data.get("available", false) and Format.valid(reading.get("totalTokens")) else str(data.get("status", "Usage unavailable"))

func _add_metrics(parent: VBoxContainer, values: Dictionary) -> void:
	for metric in METRICS:
		var line := HBoxContainer.new()
		parent.add_child(line)
		var label := Style.text(metric[1], 11, "817258")
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		line.add_child(label)
		var value := Style.text("—", 11, "4c402f")
		line.add_child(value)
		values[metric[0]] = value

func _price_label() -> Label:
	var value := Style.text("Est. standard credits · unavailable", 10, "54703d")
	value.tooltip_text = "Published Codex standard credit rates. Not billed cost or subscription allowance."
	return value

func _note_label() -> Label:
	var value := Style.text("", 9, "817258")
	value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return value

func set_expanded(value: bool) -> void:
	details_button.text = "−" if value else "+"
	details_button.tooltip_text = "Hide usage breakdowns" if value else "Show Pet Town and followed token breakdowns and credit estimates"
	details.get_parent().visible = value
	details.visible = value
	primary_details.visible = value
	following_details.visible = value and following_row.visible
