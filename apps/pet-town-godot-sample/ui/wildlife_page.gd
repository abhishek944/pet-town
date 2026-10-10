extends VBoxContainer
signal selected(id: String, source: Control)
const Palette = preload("res://ui/settings_style.gd")
var grid: GridContainer
var summary: Label
var cards := {}
var settings: Control

func _ready() -> void:
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	add_theme_constant_override("separation", 7)
	preload("res://ui/settings_content.gd").intro(self, "LITTLE NEIGHBOURS, BIG HEARTS", "Wildlife", "Check in on the wild friends who share your town.")
	summary = Palette.ink_label("", 11, Palette.QUIET)
	summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(summary)
	grid = GridContainer.new()
	grid.columns = 4
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	add_child(grid)
	resized.connect(_layout)

func set_data(entries: Array) -> void:
	var total := 0
	var low := 0
	for entry in entries:
		total += int(entry.count)
		if entry.happiness < 40: low += 1
		if not cards.has(entry.id):
			var card := preload("res://ui/wildlife_card.gd").new()
			grid.add_child(card)
			card.setup(entry)
			card.pressed.connect(func() -> void: selected.emit(entry.id, card))
			cards[entry.id] = card
		else: cards[entry.id].update_state(entry)
	summary.text = "%d species · %d wildlife" % [entries.size(), total]
	if low > 0: summary.text += " · %d species could use company" % low
	_layout()

func _layout() -> void:
	if not grid: return
	var width := size.x
	if is_instance_valid(settings):
		width = settings.card.size.x - (182 if settings.size.x >= 700 else 2)
		width -= settings.body_margin.get_theme_constant("margin_left") + settings.body_margin.get_theme_constant("margin_right")
	var columns := clampi(int((width + 8) / 135), 1, 4)
	if grid.columns != columns:
		grid.columns = columns
		if is_instance_valid(settings): settings.layout.call_deferred()

func _process(_delta: float) -> void:
	if is_visible_in_tree(): _layout()
