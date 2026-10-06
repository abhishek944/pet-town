extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const Preview = preload("res://ui/library_preview.gd")

static func make_row(host, entry: Dictionary) -> Dictionary:
	var asset_id := str(entry.get("id", ""))
	var asset_name := str(entry.get("name", asset_id))
	var category := str(entry.get("category", ""))
	var footprint := str(entry.get("footprint", "Footprint unavailable"))
	var button := Style.button("")
	button.custom_minimum_size.y = 90
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.clip_contents = true
	button.accessibility_name = asset_name
	button.accessibility_description = "%s. %s. %s" % [category, footprint, "Select to preview; does not place the asset."]
	var inset := MarginContainer.new()
	inset.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inset.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	inset.add_theme_constant_override("margin_left", 8)
	inset.add_theme_constant_override("margin_right", 8)
	inset.add_theme_constant_override("margin_top", 6)
	inset.add_theme_constant_override("margin_bottom", 6)
	button.add_child(inset)
	var row := HBoxContainer.new()
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 9)
	inset.add_child(row)
	var thumbnail := Preview.new()
	thumbnail.corner_radius = 9.0
	thumbnail.mouse_filter = Control.MOUSE_FILTER_IGNORE
	thumbnail.custom_minimum_size = Vector2(100, 62)
	thumbnail.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(thumbnail)
	var details := VBoxContainer.new()
	details.mouse_filter = Control.MOUSE_FILTER_IGNORE
	details.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	details.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	details.add_theme_constant_override("separation", 2)
	row.add_child(details)
	var title := Style.label(asset_name, 12)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	details.add_child(title)
	var category_label := Style.text(category, 10, "6e7a5d")
	category_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	details.add_child(category_label)
	var footprint_label := Style.text(footprint, 9, "777b64")
	footprint_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	details.add_child(footprint_label)
	# A Button does not propagate the minimum size of its wrapped child labels.
	inset.minimum_size_changed.connect(func() -> void:
		button.custom_minimum_size.y = maxf(90, inset.get_combined_minimum_size().y))
	button.pressed.connect(func() -> void: host._select_asset(asset_id))
	host._style_asset_button(button, asset_id == host.selected_id)
	return {"button": button, "preview": thumbnail}
