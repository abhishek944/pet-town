extends Node3D

var actor: Node3D
var arm: SpringArm3D
var camera: Camera3D
var distance := 7.0
var pitch := 0.28
var dragging := false
var enabled := true
var first_person := false
var dock_width := 0.0
var cursor_start := Vector2.ZERO
var cursor_previous := Vector2.ZERO
var drag_distance := 0.0
var touch_claim: Callable
var touch_excluded: Callable
var touch_input: Node
var mouse_build: Node
signal clicked(button: int, position: Vector2)
signal palette_scrolled(direction: int)

func _ready() -> void:
	physics_interpolation_mode = Node.PHYSICS_INTERPOLATION_MODE_OFF
	arm = SpringArm3D.new()
	arm.collision_mask = 1
	arm.margin = 0.15
	var shape := SphereShape3D.new()
	shape.radius = 0.24
	arm.shape = shape
	arm.spring_length = distance
	add_child(arm)
	camera = Camera3D.new()
	camera.fov = 55
	camera.near = 0.08
	camera.far = 180
	arm.add_child(camera)
	camera.make_current()
	touch_input = preload("res://scripts/touch_camera.gd").new()
	add_child(touch_input)
	touch_input.setup(self)
	mouse_build = preload("res://scripts/mouse_build_input.gd").new()
	add_child(mouse_build)
	mouse_build.setup(self)

func _process(delta: float) -> void:
	if dragging and not Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT) and not Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) and not Input.is_mouse_button_pressed(MOUSE_BUTTON_MIDDLE):
		dragging = false
	if not actor:
		return
	global_position = actor.get_global_transform_interpolated().origin + Vector3(0, 1.2, 0)
	arm.rotation.x = -pitch
	arm.spring_length = move_toward(arm.spring_length, 0.0 if first_person else distance, delta * 20.0)
	frame_dock()
	if actor.motion.diving and actor.world:
		var surface: float = actor.world.water_at(camera.global_position)
		if global_position.y < surface - 0.15:
			camera.global_position.y = minf(camera.global_position.y, surface - 0.20)
	# A roof or wall can push the arm inside the character's head.
	actor.visual.visible = not first_person and arm.get_hit_length() > 1.25
	if enabled:
		var focused := get_viewport().gui_get_focus_owner()
		if focused is LineEdit or focused is TextEdit: return
		var turn := float(Input.is_action_pressed("orbit_left")) - float(Input.is_action_pressed("orbit_right"))
		rotation.y += turn * delta * 1.7
		for device in Input.get_connected_joypads():
			var x := Input.get_joy_axis(device,JOY_AXIS_RIGHT_X)
			var y := Input.get_joy_axis(device,JOY_AXIS_RIGHT_Y)
			if absf(x)>0.15: rotation.y-=x*delta*4.5
			if absf(y)>0.15: pitch=clampf(pitch+y*delta*3.0,-0.65,1.2)
			if Input.is_joy_button_pressed(device,JOY_BUTTON_DPAD_UP): distance=maxf(1.5,distance-delta*4.5)
			if Input.is_joy_button_pressed(device,JOY_BUTTON_DPAD_DOWN): distance=minf(14,distance+delta*4.5)

func _unhandled_input(event: InputEvent) -> void:
	if not enabled:
		return
	if (event is InputEventMouseButton or event is InputEventMouseMotion) and (event.device==-1 or touch_input.suppress_mouse()): return
	if event is InputEventKey and event.pressed:
		if event.keycode==KEY_L:
			Input.mouse_mode=Input.MOUSE_MODE_VISIBLE if Input.mouse_mode==Input.MOUSE_MODE_CAPTURED else Input.MOUSE_MODE_CAPTURED
		elif event.keycode==KEY_ESCAPE:
			Input.mouse_mode=Input.MOUSE_MODE_VISIBLE
	if event is InputEventMouseButton:
		if event.pressed:
			var focused := get_viewport().gui_get_focus_owner()
			if is_instance_valid(focused):
				focused.release_focus()
				preload("res://scripts/town_input.gd").clear_gameplay()
		if event.shift_pressed and event.pressed and event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN]:
			palette_scrolled.emit(-1 if event.button_index==MOUSE_BUTTON_WHEEL_UP else 1)
			return
		if event.button_index==MOUSE_BUTTON_MIDDLE and event.pressed:
			mouse_build.begin(event)
			return
		if event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
			distance = clampf(distance - 0.7, 1.5, 14)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
			distance = clampf(distance + 0.7, 1.5, 14)
		elif event.button_index in [MOUSE_BUTTON_LEFT, MOUSE_BUTTON_RIGHT]:
			if event.pressed:
				mouse_build.begin(event)
	elif event is InputEventMouseMotion and (dragging or Input.mouse_mode==Input.MOUSE_MODE_CAPTURED):
		var movement: Vector2 = event.relative if Input.mouse_mode==Input.MOUSE_MODE_CAPTURED else event.position - cursor_previous
		cursor_previous = event.position
		drag_distance += movement.length()
		rotation.y -= movement.x * 0.005
		pitch = clampf(pitch + movement.y * 0.005, -0.65, 1.2)
	elif event.is_action_pressed("view"):
		first_person = not first_person

func set_enabled(value: bool) -> void:
	enabled = value
	if not value:
		if touch_input: touch_input.clear()
		if mouse_build: mouse_build.clear()
	if not value: Input.mouse_mode=Input.MOUSE_MODE_VISIBLE
	dragging = false

func frame_dock() -> void:
	var viewport := get_viewport().get_visible_rect().size
	var width := clampf(dock_width, 0, viewport.x * 0.75)
	if width <= 0:
		camera.projection = Camera3D.PROJECTION_PERSPECTIVE
		return
	var half_height := camera.near * tan(deg_to_rad(camera.fov) * 0.5)
	camera.projection = Camera3D.PROJECTION_FRUSTUM
	camera.size = half_height * 2.0
	camera.frustum_offset = Vector2(half_height * width / maxf(1,viewport.y), 0)

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		if touch_input: touch_input.clear()
		if mouse_build: mouse_build.clear()
		Input.mouse_mode=Input.MOUSE_MODE_VISIBLE
		dragging = false
