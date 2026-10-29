extends Control
## Wildlife widgets and their layout; the coordinator supplies current records.
const Style = preload("res://ui/hud_style.gd")
const ARROWS := ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"]
var session: Node3D
var guides: Array = []
var captions: Array = []
var acknowledgements: Array = []
var role_labels := {}
var records := {}
var guide_rects := {}
var occupied: Array[Rect2] = []
var notice: Panel
var notice_title: Label
var notice_detail: Label
var notice_track: ColorRect
var notice_fill: ColorRect

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	for i in 3:
		guides.append(make_guide())
		var caption := panel(self, "fff8e9f5", 10, "e9d7b5", false)
		var text := label(caption, "", 11, "79521d")
		captions.append({"panel": caption, "label": text})
		var ack := panel(self, "fff8e9", 25, "e9d7b5", false)
		var rich := RichTextLabel.new()
		rich.mouse_filter = Control.MOUSE_FILTER_IGNORE
		rich.scroll_active = false
		rich.bbcode_enabled = false
		rich.add_theme_font_override("normal_font", Style.BODY)
		rich.add_theme_font_override("bold_font", Style.HEAVY)
		rich.add_theme_font_size_override("normal_font_size", 14)
		rich.add_theme_color_override("default_color", Color("716449"))
		ack.add_child(rich)
		rich.position = Vector2(0, 8)
		rich.size = Vector2(225, 25)
		acknowledgements.append({"panel": ack, "label": rich, "name": ""})

func panel(parent: Control, fill: String, radius: int, border: String, shadow := true) -> Panel:
	var node := Panel.new()
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var skin := Style.panel(fill, radius, border, false)
	if shadow:
		skin.shadow_color = Color("62492f66")
		skin.shadow_size = 1
		skin.shadow_offset = Vector2(0, 3)
	node.add_theme_stylebox_override("panel", skin)
	parent.add_child(node)
	node.hide()
	return node

func label(parent: Control, text: String, font_size: int, ink: String) -> Label:
	var node := Style.label(text, font_size)
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	node.add_theme_color_override("font_color", Color(ink))
	parent.add_child(node)
	return node

func color(parent: Control, value: String) -> ColorRect:
	var node := ColorRect.new()
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	node.color = Color(value)
	parent.add_child(node)
	return node

func make_guide() -> Dictionary:
	var frame := panel(self, "fff8e9f5", 18, "e9d7b5")
	var header := label(frame, "", 13, "4c402f")
	var rows: Array = []
	for i in 3:
		var row := Control.new()
		row.mouse_filter = Control.MOUSE_FILTER_IGNORE
		frame.add_child(row)
		var warm := panel(row, "f9e7df", 10, "f9e7df", false)
		(warm.get_theme_stylebox("panel") as StyleBoxFlat).set_border_width_all(0)
		var arrow := label(row, "", 22, "355b43")
		arrow.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		var name_label := label(row, "", 15, "355b43")
		var detail := label(row, "", 12, "355b43")
		var number := Style.title("", 23, "355b43")
		number.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		row.add_child(number)
		rows.append({"root": row, "warm": warm, "arrow": arrow, "name": name_label, "detail": detail, "number": number})
	return {"panel": frame, "header": header, "rows": rows}

func camera() -> Camera3D:
	return session.town.rig.camera

func narrow() -> bool:
	return size.x < 700 or size.y < 560

