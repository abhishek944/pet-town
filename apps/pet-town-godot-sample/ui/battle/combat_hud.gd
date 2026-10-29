extends Control
const Layout = preload("layout.gd")
const Style = preload("res://ui/hud_style.gd")
var session: Node3D
var health: Label
var health_bar: ProgressBar
var timer: Label
var kills: Label
var animals: Label
var condition: Label
var countdown: Label
var awareness: Control
var health_marks: Array = []
var cards: Array[Control] = []
var pause_button: Button

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var card := Layout.panel(self, Rect2(24, 24, 260, 100))
	cards.append(card)
	card.add_child(Style.portrait({"petId": "maple"}, Vector2(60, 60)))
	Style.position(card.get_child(0), Rect2(14, 20, 60, 60))
	Layout.label(card, "Maple · Health", Rect2(88, 10, 158, 20), 13)
	health = Layout.label(card, "100 / 100", Rect2(88, 30, 155, 34), 25, true)
	health_bar = Layout.bar(card, 100, Rect2(88, 73, 152, 9))
	card = Layout.panel(self, Rect2(-90, 24, 180, 114), Vector2(0.5, 0))
	cards.append(card)
	Layout.label(card, "Battle Mode", Rect2(0, 10, 180, 20), 13).horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	timer = Layout.label(card, "05:00", Rect2(0, 30, 180, 42), 32, true)
	timer.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	timer.add_theme_color_override("font_color", Color("355b43"))
	Layout.label(card, "Time remaining", Rect2(0, 80, 180, 20), 12).horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var pause := Layout.button(self, "Ⅱ Pause   Esc", "pause", session.command)
	pause_button = pause
	pause.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	pause.offset_left = -180
	pause.offset_right = -24
	pause.offset_top = 24
	pause.offset_bottom = 68
	card = Layout.panel(self, Rect2(24, -120, 200, 92), Vector2(0, 1))
	cards.append(card)
	Layout.label(card, "Skeletons defeated", Rect2(16, 10, 174, 20), 13)
	kills = Layout.label(card, "0", Rect2(16, 34, 160, 45), 32, true)
	kills.add_theme_color_override("font_color", Color("355b43"))
	card = Layout.panel(self, Rect2(-322, -120, 298, 92), Vector2(1, 1))
	cards.append(card)
	animals = Layout.label(card, "Wildlife · 3 of 3 standing", Rect2(16, 12, 266, 22), 13)
	condition = Layout.label(card, "100%   100%   100%", Rect2(16, 42, 266, 28), 17)
	# guide-ui:B5 removes only the instruction strip, not input or automatic fire.
	awareness = preload("awareness.gd").new()
	awareness.session = session
	add_child(awareness)
	Layout.full(awareness)
	countdown = Style.title("3", 96, "fff8e9")
	add_child(countdown)
	Layout.full(countdown)
	countdown.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	countdown.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	for animal in session.animals:
		var mark := VBoxContainer.new()
		mark.mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_child(mark)
		var label := Layout.text(mark, str(animal.entry.name), 12)
		label.add_theme_color_override("font_color", Color("fff8e9"))
		var bar := Layout.bar(mark, 100, Rect2(0, 0, 75, 8))
		bar.custom_minimum_size = Vector2(75, 8)
		health_marks.append({"body": animal, "mark": mark, "label": label, "bar": bar})
	resized.connect(layout)
	layout()

func warning_mode(source: Node3D, victim: Node3D, aim: Vector3) -> String:
	return awareness.warning_mode(source, victim, aim)

func warning_available(info: Dictionary) -> bool:
	return awareness.warning_available(info)

func offsets(node: Control, rectangle: Rect2) -> void:
	node.offset_left = rectangle.position.x
	node.offset_top = rectangle.position.y
	node.offset_right = rectangle.end.x
	node.offset_bottom = rectangle.end.y

