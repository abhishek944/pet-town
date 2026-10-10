extends RefCounted
## Keep eligible ocean controls clear of the current compact HUD.
## ponytail: fixed safe candidates; expand only if actual compact captures exhaust them.
var snapshot: Array[Rect2] = []
var top_controls_bottom := 0.0
var helm_layout_available := true
var dive_layout_available := true

func changed(owner: Control, dive: Control, helm: Control) -> bool:
	return _obstacles(owner, dive, helm) != snapshot

func layout(owner: Control, compass: Control, action: Button, dive: Button, helm: GridContainer,
		helm_requested: bool, dive_requested: bool) -> Vector2i:
	var compact := owner.size.x < 900.0 or owner.size.y <= 540.0
	var obstacles := _hud_obstacles(owner)
	var occupied: Array[Rect2] = []
	var helm_position := Vector2(maxf(12.0, owner.size.x - 184.0), 230.0) if compact else Vector2(24.0, 230.0)
	helm_layout_available = true
	if helm_requested:
		var helm_rect := _first_fit(owner, helm.size, [helm_position, Vector2(2, maxf(236.0, top_controls_bottom + 8.0)), Vector2(2, 330), Vector2(12, 230)], obstacles, occupied)
		helm_layout_available = helm_rect.size.x >= 44.0
		if helm_layout_available:
			helm.position = helm_rect.position
			occupied.append(helm_rect)
	else:
		helm.position = helm_position
	var dive_position := Vector2(maxf(12.0, owner.size.x - 148.0), 230.0) if compact else Vector2(owner.size.x - 158.0, owner.size.y - 174.0)
	if compact:
		dive.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
		dive.position = dive_position
		dive.size = Vector2(136, 44)
	else:
		dive.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
		dive.offset_left = -158
		dive.offset_right = -22
		dive.offset_top = -174
		dive.offset_bottom = -130
	dive_layout_available = true
	if dive_requested:
		var dive_rect := _first_fit(owner, dive.size, [dive_position, Vector2(12, maxf(236.0, top_controls_bottom + 8.0)), Vector2(12, 330), Vector2(12, 230)], obstacles, occupied)
		dive_layout_available = dive_rect.size.x >= 44.0
		if dive_layout_available:
			occupied.append(dive_rect)
			if dive_rect.position != dive_position:
				dive.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
				dive.position = dive_rect.position
				dive.size = dive_rect.size
	var control_obstacles := obstacles + occupied
	var compass_rect := Rect2(Vector2(minf(24.0, maxf(0.0, owner.size.x - 310.0)), 154), Vector2(310, 66))
	if not _fits(owner, compass_rect, control_obstacles):
		var bottom := top_controls_bottom
		for rect in occupied: bottom = maxf(bottom, rect.end.y)
		compass_rect.position.y = bottom + 8.0
	var heading_ok := _fits(owner, compass_rect, control_obstacles)
	if heading_ok: compass.position = compass_rect.position
	var default_action := Rect2(Vector2((owner.size.x - 230.0) / 2.0, owner.size.y - 191.0), Vector2(230, 44))
	var action_rect := default_action
	var action_obstacles := control_obstacles.duplicate()
	if heading_ok: action_obstacles.append(compass_rect)
	if not _fits(owner, action_rect, action_obstacles):
		for occupied_rect in occupied:
			var beside := Rect2(Vector2(occupied_rect.end.x + 8.0, occupied_rect.position.y), Vector2(230, 44))
			var before := Rect2(Vector2(occupied_rect.position.x - 238.0, occupied_rect.position.y), Vector2(230, 44))
			if _fits(owner, beside, action_obstacles):
				action_rect = beside
				break
			if _fits(owner, before, action_obstacles):
				action_rect = before
				break
		if action_rect == default_action:
			var left := Rect2(Vector2(12, maxf(236.0, top_controls_bottom + 8.0)), Vector2(230, 44))
			var after_compass := compass_rect.end.y if heading_ok else top_controls_bottom
			var below := Rect2(Vector2((owner.size.x - 230.0) / 2.0, maxf(after_compass + 8.0, minf(_hotbar_top(owner) - 52.0, owner.size.y - 44.0))), Vector2(230, 44))
			action_rect = left if _fits(owner, left, action_obstacles) else below
	var action_ok := _fits(owner, action_rect, action_obstacles)
	if action_ok and action_rect != default_action:
		action.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
		action.position = action_rect.position
		action.size = action_rect.size
	else:
		action.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
		action.offset_left = -115
		action.offset_right = 115
		action.offset_top = -191
		action.offset_bottom = -147
	snapshot = _obstacles(owner, dive, helm)
	return Vector2i(int(heading_ok), int(action_ok))

