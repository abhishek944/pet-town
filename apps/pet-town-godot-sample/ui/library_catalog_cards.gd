extends RefCounted
# Catalog card presentation for the Asset Library workbench (library:B1).
# It only renders one catalog entry; selection and placement stay in
# asset_library.gd, and library_preview.gd keeps owning real model renders.

const Style = preload("res://ui/hud_style.gd")
const Look = preload("res://ui/library_style.gd")
const Preview = preload("res://ui/library_thumbnail.gd")

static func make_row(host, entry: Dictionary) -> Dictionary:
	var asset_id := str(entry.get("id", ""))
	var asset_name := str(entry.get("name", asset_id))
	var category := str(entry.get("category", ""))
	var footprint := str(entry.get("footprint", "Footprint unavailable")).split(" · ")[0]
	var button := Style.button("")
	button.custom_minimum_size = Vector2(244 if host.compact else 0, 92)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.clip_contents = true
	button.accessibility_name = asset_name
	button.accessibility_description = "%s. %s. Select to preview; does not place the asset." % [category, footprint]
	button.focus_entered.connect(func() -> void: host.body_scroll.ensure_control_visible(button))
	var inset := MarginContainer.new()
	inset.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inset.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	Look.edges(inset, 7, 8, 7, 8)
	button.add_child(inset)
	var row := HBoxContainer.new()
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 10)
	inset.add_child(row)
	var thumbnail := Preview.new()
	thumbnail.corner_radius = 8.0
	thumbnail.fit_to_stage = true
	thumbnail.mouse_filter = Control.MOUSE_FILTER_IGNORE
	thumbnail.custom_minimum_size = Vector2(88, 62)
	thumbnail.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(thumbnail)
	var details := VBoxContainer.new()
	details.mouse_filter = Control.MOUSE_FILTER_IGNORE
	details.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	details.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	details.add_theme_constant_override("separation", 4)
	row.add_child(details)
	var title := Style.text(asset_name, 12, Look.INK)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	details.add_child(title)
	var category_label := Style.text(category, 10, Look.QUIET)
	category_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	details.add_child(category_label)
	var footprint_label := Style.text(footprint, 10, Look.QUIET)
	footprint_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	details.add_child(footprint_label)
	# A Button does not propagate the minimum size of its wrapped child labels.
	inset.minimum_size_changed.connect(func() -> void:
		button.custom_minimum_size.y = maxf(92, inset.get_combined_minimum_size().y))
	button.pressed.connect(func() -> void: host._select_asset(asset_id))
	style_button(button, asset_id == host.selected_id)
	return {"button": button, "preview": thumbnail}

static func style_button(button: Button, selected: bool) -> void:
	var background := Look.SAGE if selected else Look.CREAM
	var border := Look.SAGE_BORDER if selected else Look.DIVIDER
	for state in ["normal", "hover", "pressed"]:
		var value := Look.panel(background, 10, border)
		button.add_theme_stylebox_override(state, value)
	button.add_theme_stylebox_override("disabled", Look.panel(background, 10, border))
	button.add_theme_stylebox_override("focus", Look.focus_box(10))

static func empty_hint() -> Control:
	var margin := MarginContainer.new()
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	Look.edges(margin, 8, 8, 0, 8)
	var label := Look.hint("No placeable assets are available right now.")
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(label)
	return margin
