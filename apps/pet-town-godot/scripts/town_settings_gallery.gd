extends "res://scripts/town_settings_pages.gd"

func _companions_page() -> void:
	_heading("COMPANION GALLERY", "Meet the town's 3D companions", "See every available look in 3D. Live agents take on these appearances when they visit.")
	if pet_scenes.is_empty():
		content.add_child(_note("No companion models are installed yet."))
		return
	var grid := _grid()
	for index in pet_scenes.size():
		var card := _card(grid)
		card.add_child(_label("%02d  %s" % [index + 1, pet_names[index]], 17, CREAM))
		var scene := pet_scenes[index].instantiate() as Node3D
		if scene != null:
			card.add_child(PREVIEW.create(scene, Vector2(172, 150)))
		var kind := "Town mayor" if index == 0 else "Companion appearance"
		card.add_child(_label(kind, 12, MUTED))

func _objects_page() -> void:
	_heading("OBJECT LIBRARY", "Find a place for everything", "Preview each piece in 3D, then choose one to place on your island.")
	if not is_instance_valid(editor):
		content.add_child(_note("The object library is unavailable."))
		return
	var building := bool(editor.get("build_mode"))
	var wallet = editor.get("build_wallet")
	var wallet_ok := bool(wallet.load_wallet()) if building else true
	var balance := int(wallet.balance()) if building and wallet_ok else 0
	var banner := _card(content, Color("2d4839"))
	banner.add_child(_label("%s MODE" % ("BUILD" if building else "CHILL"), 12, GOLD))
	banner.add_child(_label("%d credits available" % balance if building and wallet_ok else (str(wallet.last_error) if building else "Every object is free to place"), 18, CREAM))
	var items: Array = editor.get("catalog_items")
	var sources: Dictionary = editor.get("authored_trees")
	if items.is_empty():
		content.add_child(_note("No objects are available in this town yet."))
		return
	var last_category := ""
	var grid: GridContainer
	for item in items:
		var category := String(item["category"])
		if category != last_category:
			content.add_child(_label(category.to_upper(), 13, GOLD))
			grid = _grid()
			last_category = category
		var card := _card(grid)
		card.add_child(_label(String(item["name"]), 16, CREAM))
		var source := sources.get(item["source_id"]) as UserTree
		var model := source.get_node_or_null("AuthoredModel") as Node3D if is_instance_valid(source) else null
		if model != null:
			card.add_child(PREVIEW.create(model.duplicate() as Node3D, Vector2(160, 118)))
		var price := int(item["price"])
		card.add_child(_label("%d credits" % price if building else "Free in Chill mode", 12, GOLD))
		var action := _button("Buy & place" if building else "Place on island", _place_object.bind(String(item["id"])), true)
		action.disabled = building and (not wallet_ok or balance < price)
		if action.disabled:
			action.tooltip_text = "Earn more credits to place this object"
		card.add_child(action)

func _grid() -> GridContainer:
	var grid := GridContainer.new()
	grid.columns = 3 if panel.size.x >= 850.0 else 2
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	content.add_child(grid)
	return grid

func _place_object(item_id: String) -> void:
	call("close_settings")
	editor.call("_start_catalog_item", item_id)
