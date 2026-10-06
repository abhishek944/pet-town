extends Control
## Source joystick thresholds and jump hold, available only on touch devices.
const Paint = preload("res://ui/touch_painter.gd")
var host: CanvasLayer
var stick := Rect2()
var jump := Rect2()
var stick_id := -1
var jump_id := -1
var thumb := Vector2.ZERO
var running := false
var held: Dictionary = {}
var forced := false
var available := false
var layout_available := false
var obstacle_snapshot: Array[Rect2] = []

func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	forced = "--touch" in OS.get_cmdline_user_args()
	resized.connect(func() -> void: layout.call_deferred())
	get_viewport().size_changed.connect(func() -> void: layout.call_deferred())
	get_window().focus_exited.connect(_focus_lost)
	visibility_changed.connect(_visibility_changed)
	layout.call_deferred()

func _visibility_changed() -> void:
	if not is_visible_in_tree():
		available = false
		release_controls()

func _focus_lost() -> void:
	available = false
	release_controls()

func layout() -> void:
	var compact := size.y <= 540
	var portrait := size.x / maxf(1, size.y) <= 0.8
	var diameter := 112.0 if compact else 132.0
	var jump_size := 72.0 if compact else 84.0
	var obstacles := _layout_obstacles()
	obstacle_snapshot = obstacles
	var preferred_stick := Rect2(Vector2(20, size.y - diameter - 20 - (96 if portrait else 0)), Vector2.ONE * diameter)
	var preferred_jump := Rect2(Vector2(size.x - jump_size - 22, size.y - jump_size - 26 - (100 if portrait else 0)), Vector2.ONE * jump_size)
	var next_stick := preferred_stick if _fits(preferred_stick, obstacles, []) else Rect2()
	var next_jump := preferred_jump if _fits(preferred_jump, obstacles, [next_stick]) else Rect2()
	var hotbar_top := _hotbar_top()
	if next_stick.size == Vector2.ZERO:
		for y in [hotbar_top - diameter - 8.0, 230.0]:
			var candidate := Rect2(Vector2(12, y), Vector2.ONE * diameter)
			if _fits(candidate, obstacles, [next_jump]):
				next_stick = candidate
				break
	if next_jump.size == Vector2.ZERO:
		for y in [hotbar_top - jump_size - 8.0, 330.0, 230.0]:
			var candidate := Rect2(Vector2(maxf(12.0, size.x - jump_size - 12.0), y), Vector2.ONE * jump_size)
			if _fits(candidate, obstacles, [next_stick]):
				next_jump = candidate
				break
	stick = next_stick
	jump = next_jump
	layout_available = stick.size.x >= 44.0 and jump.size.x >= 44.0
	if not layout_available: release_controls()
	queue_redraw()

func _layout_obstacles() -> Array[Rect2]:
	var obstacles: Array[Rect2] = []
	var root = host.get("root")
	var hotbar = host.get("hotbar")
	var live = host.get("live")
	var controls: Array = [host.get("companions")]
	if root is Control: controls.append_array([root.find_child("Clock", true, false), root.find_child("CornerActions", true, false)])
	if hotbar is Control: controls.append_array([hotbar.get("name_panel"), hotbar.get("tray")])
	if live is Control:
		var reply = live.get("reply")
		controls.append_array([live.get("usage"), live.get("mayor"), live.get("profile"), reply.get("bubble") if reply is Control else null, live.get("dock")])
		var ocean = live.get("ocean")
		if ocean is Control: controls.append_array([ocean.get("compass"), ocean.get("action"), ocean.get("dive"), ocean.get("helm")])
	for control in controls: _add_obstacle(obstacles, control)
	return obstacles

func _add_obstacle(obstacles: Array[Rect2], control: Variant) -> void:
	if not control is Control or not control.is_visible_in_tree() or control.size.x <= 0 or control.size.y <= 0: return
	var rect := Rect2(control.global_position - global_position, control.size)
	if rect.intersects(Rect2(Vector2.ZERO, size)): obstacles.append(rect)

