extends "res://scripts/town_settings_pages.gd"

func _companions_page() -> void:
	_heading("COMPANION GALLERY", "Meet the town's 3D companions", "See every available look in 3D. Live agents take on these appearances when they visit.")
	if pet_scenes.is_empty():
		content.add_child(_note("No companion models are installed yet."))
		return
	if selected_pet >= 0 and selected_pet < pet_scenes.size():
		_companion_details(selected_pet)
	var grid := _grid()
	for index in pet_scenes.size():
		var card := _card(grid)
		card.add_child(_label("%02d  %s" % [index + 1, pet_names[index]], 17, CREAM))
		var scene := pet_scenes[index] as PackedScene
		if scene != null:
			card.add_child(PREVIEW.create_scene(scene, "pet:%s" % scene.resource_path, Vector2(172, 150)))
		var kind := "Town mayor" if index == 0 else "Companion appearance"
		card.add_child(_label(kind, 12, MUTED))
		card.add_child(_button("View details", _view_companion.bind(index), true))

func _view_companion(index: int) -> void:
	selected_pet = index
	_show_section()

func _companion_details(index: int) -> void:
	var detail := _card(content, Color("2d4839"))
	detail.add_child(_label(pet_names[index], 22, CREAM))
	detail.add_child(PREVIEW.create_scene(pet_scenes[index], "pet:detail:%d" % index, Vector2(250, 225)))
	detail.add_child(_label("Town mayor" if index == 0 else "Companion appearance", 14, MUTED))
	var records: Dictionary = host.get("agents_by_id") if is_instance_valid(host) else {}
	var residents := 0
	for agent_id in records:
		var model_index := 0 if String(agent_id) == "pet-town-mayor" else int(host.call("_model_index", String(agent_id)))
		if model_index != index:
			continue
		residents += 1
		var record: Dictionary = records[agent_id]
		detail.add_child(_button("Open %s's agent details" % String(record.get("label", "Companion")), _open_agent_details.bind(String(agent_id))))
	if residents == 0:
		detail.add_child(_note("No live agent is using this appearance right now."))

func _open_agent_details(agent_id: String) -> void:
	var pets: Dictionary = host.get("pets_by_id")
	var pet := pets.get(agent_id) as CharacterBody3D
	if not is_instance_valid(pet):
		return
	call("close_settings")
	host.call("_follow_pet", pet)
	host.call("_open_details")

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
			card.add_child(PREVIEW.create_model(model, "object:%s" % String(item["id"]), Vector2(160, 118)))
		var price := int(item["price"])
		if building:
			card.add_child(_label("%d credits" % price, 12, GOLD))
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
