extends "res://scripts/ui_agent.gd"

func _refresh_library() -> void:
	if not is_instance_valid(library_list):
		return
	_clear(library_list)
	library_heading.text = "%s island" % town_mode.capitalize()
	balance_panel.visible = town_mode == "build"
	for item in catalog.items:
		_add_card(library_list, item)

func _add_card(parent: VBoxContainer, item: Dictionary) -> void:
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", _style(Color("29483a"), 12, Color("496958")))
	parent.add_child(card)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	card.add_child(row)
	var picture := TextureRect.new()
	picture.custom_minimum_size = Vector2(70, 66)
	picture.texture = load(String(item["thumbnail"])) as Texture2D
	picture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	picture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	row.add_child(picture)
	var details := VBoxContainer.new()
	details.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(details)
	details.add_child(_label(String(item["name"]), 15, CREAM))
	var summary := String(item["category"])
	if town_mode == "build":
		summary += "  ·  %s credits" % _number(int(item["price"]))
	details.add_child(_label(summary, 12, GOLD))
	var place := _button("Buy" if town_mode == "build" else "+")
	place.custom_minimum_size = Vector2(39, 39)
	place.tooltip_text = "Place %s" % item["name"]
	place.disabled = town_mode == "build" and wallet.balance() < int(item["price"])
	if place.disabled:
		place.tooltip_text = "Earn more credits to buy %s" % item["name"]
	place.pressed.connect(func() -> void: place_requested.emit(String(item["id"])))
	row.add_child(place)

