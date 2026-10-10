extends VBoxContainer

signal back_requested
signal action_requested(id: String, action: String, payload: Dictionary)
const Palette = preload("res://ui/settings_style.gd")
const Style = preload("res://ui/hud_style.gd")
var catalog: Array = []
var target_id := ""
var current_id := ""
var draft := ""
var angle := 0.0
var preview: SubViewportContainer
var name_label: Label
var species: Label
var description: Label
var trait_label: Label
var notice: Label
var apply: Button
var grid: GridContainer
var colors: HBoxContainer

func _ready() -> void:
	add_theme_constant_override("separation", 12)
	var back := Palette.action("← Companion controls")
	back.pressed.connect(func() -> void: back_requested.emit())
	add_child(back)
	preload("res://ui/settings_content.gd").intro(self, "A FRIEND TO CALL YOUR OWN", "Choose a pet", "Woodland + adventurers · Friends for every journey.")
	var stage := HFlowContainer.new()
	stage.add_theme_constant_override("h_separation", 18)
	add_child(stage)
	var left := VBoxContainer.new()
	left.custom_minimum_size.x = 270
	stage.add_child(left)
	var right := VBoxContainer.new()
	right.custom_minimum_size.x = 300
	right.size_flags_horizontal = SIZE_EXPAND_FILL
	stage.add_child(right)
	preview = preload("res://ui/library_preview.gd").new()
	preview.custom_minimum_size = Vector2(270, 200)
	left.add_child(preview)
	var turn := Palette.action("↻ Turn around")
	turn.pressed.connect(func() -> void:
		angle += PI / 2
		select_pet(draft))
	left.add_child(turn)
	species = Style.text("", 11, "7b8955")
	name_label = Style.title("", 23, "3d613f")
	description = Style.text("", 12)
	description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	trait_label = Style.text("", 11, "7b8955")
	for node in [species, name_label, description, trait_label]: right.add_child(node)
	colors = HBoxContainer.new()
	right.add_child(colors)
	apply = Palette.action("Use pet", true)
	apply.pressed.connect(func() -> void: action_requested.emit(target_id, "pet", {"petId": draft}))
	right.add_child(apply)
	notice = Style.text("", 11)
	notice.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	right.add_child(notice)
	grid = GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	add_child(grid)
	add_child(Style.text("Choose a card to preview. Your companion keeps its name and work status.", 11))
	resized.connect(func() -> void: grid.columns = 2 if size.x < 600 else 4)

func setup(entries: Array, id: String, pet_id: String) -> void:
	catalog = entries
	target_id = id
	current_id = pet_id
	Style.clear(grid)
	for pet in catalog:
		var card := Palette.action("")
		card.set_meta("pet_id", pet.id)
		card.custom_minimum_size = Vector2(130, 125)
		card.size_flags_horizontal = SIZE_EXPAND_FILL
		var content := VBoxContainer.new()
		content.mouse_filter = MOUSE_FILTER_IGNORE
		content.add_theme_constant_override("separation", 2)
		content.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
		content.offset_left = 6
		content.offset_right = -6
		content.offset_top = 6
		content.offset_bottom = -6
		card.add_child(content)
		var portrait := TextureRect.new()
		var file: String = "res://assets/" + str(pet.get("portraitFile", "companion-%s.png" % pet.id))
		if ResourceLoader.exists(file): portrait.texture = load(file)
		portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		portrait.custom_minimum_size.y = 68
		portrait.mouse_filter = MOUSE_FILTER_IGNORE
		content.add_child(portrait)
		for label in [Style.label(pet.name, 13), Style.text(pet.species, 10)]:
			label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
			content.add_child(label)
		card.pressed.connect(func() -> void: select_pet(pet.id))
		grid.add_child(card)
	if not catalog.is_empty():
		var valid: bool = catalog.any(func(entry: Dictionary) -> bool: return str(entry.id) == pet_id)
		select_pet(pet_id if valid else catalog[0].id)

func select_pet(id: String) -> void:
	for pet in catalog:
		if pet.id != id: continue
		draft = id
		for card in grid.get_children():
			preload("res://ui/atmosphere_style.gd").selected(card, str(card.get_meta("pet_id")) == id)
		name_label.text = pet.name
		species.text = pet.species
		description.text = pet.description
		trait_label.text = pet.get("trait", "")
		Style.clear(colors)
		for color in pet.colors:
			var dot := ColorRect.new()
			dot.color = Color(color)
			dot.custom_minimum_size = Vector2(15, 15)
			colors.add_child(dot)
		preview.show_asset({"path": pet.get("path", "res://assets/" + str(pet.get("modelFile", "companion-%s.glb" % id))), "animation": "idle"}, angle)
		apply.text = "Current pet" if id == current_id else "Use " + str(pet.name)
		apply.disabled = target_id.is_empty() or _is_mayor() or id == current_id
		notice.text = "Mayor keeps his original appearance." if _is_mayor() else "Choose a companion in Companion controls to use a pet." if target_id.is_empty() else "Preview for your selected companion."
		return

func validate_target(selected: String, entries: Array) -> void:
	var valid := selected == target_id and entries.any(func(entry: Dictionary) -> bool: return str(entry.id) == target_id)
	if valid:
		for entry in entries:
			if str(entry.id) == target_id: current_id = str(entry.get("petId", ""))
		apply.text = "Current pet" if draft == current_id else "Use " + name_label.text
	apply.disabled = not valid or _is_mayor() or draft == current_id
	if not valid and not target_id.is_empty(): notice.text = "Your companion changed or left. Go back and choose a companion again."

func _is_mayor() -> bool:
	return target_id == "pet-town-mayor" or current_id == "mayor"
