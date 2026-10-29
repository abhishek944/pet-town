extends "awareness_widgets.gd"
## Passive visibility and warning eligibility, driven by the active session clock.
class DangerSign extends Control:
	func _draw() -> void:
		draw_arc(Vector2(10, 10), 9, 0, TAU, 48, Color("a46c22"), 1.5, true)
		var font = preload("res://ui/fonts/nunito-800.ttf")
		var width: float = font.get_string_size("!", HORIZONTAL_ALIGNMENT_LEFT, -1, 16).x
		draw_string(font, Vector2(10 - width * 0.5, 16), "!", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("62421c"))

func _ready() -> void:
	super._ready()
	notice = panel(self, "fff2d3", 13, "d5a14d")
	var sign := DangerSign.new()
	notice.add_child(sign)
	sign.position = Vector2(13, 11)
	sign.size = Vector2(20, 20)
	notice_title = label(notice, "", 13, "62421c")
	notice_title.position = Vector2(42, 8)
	notice_title.size = Vector2(199, 20)
	notice_detail = label(notice, "", 12, "79521d")
	notice_detail.position = Vector2(42, 26)
	notice_detail.size = Vector2(199, 19)
	notice_track = color(notice, "e8d6ac")
	notice_track.position = Vector2(12, 50)
	notice_track.size = Vector2(230, 3)
	notice_fill = color(notice_track, "c58b30")
	notice_fill.size = Vector2(115, 3)
	notice.hide()

func actor_visible(body: Node3D) -> bool:
	if not is_instance_valid(body) or not is_instance_valid(camera()): return false
	var point: Vector3 = body.head_position() if body.has_method("head_position") else body.global_position + Vector3.UP * 1.7
	if camera().is_position_behind(point): return false
	if not Rect2(Vector2.ZERO, size).has_point(camera().unproject_position(point)): return false
	var head_clear: bool = session.arena.visible_line(camera().global_position, point)
	var body_clear: bool = session.arena.visible_line(camera().global_position, body.global_position + Vector3.UP * 0.35)
	return head_clear and body_clear if body.has_method("head_position") else head_clear or body_clear

func bearing(point: Vector3) -> int:
	var delta: Vector3 = point - session.avatar.global_position
	var right := camera().global_basis.x
	right.y = 0
	var back := camera().global_basis.z
	back.y = 0
	var vector := Vector2(delta.dot(right.normalized()), delta.dot(back.normalized()))
	if vector.length() < 0.5: vector = Vector2(0, -1 if delta.y > 0 else 1)
	return (roundi(atan2(vector.y, vector.x) / (PI / 4)) + 8) % 8

func enemy_near(body: Node3D) -> bool:
	for enemy in session.enemies:
		if is_instance_valid(enemy) and enemy.health.value > 0 and enemy.global_position.distance_to(body.global_position) < 6: return true
	return false

func before(a: Dictionary, b: Dictionary) -> bool:
	if a.priority != b.priority: return a.priority < b.priority
	if a.health != b.health: return a.health < b.health
	return a.distance < b.distance

func essential_rects() -> Array[Rect2]:
	# Use the owning HUD's real reflow, rather than stale duplicate corner estimates.
	var rectangles: Array[Rect2] = []
	for card in get_parent().cards:
		rectangles.append(Rect2(card.global_position - global_position, card.size))
	var pause: Control = get_parent().pause_button
	rectangles.append(Rect2(pause.global_position - global_position, pause.size))
	return rectangles

func clear_rect(rectangle: Rect2, obstacles: Array[Rect2]) -> bool:
	if rectangle.position.x < 8 or rectangle.position.y < 8 or rectangle.end.x > size.x - 8 or rectangle.end.y > size.y - 8: return false
	for other in obstacles:
		if rectangle.grow(3).intersects(other): return false
	return true

func guide_rectangle(index: int, count: int, obstacles: Array[Rect2]) -> Rect2:
	var compact := size.x < 860
	var width := 254.0 if compact or count == 1 else 270.0
	var height := 80.0 if count == 1 else 44.0 + 54 * count
	var left := index in [3, 4, 5]
	var x := 16.0 if compact else 24.0
	if not left: x = size.x - x - width
	var y := (385.0 if left else 80.0) if compact else size.y * 0.5 + (80 if left else 10)
	if count > 1:
		y = 64 if compact else size.y * 0.5 - 15
		if not compact: y = minf(y, size.y - 120 - 8 - 59 - 8 - height)
	var desired := Rect2(x, y, width, height)
	# Extra bearing groups use bounded alternate pockets, never a collapsed '+1' row.
	var alternatives: Array[Rect2] = [desired, Rect2(16, 252, width, height),
		Rect2(size.x - width - 16, 80, width, height), Rect2(16, size.y - height - 128, width, height),
		Rect2((size.x - width) * 0.5, size.y * 0.5 + 34, width, height)]
	for candidate in alternatives:
		if clear_rect(candidate, obstacles): return candidate
	return desired

