extends Control
## Exact source name pills, projected above the current character head.
signal action_requested(id: String)
const Style = preload("res://ui/hud_style.gd")
var host: CanvasLayer
var records: Array = []
var camera: Camera3D
var selected_id := ""
var viewport_size := Vector2.ZERO
var labels: Dictionary = {}
var occluded: Dictionary = {}
var visibility_timer := 0.0
var font := SystemFont.new()

func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	clip_contents = true
	font.font_names = PackedStringArray(["SF Pro Rounded", "Helvetica", "sans-serif"])
	font.font_weight = 700

func set_data(data: Array, view: Camera3D, selected: String, dimensions := Vector2.ZERO) -> void:
	records = data
	camera = view
	selected_id = selected
	viewport_size = dimensions
	var ids: Array = data.map(func(record: Dictionary) -> String: return str(record.get("id", "")))
	for id in labels.keys():
		if id not in ids:
			remove_child(labels[id])
			labels[id].queue_free()
			labels.erase(id)
			occluded.erase(id)
	for record in records:
		var id := Style.text_or(record.get("id"))
		if id.is_empty(): continue
		if not labels.has(id): create_label(id)
		var button: Button = labels[id]
		var name := Style.text_or(record.get("label"), "Companion")
		button.text = name
		button.tooltip_text = "%s · %s · Follow" % [name, Style.text_or(record.get("status"))]
		var width := clampf(font.get_string_size(name, HORIZONTAL_ALIGNMENT_LEFT, -1, 11).x + 22, 22, 160)
		if not button.has_meta("selected") or button.get_meta("selected") != (id == selected):
			var box := background(id == selected)
			for state in ["normal", "hover", "pressed"]: button.add_theme_stylebox_override(state, box)
			button.set_meta("selected", id == selected)
		button.custom_minimum_size = Vector2(width, 23)
		button.size = Vector2(width, 23)

func create_label(id: String) -> void:
	var button := Button.new()
	button.clip_text = true
	button.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	button.add_theme_font_override("font", font)
	button.add_theme_font_size_override("font_size", 11)
	for state in ["font_color", "font_hover_color", "font_pressed_color"]: button.add_theme_color_override(state, Color("51463d"))
	button.mouse_default_cursor_shape = CURSOR_POINTING_HAND
	button.gui_input.connect(func(event: InputEvent) -> void:
		if event is InputEventMouseButton: button.set_meta("pointer", true)
		elif event is InputEventKey: button.set_meta("pointer", false))
	button.pressed.connect(func() -> void:
		action_requested.emit(id)
		if button.get_meta("pointer", false): button.release_focus())
	add_child(button)
	button.hide()
	labels[id] = button
	occluded[id] = false
	visibility_timer = 0

static func background(selected: bool) -> StyleBoxFlat:
	var box := Style.panel("ddf3d8" if selected else "fffbf1e8", 30, "a1c995" if selected else "ffffff88", false)
	box.set_border_width_all(2)
	box.content_margin_left = 11
	box.content_margin_right = 11
	box.content_margin_top = 5
	box.content_margin_bottom = 5
	box.shadow_color = Color("3b302423")
	box.shadow_size = 3
	box.shadow_offset = Vector2(0,2)
	return box

func _process(delta: float) -> void:
	visible = not host.is_menu_open and host.root.visible
	if not visible or not is_instance_valid(camera): return
	visibility_timer -= delta
	var refresh := visibility_timer <= 0
	if refresh: visibility_timer = 0.18
	var view := camera.get_viewport().get_visible_rect().size
	var dimensions := viewport_size if viewport_size != Vector2.ZERO else view
	for record in records:
		var id := Style.text_or(record.get("id"))
		if not labels.has(id): continue
		var button: Button = labels[id]
		var root_node: Node3D = record.get("root")
		if not record.get("visible", true) or (is_instance_valid(root_node) and not root_node.is_visible_in_tree()): button.hide(); continue
		var point: Vector3 = record.get("head", Vector3.ZERO) + Vector3.UP * 0.55
		var depth: float = -(camera.global_transform.affine_inverse() * point).z
		if camera.is_position_behind(point) or depth < camera.near or depth > camera.far: button.hide(); continue
		if refresh: occluded[id] = is_occluded(point)
		var screen := camera.unproject_position(point)
		screen *= dimensions / view
		button.visible = not occluded[id] and screen.x >= -dimensions.x * 0.05 and screen.x <= dimensions.x * 1.05 and screen.y >= -dimensions.y * 0.05 and screen.y <= dimensions.y * 1.05
		if button.visible: button.position = screen - Vector2(button.size.x / 2, button.size.y)

func is_occluded(point: Vector3) -> bool:
	var query := PhysicsRayQueryParameters3D.create(camera.global_position, point, 1)
	query.collide_with_areas = false
	var hit := camera.get_world_3d().direct_space_state.intersect_ray(query)
	return not hit.is_empty() and camera.global_position.distance_to(hit.position) < camera.global_position.distance_to(point) - 0.4
