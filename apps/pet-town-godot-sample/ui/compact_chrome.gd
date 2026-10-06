extends RefCounted
## Keep the original chrome and targets reachable below a wrapped top toolbar.
## Wide windows keep their original layout; this scrolls UI, never the camera.
var host: CanvasLayer
var scroll: ScrollContainer
var body: Control
var clock: Control
var widgets: Array[Control] = []
var compact := false

func setup(hud: CanvasLayer) -> void:
	host = hud
	clock = host.root.get_node("Clock")
	widgets.assign([clock, host.companions, host.root.get_node("CornerActions"), host.hotbar])
	scroll = ScrollContainer.new()
	scroll.name = "CompactChrome"
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.follow_focus = true
	scroll.mouse_filter = Control.MOUSE_FILTER_PASS
	host.root.add_child(scroll)
	body = Control.new()
	body.mouse_filter = Control.MOUSE_FILTER_IGNORE
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.add_child(body)
	scroll.hide()

func layout() -> void:
	var top: float = host._top_toolbar_bottom()
	var docked: bool = host.live.dock.is_visible_in_tree() and host.root.size.x - host.live.dock.size.x < 305
	var needed: bool = host.root.size.x < 1000 and (top > 0 or docked) and not host.is_menu_open
	if needed != compact:
		var focused: Control = host.root.get_viewport().gui_get_focus_owner()
		var moving_focus := false
		for widget in widgets:
			if is_instance_valid(focused) and (widget == focused or widget.is_ancestor_of(focused)): moving_focus = true
		compact = needed
		for widget in widgets:
			widget.reparent(body if compact else host.root)
		if moving_focus and is_instance_valid(focused) and focused.is_visible_in_tree(): focused.grab_focus()
		if compact:
			clock.position = Vector2(24, 22)
			host.companions.position = Vector2(24, 100)
			var row := widgets[2]
			row.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
			row.offset_left = -160
			row.offset_right = -24
			row.offset_top = 22 if host.root.size.x >= 392 else 148
			row.offset_bottom = row.offset_top + 40
			host.hotbar.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		else:
			clock.position = Vector2(24, 22)
			host.companions.position = Vector2(24, 100)
			var row := widgets[2]
			row.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
			row.offset_left = -160
			row.offset_right = -24
			row.offset_top = 22
			row.offset_bottom = 62
			for slot in row.get_children():
				var hint: Control = slot.get_child(0).get_meta("shortcut_hint")
				hint.position = Vector2((40 - hint.get_combined_minimum_size().x) / 2, 47)
			host.hotbar.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
			var reserved: float = host.live.dock.size.x if host.live.dock.is_visible_in_tree() else 0
			host.hotbar.offset_right = -reserved
			host.live.dock.layout()
		scroll.visible = compact
	if not compact: return
	host.hotbar.visible = true
	host.hotbar.offset_right = 0
	var bottom: float = host.live.dock.position.y if docked else host.root.size.y
	scroll.position = Vector2(0, top + 8)
	var next_size := Vector2(host.root.size.x, maxf(44, bottom - top - 8))
	var resized: bool = scroll.size != next_size
	scroll.size = next_size
	if resized:
		var focused := scroll.get_viewport().gui_get_focus_owner()
		if is_instance_valid(focused) and body.is_ancestor_of(focused): scroll.ensure_control_visible.call_deferred(focused)
	body.custom_minimum_size = Vector2(0, maxf(440, scroll.size.y))
	var row := widgets[2]
	row.offset_left = -160
	row.offset_right = -24
	row.offset_top = 22 if host.root.size.x >= 392 else 148
	row.offset_bottom = row.offset_top + 40
	for slot in row.get_children():
		var button: Button = slot.get_child(0)
		var hint: Control = button.get_meta("shortcut_hint")
		var hint_size := hint.get_combined_minimum_size()
		var point := button.get_global_rect().position
		hint.position = Vector2(clampf((40 - hint_size.x) / 2, 8 - point.x, scroll.size.x - 8 - point.x - hint_size.x), 47)
		if button.has_focus() and hint.visible: scroll.ensure_control_visible(hint)
