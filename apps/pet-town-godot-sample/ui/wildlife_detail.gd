extends ColorRect
signal find_requested(id: String)
const Palette = preload("res://ui/settings_style.gd")
const Style = preload("res://ui/hud_style.gd")
var card: Panel
var scroll: ScrollContainer
var margin: MarginContainer
var columns: GridContainer
var art: VBoxContainer
var portrait: Control
var habitat: Label
var details: VBoxContainer
var title: Label
var blurb: Label
var score: Label
var mood: Label
var meter: ProgressBar
var note: Label
var find: Button
var status: Label
var close: Button
var selected_id := ""
var return_focus: Control

func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	color = Color("263f3259")
	card = Panel.new()
	card.add_theme_stylebox_override("panel", Palette.card())
	add_child(card)
	scroll = ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER
	scroll.follow_focus = true
	card.add_child(scroll)
	margin = MarginContainer.new()
	margin.size_flags_horizontal = SIZE_EXPAND_FILL
	for side in ["left", "right", "top", "bottom"]: margin.add_theme_constant_override("margin_" + side, 24)
	scroll.add_child(margin)
	columns = GridContainer.new()
	columns.columns = 2
	columns.size_flags_horizontal = SIZE_EXPAND_FILL
	columns.add_theme_constant_override("h_separation", 25)
	columns.add_theme_constant_override("v_separation", 12)
	margin.add_child(columns)
	art = VBoxContainer.new()
	art.alignment = BoxContainer.ALIGNMENT_CENTER
	art.custom_minimum_size.x = 260
	columns.add_child(art)
	portrait = preload("res://ui/wildlife_portrait.gd").new()
	portrait.custom_minimum_size = Vector2(1, 210)
	art.add_child(portrait)
	habitat = _label(11)
	habitat.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	art.add_child(habitat)
	details = VBoxContainer.new()
	details.size_flags_horizontal = SIZE_EXPAND_FILL
	details.add_theme_constant_override("separation", 7)
	columns.add_child(details)
	title = Style.title("", 28, Palette.INK)
	details.add_child(title)
	blurb = _label(12)
	details.add_child(blurb)
	score = Style.title("", 30, Palette.INK)
	var score_row := HBoxContainer.new()
	details.add_child(score_row)
	score_row.add_child(score)
	var units := Palette.ink_label("/ 100 happiness", 12, Palette.QUIET)
	units.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	score_row.add_child(units)
	mood = _label(12)
	details.add_child(mood)
	meter = ProgressBar.new()
	meter.show_percentage = false
	meter.custom_minimum_size.y = 6
	meter.add_theme_stylebox_override("background", Palette.box("e6e9db", "", 3, 0, 0, 0, 0))
	details.add_child(meter)
	note = _label(11)
	details.add_child(note)
	find = Palette.action("Find", true)
	find.pressed.connect(func() -> void: find_requested.emit(selected_id))
	details.add_child(find)
	status = _label(10)
	details.add_child(status)
	close = Palette.close_button()
	close.accessibility_name = "Close wildlife details"
	close.custom_minimum_size.x = 44
	close.pressed.connect(dismiss)
	card.add_child(close)
	resized.connect(layout)
	layout()
	hide()

func _label(font_size: int) -> Label:
	var label := Palette.ink_label("", font_size, Palette.QUIET)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return label

func open_entry(entry: Dictionary, source: Control) -> void:
	selected_id = entry.id
	return_focus = source
	title.text = entry.name
	blurb.text = entry.blurb
	portrait.set_entry(entry)
	note.text = "Pet any %s to restore the whole species to 100." % entry.name
	find.text = "Find a %s" % entry.name
	refresh(entry)
	show()
	layout()
	close.grab_focus.call_deferred()

func refresh(entry: Dictionary) -> void:
	score.text = str(entry.happiness)
	mood.text = entry.mood + (" · Could use some company" if entry.happiness < 40 else "")
	mood.add_theme_color_override("font_color", Color("86532f" if entry.happiness < 40 else Palette.SAGE_INK))
	meter.value = entry.happiness
	meter.add_theme_stylebox_override("fill", Palette.box("c39769" if entry.happiness < 40 else "8da477", "", 3, 0, 0, 0, 0))
	habitat.text = "%d in town · %s" % [entry.count, entry.habitat]
	find.disabled = entry.count == 0 or entry.get("following", false)
	status.text = str(entry.get("findStatus", ""))
	find.accessibility_description = status.text

func dismiss(restore := true) -> void:
	hide()
	if restore and is_instance_valid(return_focus) and return_focus.is_visible_in_tree(): return_focus.grab_focus()

func handle_input(event: InputEvent) -> void:
	if not visible: return
	if event.is_action_pressed("ui_cancel") or (event is InputEventKey and event.pressed and event.keycode in [KEY_H, KEY_J, KEY_K, KEY_P]):
		dismiss()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("ui_focus_next") or event.is_action_pressed("ui_focus_prev") or event.is_action_pressed("ui_left") or event.is_action_pressed("ui_right") or event.is_action_pressed("ui_up") or event.is_action_pressed("ui_down"):
		var target := find if close.has_focus() and not find.disabled else close
		target.grab_focus()
		get_viewport().set_input_as_handled()

func layout() -> void:
	if not card: return
	var narrow := size.x < 620
	card.size = Vector2(minf(660, maxf(0, size.x - 28)), minf(344.5 if not narrow else 540, maxf(0, size.y - 28)))
	card.position = (size - card.size) / 2
	scroll.position = Vector2.ZERO
	scroll.size = card.size
	columns.columns = 1 if narrow else 2
	art.custom_minimum_size.x = 0 if narrow else 260
	art.size_flags_horizontal = SIZE_EXPAND_FILL if narrow else SIZE_FILL
	portrait.custom_minimum_size.y = 130 if narrow else 210
	close.position = Vector2(card.size.x - 56, 12)
	close.size = Vector2(44, 44)
	close.focus_next = close.get_path_to(find) if not find.disabled else NodePath(".")
	find.focus_next = find.get_path_to(close)
	close.focus_previous = close.focus_next
	find.focus_previous = find.focus_next
	for direction in ["left", "right", "top", "bottom"]:
		close.set("focus_neighbor_" + direction, close.focus_next)
		find.set("focus_neighbor_" + direction, find.focus_next)