func _first_fit(owner: Control, size: Vector2, points: Array[Vector2], obstacles: Array[Rect2], occupied: Array[Rect2]) -> Rect2:
	for point in points:
		var candidate := Rect2(point, size)
		if _fits(owner, candidate, obstacles + occupied): return candidate
	return Rect2()

func _hud_obstacles(owner: Control, include_swim := true) -> Array[Rect2]:
	var result: Array[Rect2] = []
	var live := owner.get_parent()
	var hud = live.get("host") if live is Control else null
	var root = hud.get("root") if hud is CanvasLayer else null
	var hotbar = hud.get("hotbar") if hud is CanvasLayer else null
	top_controls_bottom = 0.0
	for control in [root.find_child("Clock", true, false) if root is Control else null, hud.get("companions") if hud is CanvasLayer else null, root.find_child("CornerActions", true, false) if root is Control else null, live.get("mayor") if live is Control else null, live.get("profile") if live is Control else null]:
		if control is Control and control.is_visible_in_tree():
			var rect := _rect(owner, control)
			if rect.intersects(Rect2(Vector2.ZERO, owner.size)):
				result.append(rect)
				top_controls_bottom = maxf(top_controls_bottom, rect.end.y)
	var reply = live.get("reply") if live is Control else null
	for control in [hotbar.get("name_panel") if hotbar is Control else null, hotbar.get("tray") if hotbar is Control else null, live.get("usage") if live is Control else null, reply.get("bubble") if reply is Control else null, live.get("dock") if live is Control else null]:
		if control is Control and control.is_visible_in_tree() and control.size.x > 0 and control.size.y > 0:
			var rect := _rect(owner, control)
			if rect.intersects(Rect2(Vector2.ZERO, owner.size)): result.append(rect)
	var swim = owner.get("swim")
	if include_swim and swim is Control:
		for control in [swim.left, swim.build]:
			if control.is_visible_in_tree(): result.append(_rect(owner, control))
	return result

func _obstacles(owner: Control, dive: Control, helm: Control) -> Array[Rect2]:
	var result := _hud_obstacles(owner)
	for control in [owner.get("compass"), owner.get("action"), dive, helm]:
		if control is Control and control.is_visible_in_tree() and control.size.x > 0 and control.size.y > 0:
			var rect := _rect(owner, control)
			if rect.intersects(Rect2(Vector2.ZERO, owner.size)): result.append(rect)
	return result

func _rect(owner: Control, control: Control) -> Rect2:
	return Rect2(control.global_position - owner.global_position, control.size)

func _hotbar_top(owner: Control) -> float:
	var live := owner.get_parent()
	var hud = live.get("host") if live is Control else null
	var hotbar = hud.get("hotbar") if hud is CanvasLayer else null
	var top := owner.size.y
	if hotbar is Control:
		for control in [hotbar.get("name_panel"), hotbar.get("tray")]:
			if control is Control and control.is_visible_in_tree():
				var rect := _rect(owner, control)
				if rect.position.y < owner.size.y and rect.end.y > 0: top = minf(top, rect.position.y)
	return top

func _fits(owner: Control, rect: Rect2, obstacles: Array[Rect2]) -> bool:
	if rect.size.x < 44.0 or rect.size.y < 44.0 or rect.position.x < 0 or rect.position.y < 0 or rect.end.x > owner.size.x or rect.end.y > owner.size.y: return false
	for obstacle in obstacles:
		if rect.intersects(obstacle): return false
	return true