func update_guide(frame: Dictionary, group: Dictionary, rectangle: Rect2) -> void:
	var grouped: bool = group.rows.size() > 1 or narrow()
	var row_height := 38.0 if narrow() else 54.0
	frame.panel.position = rectangle.position
	frame.panel.size = rectangle.size
	var first: Dictionary = group.rows[0]
	var fill := "fff8e9f5" if grouped else "f9e7df" if first.priority < 2 else "fff8e9ed"
	frame.panel.get_theme_stylebox("panel").bg_color = Color(fill)
	frame.panel.get_theme_stylebox("panel").set_corner_radius_all(18 if grouped else 13)
	frame.header.visible = grouped
	frame.header.text = "Hidden wildlife · %d" % group.rows.size() if group.bearing < 0 else "%s Hidden this way · %d" % [ARROWS[group.bearing], group.rows.size()]
	frame.header.position = Vector2(16, 8 if narrow() else 12)
	frame.header.size = Vector2(rectangle.size.x - 32, 18)
	for i in frame.rows.size():
		var row: Dictionary = frame.rows[i]
		row.root.visible = i < group.rows.size()
		if i >= group.rows.size(): continue
		var record: Dictionary = group.rows[i]
		var inset := 7.0 if grouped and record.priority < 2 else 0.0
		var width: float = rectangle.size.x - 32
		row.root.position = Vector2(16, (28 if narrow() else 31 if grouped else 13) + i * row_height)
		row.root.size = Vector2(width, row_height)
		row.warm.visible = grouped and record.priority < 2
		row.warm.size = Vector2(width, row_height)
		var ink := "923e30" if record.priority < 2 else "79521d" if record.priority == 2 else "355b43"
		var status := "Critical" if record.priority == 0 else "Recent hit" if record.priority == 1 else "Enemy near" if record.priority == 2 else "Hidden"
		row.arrow.text = ARROWS[record.bearing]
		row.name.text = str(record.body.entry.name)
		row.detail.text = "%s · ≈%d m" % [status, roundi(record.distance)]
		row.number.text = "%d%%" % ceili(record.health)
		for node in [row.arrow, row.name, row.detail, row.number]: node.add_theme_color_override("font_color", Color(ink))
		row.arrow.position = Vector2(inset, 0)
		row.arrow.size = Vector2(22, row_height)
		row.name.position = Vector2(inset + 29, 0 if narrow() else 7)
		row.name.size = Vector2(140, 20)
		row.detail.position = Vector2(inset + 29, 20 if narrow() else 29)
		row.detail.size = Vector2(140, 16)
		row.number.position = Vector2(width - inset - 90, 0)
		row.number.size = Vector2(90, row_height)
		row.number.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

func update_caption(caption: Dictionary, record: Dictionary) -> void:
	caption.panel.visible = record.visible and record.health > 0 and (record.recent or record.near)
	if not caption.panel.visible: return
	caption.label.text = ("Recent hit · nearby enemy" if record.near else "Recent hit") if record.recent else "! Nearby enemy"
	caption.label.add_theme_color_override("font_color", Color("923e30" if record.recent else "79521d"))
	caption.panel.get_theme_stylebox("panel").bg_color = Color("f9e7df" if record.recent else "fff8e9f5")
	var width: float = Style.BODY.get_string_size(caption.label.text, HORIZONTAL_ALIGNMENT_LEFT, -1, 11).x + 18
	caption.panel.size = Vector2(width, 25)
	caption.label.position = Vector2(9, 4)
	caption.label.size = Vector2(width - 18, 17)
	var head: Vector2 = camera().unproject_position(record.body.head_position())
	# At the minimum, a long recent-hit pill must sit below, not over, health.
	var point := head + (Vector2(-190, 44) if narrow() else Vector2(-144, -4) if size.x < 860 else Vector2(-60, 44.5))
	caption.panel.position = Vector2(clampf(roundf(point.x), 16, size.x - width - 16), clampf(roundf(point.y), 16, size.y - 41))
	occupied.append(Rect2(caption.panel.position, caption.panel.size))

func update_out(bodies: Array) -> void:
	for i in acknowledgements.size():
		var ack: Dictionary = acknowledgements[i]
		ack.panel.visible = i < bodies.size()
		if i >= bodies.size(): continue
		var name_text: String = bodies[i].entry.name
		if ack.name != name_text:
			ack.name = name_text
			ack.label.clear()
			ack.label.push_paragraph(HORIZONTAL_ALIGNMENT_CENTER)
			ack.label.push_font(Style.HEAVY)
			ack.label.push_color(Color("4c402f"))
			ack.label.add_text(name_text)
			ack.label.pop()
			ack.label.pop()
			ack.label.add_text(" · Out")
			ack.label.pop()
		var top := size.y - (170 if size.x < 860 else 131) - i * 47
		if narrow():
			var guide_top := size.y - 88
			for guide in guides:
				if guide.panel.visible: guide_top = minf(guide_top, guide.panel.position.y)
			top = guide_top - 47 * (i + 1)
		ack.panel.position = Vector2((size.x - 225) * 0.5, top)
		ack.panel.size = Vector2(225, 39)
		occupied.append(Rect2(ack.panel.position, ack.panel.size))
