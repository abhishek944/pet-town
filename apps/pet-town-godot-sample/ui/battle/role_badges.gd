extends RefCounted
## Role badges are presentation only; they never control enemy state.
const Style = preload("res://ui/hud_style.gd")

static func refresh(view: Control) -> void:
	var present := {}
	var compact := view.size.x < 860
	var blockers: Array[Rect2] = view.occupied.duplicate()
	if view.notice.visible: blockers.append(Rect2(view.notice.position, view.notice.size))
	for enemy in view.session.enemies:
		if not is_instance_valid(enemy) or enemy.health.value <= 0: continue
		var id: int = enemy.get_instance_id()
		present[id] = true
		if not view.role_labels.has(id):
			var frame: Panel = view.panel(view, "fff8e9", 7, "e9d7b5", false)
			var skin := frame.get_theme_stylebox("panel") as StyleBoxFlat
			skin.shadow_color = Color("30271633")
			skin.shadow_size = 2
			skin.shadow_offset = Vector2(0, 1)
			var icon := TextureRect.new()
			icon.texture = load("res://ui/battle/icons/role-%s.svg" % enemy.appearance.to_lower())
			icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
			frame.add_child(icon)
			view.role_labels[id] = {"panel": frame, "icon": icon, "label": view.label(frame, enemy.appearance, 12, "4c402f")}
		var record: Dictionary = view.role_labels[id]
		record.panel.visible = view.actor_visible(enemy)
		if not record.panel.visible: continue
		var font_size := 11 if compact else 12
		var icon_size := 12 if compact else 14
		var padding := 5 if compact else 6
		var gap := 3 if compact else 4
		record.label.add_theme_font_size_override("font_size", font_size)
		var text_width: float = Style.BODY.get_string_size(enemy.appearance, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x
		record.panel.size = Vector2(ceilf(text_width) + icon_size + gap + 2 * padding, 18 if compact else 20)
		record.icon.position = Vector2(padding, 3)
		record.icon.size = Vector2(icon_size, icon_size)
		record.label.position = Vector2(padding + icon_size + gap, 0 if compact else 1)
		record.label.size = Vector2(ceilf(text_width), 18)
		var offset := Vector2(21, 7 if compact else 8)
		match enemy.appearance:
			"Warrior": offset = Vector2(25 if compact else 24, -26.5 if compact else -26)
			"Rogue": offset = Vector2(17 if compact else 16.5, 7 if compact else 9)
			"Mage": offset = Vector2(21 if compact else 22, 0.2 if compact else 0.6)
		var point: Vector2 = (view.camera().unproject_position(enemy.global_position + Vector3.UP * 1.7) + offset).round()
		var candidate := Rect2(Vector2(clampf(point.x, 4, view.size.x - record.panel.size.x - 4), clampf(point.y, 4, view.size.y - record.panel.size.y - 4)), record.panel.size)
		if not view.clear_rect(candidate, blockers):
			candidate.position += Vector2(-candidate.size.x - 24, -20)
			record.panel.visible = view.clear_rect(candidate, blockers)
		record.panel.position = candidate.position
	for id in view.role_labels.keys():
		if not present.has(id):
			view.role_labels[id].panel.queue_free()
			view.role_labels.erase(id)
