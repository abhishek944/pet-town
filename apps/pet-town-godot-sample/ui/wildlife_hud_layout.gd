extends RefCounted
## Place care controls in free HUD space, including dock and interaction bounds.
static func obstacles(hud: CanvasLayer) -> Array[Rect2]:
	var result: Array[Rect2] = []
	var controls: Array = [hud.hotbar.name_panel, hud.hotbar.tray, hud.feedback.prompt,
		hud.feedback.toast, hud.live.dock, hud.live.usage, hud.live.profile, hud.live.mayor, hud.live.reply.bubble,
		hud.live.ocean.compass, hud.live.ocean.action, hud.live.ocean.dive, hud.live.ocean.helm,
		hud.root.find_child("Clock", true, false), hud.companions, hud.root.find_child("CornerActions", true, false)]
	for control in controls:
		if is_instance_valid(control) and control.is_visible_in_tree() and control.size.x > 0 and control.size.y > 0:
			result.append(control.get_global_rect())
	var touch = hud.live.touch
	if touch.available and touch.is_visible_in_tree():
		for rect in [touch.stick, touch.jump]: result.append(Rect2(rect.position + touch.global_position, rect.size))
	return result

static func place(owner: Control, panel: Control, bottom: bool, hud: CanvasLayer, extra: Array[Rect2]) -> bool:
	var blocked := obstacles(hud) + extra
	var usable := owner.size.x
	if hud.live.dock.is_visible_in_tree(): usable = minf(usable, hud.live.dock.global_position.x - owner.global_position.x)
	var width := minf(490 if bottom else 340, maxf(0, usable - 24))
	if width < 220: return false
	panel.size.x = width
	var height := (94 if width >= 440 else 132) if bottom else (78 if width >= 300 else 110)
	panel.size.y = height
	var x := (usable - width) / 2 if bottom else minf(24, maxf(12, usable - width - 12))
	var first := owner.size.y - 112 - height if bottom else 154.0
	var positions: Array[float] = [first]
	# Search upward for reminders, downward for headings, without hiding controls.
	for index in range(1, 30): positions.append(first + (-12 if bottom else 12) * index)
	for y in positions:
		var candidate := Rect2(owner.global_position + Vector2(x, y), Vector2(width, height))
		if y < 12 or y + height > owner.size.y - 12: continue
		var overlaps := false
		for rect in blocked:
			if candidate.grow(6).intersects(rect):
				overlaps = true
				break
		if not overlaps:
			panel.position = Vector2(x, y)
			return true
	return false
