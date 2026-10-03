extends Control

signal selected(index: int)
const Style = preload("res://ui/hud_style.gd")
const KEYS := ["grass", "dirt", "stone", "sand", "planks", "log", "brick", "glass", "roof", "leaves", "flower", "lantern"]
const NAMES := ["Grass", "Soil", "Cobblestone", "Sand", "Wood Planks", "Log", "Brick", "Glass", "Roof Tile", "Leafy Block", "Flower Bed", "Lantern"]
var slots: Array[Button] = []
var selected_index := 0
var name_label: Label
var name_panel: PanelContainer
var tray: Panel

func _ready() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	tray = Panel.new()
	var tray_style := StyleBoxTexture.new()
	tray_style.texture = load("res://ui/icons/hotbar.svg")
	tray.add_theme_stylebox_override("panel", tray_style)
	tray.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	tray.offset_left = -298
	tray.offset_right = 298
	tray.offset_top = -87
	tray.offset_bottom = -18
	add_child(tray)
	tray.gui_input.connect(wheel_select)
	for i in range(12):
		var slot := Style.button("", Vector2(43, 45))
		slot.tooltip_text = NAMES[i]
		slot.position = Vector2(13 + i * 48, 10)
		slot.size = Vector2(43, 45)
		tray.add_child(slot)
		var texture_path: String = "res://ui/icons/%s.png" % KEYS[i]
		if ResourceLoader.exists(texture_path):
			var picture := TextureRect.new()
			picture.texture = load(texture_path)
			picture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			picture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
			picture.mouse_filter = MOUSE_FILTER_IGNORE
			Style.position(picture, Rect2(5, 7, 32, 32))
			slot.add_child(picture)
		var number := Style.label(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="][i], 9)
		number.position = Vector2(4, 1)
		slot.add_child(number)
		slot.pressed.connect(func() -> void: selected.emit(i))
		slots.append(slot)
	name_panel = PanelContainer.new()
	name_panel.add_theme_stylebox_override("panel", Style.panel("fff8e9eb", 20, "fff8e900", false))
	name_panel.mouse_filter = MOUSE_FILTER_IGNORE
	name_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	name_label = Style.label("Grass", 12)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_panel.add_child(name_label)
	add_child(name_panel)
	resized.connect(layout)
	layout()
	set_selected(0)

func set_selected(index: int) -> void:
	selected_index = clampi(index, 0, 11)
	for i in slots.size():
		var active := i == selected_index
		var normal := Style.panel("fff7df" if active else "f2e2c3", 9, "fff8e1" if active else "d8bf97", false)
		normal.set_border_width_all(2 if active else 1)
		if active:
			normal.shadow_color = Color("496b44")
			normal.shadow_size = 2
			normal.shadow_offset = Vector2.ZERO
		slots[i].add_theme_stylebox_override("normal", normal)
		slots[i].position.y = 6 if active else 10
	if name_label:
		name_label.text = NAMES[selected_index]
		var width := maxf(60, Style.BODY.get_string_size(name_label.text, HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x + 30)
		name_panel.offset_left = -width / 2
		name_panel.offset_right = width / 2
		name_panel.offset_top = -133
		name_panel.offset_bottom = -97

func layout() -> void:
	if not tray: return
	var slot_width := clampf((size.x - 104) / 12, 24, 43) if size.x < 700 else 43.0
	var gap := 3.0 if size.x < 700 else 5.0
	var tray_width := 26 + slot_width * 12 + gap * 11
	tray.offset_left = -tray_width / 2
	tray.offset_right = tray_width / 2
	for index in slots.size():
		slots[index].position.x = 13 + index * (slot_width + gap)
		slots[index].custom_minimum_size.x = slot_width
		slots[index].size.x = slot_width
		for child in slots[index].get_children():
			if child is TextureRect:
				child.size = Vector2(minf(32, slot_width * .9), minf(32, slot_width * .9))
				child.position.x = (slot_width - child.size.x) / 2

func wheel_select(event: InputEvent) -> void:
	if not event is InputEventMouseButton or not event.pressed: return
	if event.button_index not in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN]: return
	selected.emit(posmod(selected_index + (1 if event.button_index == MOUSE_BUTTON_WHEEL_DOWN else -1), 12))
	accept_event()