func layout() -> void:
	if cards.size() < 4: return
	var compact := size.x < 860
	cards[1].anchor_left = 0 if compact else 0.5
	cards[1].anchor_right = cards[1].anchor_left
	offsets(cards[0], Rect2(16 if compact else 24, 16 if compact else 24, 260, 100))
	offsets(cards[1], Rect2(16, 128, 180, 114) if compact else Rect2(-90, 24, 180, 114))
	offsets(pause_button, Rect2(-172 if compact else -180, 128 if size.x < 500 else 16 if compact else 24, 156, 44))
	offsets(cards[2], Rect2(16 if compact else 24, -222 if size.x < 570 else -120, 200, 92))
	offsets(cards[3], Rect2(-314 if compact else -322, -120, 298, 92))
	if size.x < 700 or size.y < 560:
		# Narrow-only reflow keeps the selected guide type and all essential values.
		# The regular 800/1280 layouts and the camera/window minimum are unchanged.
		offsets(cards[0], Rect2(12, 12, 230, 84))
		Style.position(cards[0].get_child(0), Rect2(12, 12, 60, 60))
		Style.position(cards[0].get_child(1), Rect2(82, 4, 140, 20))
		Style.position(health, Rect2(82, 24, 140, 34))
		Style.position(health_bar, Rect2(82, 64, 132, 9))
		cards[1].anchor_left = 0
		cards[1].anchor_right = 0
		offsets(cards[1], Rect2(254, 12, size.x - 266, 84))
		Style.position(cards[1].get_child(0), Rect2(0, 4, cards[1].size.x, 20))
		Style.position(timer, Rect2(0, 22, cards[1].size.x, 40))
		Style.position(cards[1].get_child(2), Rect2(0, 62, cards[1].size.x, 18))
		offsets(pause_button, Rect2(-168, 108, 156, 44))
		offsets(cards[2], Rect2(12, 104 - size.y, 200, 52))
		Style.position(cards[2].get_child(0), Rect2(12, 3, 180, 20))
		Style.position(kills, Rect2(12, 22, 174, 30))
		kills.add_theme_font_size_override("font_size", 25)
		offsets(cards[3], Rect2(12 - size.x, -76, size.x - 24, 64))
		Style.position(animals, Rect2(16, 4, cards[3].size.x - 32, 22))
		Style.position(condition, Rect2(16, 30, cards[3].size.x - 32, 28))
	else:
		# Restore internal positions as well as outer anchors when widening again.
		Style.position(cards[0].get_child(0), Rect2(14, 20, 60, 60))
		Style.position(cards[0].get_child(1), Rect2(88, 10, 158, 20))
		Style.position(health, Rect2(88, 30, 155, 34))
		Style.position(health_bar, Rect2(88, 73, 152, 9))
		Style.position(cards[1].get_child(0), Rect2(0, 10, 180, 20))
		Style.position(timer, Rect2(0, 30, 180, 42))
		Style.position(cards[1].get_child(2), Rect2(0, 80, 180, 20))
		Style.position(cards[2].get_child(0), Rect2(16, 10, 174, 20))
		Style.position(kills, Rect2(16, 34, 160, 45))
		kills.add_theme_font_size_override("font_size", 32)
		Style.position(animals, Rect2(16, 12, 266, 22))
		Style.position(condition, Rect2(16, 42, 266, 28))

func refresh() -> void:
	if not is_instance_valid(session.avatar): return
	var remaining := maxi(0, ceili(session.duration - session.elapsed))
	timer.text = "%02d:%02d" % [remaining / 60, remaining % 60]
	health.text = "%d / 100" % ceili(session.avatar.health.value)
	health_bar.value = session.avatar.health.value
	kills.text = str(session.kills)
	var standing := 0
	var values: PackedStringArray = []
	for animal in session.animals:
		if animal.health.value > 0: standing += 1
		values.append("%d%%" % ceili(animal.health.value) if animal.health.value > 0 else "× Out")
	animals.text = "Wildlife · %d of %d standing" % [standing, session.animals.size()]
	condition.text = "   ".join(values)
	countdown.visible = session.state == "Countdown"
	countdown.text = str(ceili(session.countdown))
	awareness.refresh()
	for record in health_marks:
		var point: Vector3 = record.body.head_position() + Vector3.UP * 0.35
		record.mark.visible = awareness.health_visible(record.body)
		record.mark.position = session.town.rig.camera.unproject_position(point) - Vector2(38, 20)
		record.bar.value = record.body.health.value
		record.label.text = str(record.body.entry.name) + (" · Out" if record.body.health.value <= 0 else " · %d%%" % ceili(record.body.health.value))
