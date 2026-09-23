extends "res://scripts/main_tree_storage.gd"

func _build_catalog_ui() -> void:
	catalog_panel = PanelContainer.new()
	catalog_panel.name = "ObjectCatalog"
	catalog_panel.visible = false
	catalog_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	catalog_panel.add_theme_stylebox_override("panel", _catalog_style(Color("14231ef5")))
	ui_root.add_child(catalog_panel)
	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 9)
	catalog_panel.add_child(outer)
	var header := HBoxContainer.new()
	outer.add_child(header)
	var title := Label.new()
	title.text = "Objects"
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title.add_theme_font_size_override("font_size", 23)
	title.add_theme_color_override("font_color", Color("f8f5ed"))
	header.add_child(title)
	var close := Button.new()
	close.text = "×"
	close.tooltip_text = "Close object catalog"
	close.pressed.connect(func() -> void: catalog_panel.visible = false)
	header.add_child(close)
	catalog_balance = Label.new()
	catalog_balance.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	catalog_balance.add_theme_font_size_override("font_size", 13)
	catalog_balance.add_theme_color_override("font_color", Color("f8d47c"))
	outer.add_child(catalog_balance)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	outer.add_child(scroll)
	catalog_list = VBoxContainer.new()
	catalog_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	catalog_list.add_theme_constant_override("separation", 7)
	scroll.add_child(catalog_list)
	get_viewport().size_changed.connect(_layout_catalog)
	_layout_catalog()

func _catalog_style(background: Color) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = background
	box.set_corner_radius_all(15)
	box.border_color = Color("f8d47c99")
	box.set_border_width_all(2)
	box.set_content_margin_all(12)
	return box

func _layout_catalog() -> void:
	if not is_instance_valid(catalog_panel):
		return
	var viewport := get_viewport().get_visible_rect().size
	catalog_panel.position = Vector2(maxf(8.0, viewport.x - 364.0), 84.0)
	catalog_panel.size = Vector2(minf(344.0, viewport.x - 16.0), maxf(220.0, viewport.y - 104.0))

func _toggle_catalog() -> void:
	if catalog_panel.visible:
		catalog_panel.visible = false
		return
	_refresh_catalog()
	catalog_panel.visible = true

func _refresh_catalog() -> void:
	if not is_instance_valid(catalog_list):
		return
	var wallet_ok: bool = build_wallet.load_wallet() if build_mode else true
	catalog_balance.text = ("%d token credits available\nFor now, edit ~/.pet-town/build-wallet.json to add usage totals." % build_wallet.balance()) if build_mode and wallet_ok else (build_wallet.last_error if build_mode else "Choose an object and place it anywhere.")
	for child in catalog_list.get_children():
		catalog_list.remove_child(child)
		child.queue_free()
	var last_category := ""
	for item in catalog_items:
		var category := String(item["category"])
		if category != last_category:
			var heading := Label.new()
			heading.text = category.to_upper()
			heading.add_theme_color_override("font_color", Color("d6aa61"))
			heading.add_theme_font_size_override("font_size", 12)
			catalog_list.add_child(heading)
			last_category = category
		var price := int(item["price"])
		var button := Button.new()
		button.text = "%s  ·  %s" % [item["name"], "%d credits" % price if build_mode else "Free"]
		button.tooltip_text = "Place %s" % item["name"]
		button.disabled = build_mode and (not wallet_ok or build_wallet.balance() < price)
		button.custom_minimum_size.y = 42
		button.add_theme_stylebox_override("normal", _catalog_style(Color("335c46")))
		button.add_theme_stylebox_override("disabled", _catalog_style(Color("334039")))
		button.add_theme_color_override("font_color", Color("fff9e8"))
		button.add_theme_color_override("font_disabled_color", Color("a6b0a6"))
		button.pressed.connect(_choose_catalog_item.bind(String(item["id"])))
		catalog_list.add_child(button)

func _choose_catalog_item(item_id: String) -> void:
	catalog_panel.visible = false
	call("_start_catalog_item", item_id)

func set_build_mode(enabled: bool) -> void:
	if placement_active:
		call("_cancel_tree_placement")
	if tree_editor_open:
		call("_close_tree_editor")
	build_mode = enabled
	for child in get_children():
		var tree := child as UserTree
		if tree == null:
			continue
		tree.visible = tree.is_build_item == build_mode
		tree.pick_area.collision_layer = 4 if tree.visible else 0
	if is_instance_valid(catalog_panel) and catalog_panel.visible:
		_refresh_catalog()
	tree_status.text = "Choose an object to place on your land." if build_mode else "Double-click an object to edit it, or browse objects."
