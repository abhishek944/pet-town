extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const Coins = preload("res://ui/coin_format.gd")
var title: Label
var readout: HBoxContainer
var coverage: Label
var following_row: HBoxContainer
var following_gap: Control
var following_name: Label
var following_total: Label
var details_button: Button
var details: VBoxContainer
var metadata: Label
var primary_details: VBoxContainer
var following_details: VBoxContainer
var following_title: Label
var footer_hint: Label

func build(host: PanelContainer, toggle: Callable) -> void:
	host.custom_minimum_size.x = 276
	var panel := Style.panel("fff8e9f5", 18, "e9d7b5", false)
	panel.content_margin_bottom = 17
	host.add_theme_stylebox_override("panel", panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 0)
	host.add_child(column)
	var top := Control.new()
	top.custom_minimum_size.y = 38
	column.add_child(top)
	title = Style.text("Coin balance", 12, "4c402f")
	title.position = Vector2(0, 11)
	top.add_child(title)
	details_button = Style.flat_button("+", "fff8e900", "fff8e900")
	details_button.custom_minimum_size = Vector2(44, 44)
	details_button.add_theme_font_size_override("font_size", 16)
	details_button.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	details_button.position = Vector2(-44, -3)
	details_button.accessibility_name = "Show coin and usage details"
	details_button.pressed.connect(toggle)
	top.add_child(details_button)
	readout = preload("res://ui/coin_readout.gd").new()
	column.add_child(readout)
	_space(column, 10)
	coverage = Style.text("Waiting for usage", 10, "54703d")
	coverage.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(coverage)
	following_gap = _space(column, 8)
	following_row = HBoxContainer.new()
	following_row.add_theme_constant_override("separation", 8)
	var border := StyleBoxFlat.new()
	border.bg_color = Color.TRANSPARENT
	border.border_color = Color("e9d7b5")
	border.border_width_top = 1
	border.content_margin_top = 8
	var following_panel := PanelContainer.new()
	following_panel.add_theme_stylebox_override("panel", border)
	following_panel.add_child(following_row)
	column.add_child(following_panel)
	following_name = Style.text("Following", 11, "4c402f")
	following_name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	following_name.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	following_row.add_child(following_name)
	following_total = Style.text("—", 11, "4c402f")
	following_row.add_child(following_total)
	details = VBoxContainer.new()
	details.add_theme_constant_override("separation", 8)
	preload("res://ui/usage_details_scroll.gd").wrap(details, column)
	metadata = Style.text("", 10)
	metadata.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	details.add_child(metadata)
	details.add_child(Style.text("Town breakdown", 11, "4c402f"))
	primary_details = preload("res://ui/coin_usage_details.gd").new()
	details.add_child(primary_details)
	following_title = Style.text("Followed contribution", 11, "4c402f")
	details.add_child(following_title)
	following_details = preload("res://ui/coin_usage_details.gd").new()
	details.add_child(following_details)
	_space(column, 10)
	footer_hint = Style.text("⌥ T · Hide coins", 10, "817258")
	footer_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	column.add_child(footer_hint)
	set_expanded(false)

func _space(column: VBoxContainer, height: float) -> Control:
	var spacer := Control.new()
	spacer.custom_minimum_size.y = height
	spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(spacer)
	return spacer

func render_combined(primary: Dictionary, following: Dictionary, selected_label: String, expanded: bool) -> void:
	_render_primary(primary)
	following_row.get_parent().visible = not selected_label.is_empty()
	following_gap.visible = not selected_label.is_empty()
	if not selected_label.is_empty():
		following_name.text = "Following · " + selected_label
		following_name.tooltip_text = following_name.text
		var balance: Dictionary = following.get("coins", {})
		following_total.text = Coins.contribution(balance) if following.get("available", false) else "Waiting for usage"
		following_total.tooltip_text = "Contribution already included in the town balance."
	following_details.render(following.get("reading", {}), following.get("available", false), "Contribution is already included in your town balance.")
	set_expanded(expanded)

func render_single(primary: Dictionary, _name: String, expanded: bool) -> void:
	_render_primary(primary)
	following_row.get_parent().hide()
	following_gap.hide()
	set_expanded(expanded)

func _render_primary(data: Dictionary) -> void:
	readout.set_balance(data.get("coins", {}))
	coverage.text = str(data.get("coverage", "Waiting for usage"))
	metadata.text = Coins.metadata(data.get("coins", {}))
	primary_details.render(data.get("reading", {}), data.get("available", false), "Locally tracked Codex sessions; not account-wide usage.")

func set_expanded(value: bool) -> void:
	details_button.text = "−" if value else "+"
	details_button.tooltip_text = "Hide coin and usage details" if value else "Show coin and usage details"
	details_button.accessibility_name = details_button.tooltip_text
	details.get_parent().visible = value
	details.visible = value
	var followed: bool = following_row.get_parent().visible
	following_title.visible = followed
	following_details.visible = followed