func _hotbar_top() -> float:
	var top := size.y
	var hotbar = host.get("hotbar")
	if not hotbar is Control or not hotbar.is_visible_in_tree(): return top
	for control in [hotbar.get("name_panel"), hotbar.get("tray")]:
		if control is Control and control.is_visible_in_tree():
			var rect := Rect2(control.global_position - global_position, control.size)
			if rect.position.y < size.y and rect.position.y + rect.size.y > 0:
				top = minf(top, rect.position.y)
	return top

func _fits(rect: Rect2, obstacles: Array[Rect2], occupied: Array[Rect2]) -> bool:
	if rect.size.x < 44.0 or rect.size.y < 44.0 or rect.position.x < 0 or rect.position.y < 0:
		return false
	if rect.position.x + rect.size.x > size.x or rect.position.y + rect.size.y > size.y:
		return false
	for obstacle in obstacles + occupied:
		if rect.intersects(obstacle): return false
	return true

func _process(_delta: float) -> void:
	# ponytail: poll only owned HUD rectangles because scroll/reparent skips resize signals.
	if _layout_obstacles() != obstacle_snapshot: layout()
	var focused := get_viewport().gui_get_focus_owner()
	var enabled: bool = (forced or DisplayServer.is_touchscreen_available()) and is_visible_in_tree() and get_window().has_focus() and not host.is_menu_open and not (focused is LineEdit or focused is TextEdit) and layout_available
	if available != enabled:
		available = enabled
		if not enabled: release_controls()
		queue_redraw()

func contains_point(point: Vector2) -> bool:
	if not available or not is_visible_in_tree(): return false
	if host.live.dock.visible and host.live.dock.get_global_rect().has_point(point): return false
	return point.distance_to(stick.get_center()) <= stick.size.x / 2 or point.distance_to(jump.get_center()) <= jump.size.x / 2

func _input(event: InputEvent) -> void:
	if not available or not is_visible_in_tree() or not get_window().has_focus(): return
	if event is InputEventScreenTouch:
		if event.pressed and contains_point(event.position):
			if stick.has_point(event.position) and stick_id < 0:
				stick_id = event.index
				move_thumb(event.position)
			elif jump.has_point(event.position) and jump_id < 0:
				jump_id = event.index
				press("jump", true)
				Input.vibrate_handheld(8)
			else: return
		elif not event.pressed:
			if event.index == stick_id: release_stick()
			elif event.index == jump_id: jump_id = -1; press("jump", false)
			else: return
		else: return
		get_viewport().set_input_as_handled()
		queue_redraw()
	elif event is InputEventScreenDrag:
		if event.index == stick_id: move_thumb(event.position)
		elif event.index != jump_id: return
		get_viewport().set_input_as_handled()

func move_thumb(point: Vector2) -> void:
	var radius := stick.size.x * 0.38
	var delta := point - stick.get_center()
	var amount := minf(1, delta.length() / radius)
	thumb = delta.limit_length(radius)
	var direction := thumb / radius
	var active := amount >= 0.22
	press("move_right", active and direction.x > 0.38)
	press("move_left", active and direction.x < -0.38)
	press("move_back", active and direction.y > 0.38)
	press("move_forward", active and direction.y < -0.38)
	running = amount > 0.94
	press("run", running)
	queue_redraw()

func press(action: String, down: bool) -> void:
	if held.get(action, false) == down: return
	held[action] = down
	if not InputMap.has_action(action): return
	if down: Input.action_press(action)
	else: Input.action_release(action)

func release_stick() -> void:
	stick_id = -1
	thumb = Vector2.ZERO
	running = false
	for action in ["move_forward", "move_back", "move_left", "move_right", "run"]: press(action, false)
	queue_redraw()

func release_controls() -> void:
	release_stick()
	jump_id = -1
	press("jump", false)
	queue_redraw()

func _draw() -> void:
	if available: Paint.draw(self)
