extends Node
## Original source touch gestures, independent of native UI joystick fingers.
var rig: Node3D
var touches: Dictionary = {}
var gesture: Dictionary = {}
var pinch := 0.0
var last_touch := -1200
var elapsed := 0.0

func setup(camera_rig: Node3D) -> void:
	rig = camera_rig

func blocked(point: Vector2) -> bool:
	if not rig.enabled: return true
	var focus := get_viewport().gui_get_focus_owner()
	if focus is LineEdit or focus is TextEdit: return true
	if point.x >= get_viewport().get_visible_rect().size.x-rig.dock_width and rig.dock_width>0: return true
	return rig.touch_excluded.is_valid() and bool(rig.touch_excluded.call(point))

func _input(event: InputEvent) -> void:
	# Releases must clear captured fingers even if a modal consumes the event.
	if event is InputEventScreenTouch and not event.pressed and touches.has(event.index):
		finish(event.index,event.position,event.canceled)
		get_viewport().set_input_as_handled()
	elif event is InputEventScreenDrag and touches.has(event.index):
		move(event.index,event.position)
		get_viewport().set_input_as_handled()

func _unhandled_input(event: InputEvent) -> void:
	if not event is InputEventScreenTouch or not event.pressed or blocked(event.position): return
	last_touch = Time.get_ticks_msec()
	if rig.mouse_build: rig.mouse_build.clear()
	touches[event.index] = event.position
	if touches.size() != 1:
		gesture.clear()
		if touches.size()==2: pinch=span()
	else:
		gesture = {"id":event.index,"start":event.position,"previous":event.position,"moved":false,"orbit":0.0,"done":false,"started":Time.get_ticks_msec()}
		elapsed = 0.0
	get_viewport().set_input_as_handled()

func move(index: int,point: Vector2) -> void:
	if not rig.enabled:
		clear()
		return
	touches[index] = point
	last_touch = Time.get_ticks_msec()
	if touches.size()==2:
		var next := span()
		rig.distance = clampf(rig.distance*exp((pinch-next)*3.0*0.0011),2.4,26.0)
		pinch = next
		return
	if touches.size()!=1 or gesture.is_empty() or gesture.id!=index: return
	var travel: Vector2 = point-gesture.previous
	gesture.previous = point
	gesture.orbit += absf(travel.x)+absf(travel.y)
	if point.distance_to(gesture.start)>12.0: gesture.moved=true
	if gesture.orbit>4.0:
		rig.rotation.y -= travel.x*0.0052
		rig.pitch = clampf(rig.pitch+travel.y*0.0052*0.85,-0.25,1.32)

func finish(index: int,point: Vector2,canceled:=false) -> void:
	last_touch = Time.get_ticks_msec()
	if not gesture.is_empty() and gesture.id==index:
		elapsed = maxf(elapsed,(Time.get_ticks_msec()-int(gesture.started))/1000.0)
		var place: bool = not canceled and not gesture.moved and not gesture.done and elapsed<=0.420 and not blocked(point)
		var start: Vector2 = gesture.start
		gesture.clear()
		if place:
			var claimed: bool = rig.touch_claim.is_valid() and bool(rig.touch_claim.call(start))
			if not claimed: rig.clicked.emit(MOUSE_BUTTON_RIGHT,start)
	touches.erase(index)
	pinch = span() if touches.size()==2 else 0.0

func _process(delta: float) -> void:
	if not rig or not rig.enabled:
		clear()
		return
	if gesture.is_empty(): return
	var point: Vector2 = gesture.start
	if blocked(point):
		clear()
		return
	elapsed = maxf(elapsed+delta,(Time.get_ticks_msec()-int(gesture.started))/1000.0)
	if elapsed>=0.460 and not gesture.moved and not gesture.done:
		gesture.done = true
		rig.clicked.emit(MOUSE_BUTTON_LEFT,point)

func span() -> float:
	var points: Array = touches.values()
	return Vector2(points[0]).distance_to(points[1])

func suppress_mouse() -> bool:
	return Time.get_ticks_msec()-last_touch<1200

func clear() -> void:
	touches.clear()
	gesture.clear()
	pinch = 0.0
	elapsed = 0.0

func _notification(what: int) -> void:
	if what==NOTIFICATION_APPLICATION_FOCUS_OUT: clear()
