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
var hints: Label
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
	hints = Layout.label(self, "WASD move · Shift run · Space jump · Shooting is automatic", Rect2(-225, -53, 450, 34), 12)
	hints.anchor_left = 0.5
	hints.anchor_right = 0.5
	hints.anchor_top = 1
	hints.anchor_bottom = 1
	hints.offset_left = -225
	hints.offset_right = 225
	hints.offset_top = -53
	hints.offset_bottom = -19
	hints.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hints.add_theme_stylebox_override("normal", Style.panel("fff8e9de", 20, "fff8e9de", false))
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

func refresh() -> void:
	if not is_instance_valid(session.avatar): return
	var remaining := ceili(300 - session.elapsed)
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
	hints.visible = size.x >= 980
	for record in health_marks:
		var point: Vector3 = record.body.head_position() + Vector3.UP * 0.35
		record.mark.visible = record.body.health.value < 100 and not session.town.rig.camera.is_position_behind(point)
		record.mark.position = session.town.rig.camera.unproject_position(point) - Vector2(38, 20)
		record.bar.value = record.body.health.value
		record.label.text = str(record.body.entry.name) + (" · Out" if record.body.health.value <= 0 else " · %d%%" % ceili(record.body.health.value))