func refresh() -> void:
	if not is_instance_valid(session.avatar) or size.x <= 0: return
	records.clear()
	guide_rects.clear()
	occupied = essential_rects()
	var groups := {}
	var out: Array = []
	for i in session.animals.size():
		var body: Node3D = session.animals[i]
		var recent: bool = body.health.recent_hit > 0
		var near := enemy_near(body)
		var priority := 0 if body.health.value <= 25 else 1 if recent else 2 if near else 3
		var record := {"body": body, "health": float(body.health.value), "distance": session.avatar.global_position.distance_to(body.global_position),
			"priority": priority, "recent": recent, "near": near, "visible": actor_visible(body), "bearing": bearing(body.global_position)}
		records[body.get_instance_id()] = record
		if body.health.value <= 0:
			if session.elapsed - body.out_at >= 0 and session.elapsed - body.out_at < 2: out.append(body)
		elif not record.visible:
			if not groups.has(record.bearing): groups[record.bearing] = []
			groups[record.bearing].append(record)
		update_caption(captions[i], record)
	var ordered: Array = []
	for index in groups:
		groups[index].sort_custom(before)
		var first: Dictionary = groups[index][0]
		ordered.append({"bearing": index, "rows": groups[index], "priority": first.priority, "health": first.health, "distance": first.distance})
	ordered.sort_custom(before)
	if narrow() and not ordered.is_empty():
		# One honest list fits the supported minimum; every named row keeps its own
		# bearing. Never label mixed bearings 'this way' or silently drop a body.
		var rows: Array = []
		for group in ordered: rows.append_array(group.rows)
		rows.sort_custom(before)
		ordered = [{"bearing": ordered[0].bearing if ordered.size() == 1 else -1, "rows": rows}]
	for i in guides.size():
		var frame: Dictionary = guides[i]
		frame.panel.visible = i < ordered.size()
		if i >= ordered.size(): continue
		var group: Dictionary = ordered[i]
		var rectangle := Rect2(12, size.y - 88 - (40 + 38 * group.rows.size()), size.x - 24, 40 + 38 * group.rows.size()) if narrow() else guide_rectangle(group.bearing, group.rows.size(), occupied)
		occupied.append(rectangle)
		update_guide(frame, group, rectangle)
		for record in group.rows: guide_rects[record.body.get_instance_id()] = rectangle
	update_out(out)
	update_notice()
	update_roles()

func update_roles() -> void:
	preload("role_badges.gd").refresh(self)

func health_visible(body: Node3D) -> bool:
	var record: Dictionary = records.get(body.get_instance_id(), {})
	return not record.is_empty() and record.visible and (record.health < 100 or record.priority < 3)

func notice_rectangle(info: Dictionary) -> Rect2:
	if size.x < 860: return Rect2(size.x - 270, size.y - 200, 254, 59)
	var point := Vector2(size.x - 278, size.y * 0.5 + 98)
	var target: Variant = info.get("target")
	if is_instance_valid(target) and guide_rects.has(target.get_instance_id()):
		var guide: Rect2 = guide_rects[target.get_instance_id()]
		point = Vector2(guide.end.x - 254, guide.end.y + 8)
	return Rect2(point, Vector2(254, 59))

func warning_mode(source: Node3D, victim: Node3D, aim_point: Vector3) -> String:
	if not is_visible_in_tree() or size.x <= 0: return "unavailable"
	if world_warning_visible({"source": source.global_position + Vector3.UP * 2, "aim": aim_point}): return "world"
	if size.x < 800 or size.y < 600: return "unavailable"
	var rectangle := notice_rectangle({"target": victim, "aim": aim_point})
	return "notice" if clear_rect(rectangle, occupied) else "unavailable"

func point_visible(point: Vector3) -> bool:
	return not camera().is_position_behind(point) and Rect2(Vector2.ZERO, size).has_point(camera().unproject_position(point)) and session.arena.visible_line(camera().global_position, point)

func world_warning_visible(info: Dictionary) -> bool:
	for point in [info.source, info.aim + Vector3.UP * 0.5]:
		if not point_visible(point): return false
		var pixel: Vector2 = camera().unproject_position(point)
		for rectangle in occupied:
			if rectangle.has_point(pixel): return false
	return true

func warning_available(info: Dictionary) -> bool:
	return is_visible_in_tree() and (world_warning_visible(info) or (size.x >= 800 and size.y >= 600 and clear_rect(notice_rectangle(info), occupied)))

func update_notice() -> void:
	if not is_instance_valid(session.runtime):
		notice.hide()
		return
	var info: Dictionary = session.runtime.warning_info()
	if info.is_empty() or world_warning_visible(info):
		notice.hide()
		return
	var rectangle := notice_rectangle(info)
	# Do not silently obscure essential information. New attacks consult the same slot.
	if not clear_rect(rectangle, occupied):
		notice.hide()
		return
	notice.show()
	notice.position = rectangle.position
	notice.size = rectangle.size
	notice_title.text = "%s %s" % [info.role, info.action]
	notice_detail.text = "%s Near %s · aim fixed" % [ARROWS[bearing(info.aim)], info.name]
	notice_fill.size.x = 230 * float(info.progress)
