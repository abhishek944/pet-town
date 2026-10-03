extends Node
## Source mouse tap guard and captured-pointer 320/230 ms building repeats.
var rig: Node3D
var press: Dictionary = {}
var elapsed := 0.0
var next_repeat := 0.32

func setup(camera_rig: Node3D) -> void:
	rig = camera_rig

func begin(event: InputEventMouseButton) -> void:
	clear()
	var locked := Input.mouse_mode==Input.MOUSE_MODE_CAPTURED
	press = {"button":event.button_index,"start":event.position,"locked":locked,"started":Time.get_ticks_msec()}
	rig.dragging = true
	rig.cursor_start = event.position
	rig.cursor_previous = event.position
	rig.drag_distance = 0.0
	if locked: rig.clicked.emit(event.button_index,event.position)

func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton and not event.pressed and not press.is_empty() and event.button_index==press.button:
		finish(event)
		get_viewport().set_input_as_handled()

func finish(event: InputEventMouseButton) -> void:
	var captured := Input.mouse_mode==Input.MOUSE_MODE_CAPTURED
	elapsed = maxf(elapsed,(Time.get_ticks_msec()-int(press.started))/1000.0)
	if not blocked() and not press.locked and not captured and elapsed<=0.5 and event.position.distance_to(press.start)<=4.0:
		rig.clicked.emit(event.button_index,event.position)
	clear()

func _process(delta: float) -> void:
	if press.is_empty(): return
	if blocked() or bool(press.locked)!=(Input.mouse_mode==Input.MOUSE_MODE_CAPTURED):
		clear()
		return
	elapsed = maxf(elapsed+delta,(Time.get_ticks_msec()-int(press.started))/1000.0)
	if press.locked and elapsed>=next_repeat:
		# At most one intent per frame; no catch-up burst after a stalled frame.
		next_repeat = elapsed+0.23
		rig.clicked.emit(press.button,get_viewport().get_mouse_position())

func blocked() -> bool:
	var focus := get_viewport().gui_get_focus_owner()
	return not rig.enabled or focus is LineEdit or focus is TextEdit or rig.touch_input.suppress_mouse()

func clear() -> void:
	press.clear()
	elapsed = 0.0
	next_repeat = 0.32
	if rig: rig.dragging=false

func _notification(what: int) -> void:
	if what==NOTIFICATION_APPLICATION_FOCUS_OUT: clear()
