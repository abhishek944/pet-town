extends Control
signal view_requested
signal cancel_requested
const Palette = preload("res://ui/settings_style.gd")
const Layout = preload("res://ui/wildlife_hud_layout.gd")
var host: CanvasLayer
var reminder: Panel
var heading: Panel
var message: Label
var hint: Label
var heading_title: Label
var heading_hint: Label
var view: Button
var dismiss: Button
var cancel: Button
var lifetime := 0.0
var reminder_ids: Array = []
var heading_data: Dictionary = {}
var allowed := false
var held := false

func _ready() -> void:
	# Read moving reply/interaction bounds after their owners finish this frame.
	process_priority = 60
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	reminder = _panel()
	message = _label(14)
	reminder.add_child(message)
	hint = _label(11)
	hint.text = "Find one and press F to pet it."
	reminder.add_child(hint)
	view = Palette.action("View wildlife", true, 10, 11)
	view.pressed.connect(func() -> void:
		clear_reminder()
		view_requested.emit())
	reminder.add_child(view)
	dismiss = Palette.close_button()
	dismiss.accessibility_name = "Dismiss wildlife reminder"
	dismiss.pressed.connect(clear_reminder)
	reminder.add_child(dismiss)
	heading = _panel()
	heading_title = _label(13)
	heading.add_child(heading_title)
	heading_hint = _label(11)
	heading.add_child(heading_hint)
	cancel = Palette.action("Cancel", false, 8, 11)
	cancel.accessibility_name = "Cancel wildlife heading"
	cancel.pressed.connect(func() -> void: cancel_requested.emit())
	heading.add_child(cancel)
	reminder.hide()
	heading.hide()

func _panel() -> Panel:
	var panel := Panel.new()
	panel.add_theme_stylebox_override("panel", Palette.box(Palette.CREAM, Palette.BORDER, 16, 0, 0, 0, 0))
	add_child(panel)
	return panel

func _label(font_size: int) -> Label:
	var label := Palette.ink_label("", font_size, Palette.QUIET)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.mouse_filter = MOUSE_FILTER_IGNORE
	return label

func offer(entries: Array) -> bool:
	if not allowed or lifetime > 0 or entries.is_empty(): return false
	var names: Array[String] = []
	var ids: Array = []
	for entry in entries:
		names.append(entry.name)
		ids.append(entry.id)
	message.text = (names[0] + " could use some company.") if names.size() == 1 else "%d wildlife species could use company." % names.size()
	message.accessibility_description = ", ".join(names)
	reminder.accessibility_name = ", ".join(names) + " could use some company."
	reminder.tooltip_text = ", ".join(names)
	var extra: Array[Rect2] = []
	if heading.visible: extra.append(heading.get_global_rect())
	if not Layout.place(self, reminder, true, host, extra): return false
	reminder_ids = ids
	lifetime = 12.0
	_layout_contents()
	reminder.show()
	return true

func clear_reminder() -> void:
	lifetime = 0
	reminder_ids.clear()
	reminder.hide()

func remove_petted(id: String, entries: Array) -> void:
	if id not in reminder_ids: return
	reminder_ids.erase(id)
	if reminder_ids.is_empty():
		clear_reminder()
		return
	var names: Array[String] = []
	for entry in entries:
		if entry.id in reminder_ids: names.append(entry.name)
	message.text = names[0] + " could use some company." if names.size() == 1 else "%d wildlife species could use company." % names.size()
	reminder.accessibility_name = ", ".join(names) + " could use some company."
	reminder.tooltip_text = ", ".join(names)

func set_heading(data: Dictionary) -> void:
	heading_data = data
	heading_title.text = str(data.get("title", ""))
	heading_hint.text = str(data.get("hint", ""))

func _layout_contents() -> void:
	var width := reminder.size.x
	var compact := width < 440
	Palette.Style.position(message, Rect2(16, 12, width - (76 if compact else 204), 40))
	Palette.Style.position(hint, Rect2(16, 54, width - (32 if compact else 204), 28))
	Palette.Style.position(view, Rect2(16 if compact else width - 176, 76 if compact else 25, 114, 44))
	Palette.Style.position(dismiss, Rect2(width - 54, 12 if compact else 25, 44, 44))
	Palette.Style.position(heading_title, Rect2(14, 10, heading.size.x - 102, 38))
	Palette.Style.position(heading_hint, Rect2(14, 42, heading.size.x - 102, heading.size.y - 50))
	Palette.Style.position(cancel, Rect2(heading.size.x - 78, (heading.size.y - 44) / 2, 64, 44))

func _process(delta: float) -> void:
	var can_show: bool = allowed and host.root.visible and not host.is_menu_open
	heading.visible = can_show and not heading_data.is_empty() and Layout.place(self, heading, false, host, [])
	var extra: Array[Rect2] = []
	if heading.visible: extra.append(heading.get_global_rect())
	reminder.visible = can_show and lifetime > 0 and Layout.place(self, reminder, true, host, extra)
	_layout_contents()
	if not reminder.visible: return
	var focus := get_viewport().gui_get_focus_owner()
	held = reminder.get_global_rect().has_point(get_global_mouse_position()) or (is_instance_valid(focus) and reminder.is_ancestor_of(focus))
	if not held:
		lifetime -= delta
		if lifetime <= 0: clear_reminder()
