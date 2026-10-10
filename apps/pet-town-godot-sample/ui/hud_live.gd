extends Control

signal action_requested(id: String, action: String, payload: Dictionary)
signal dock_width_changed(width: float)
const Style = preload("res://ui/hud_style.gd")
var host: CanvasLayer
var entries: Array = []
var selected_id := ""
var usage: PanelContainer
var usage_snapshot: Dictionary = {}
var selected_usage: Dictionary = {}
var mayor: PanelContainer
var reply: Control
var profile: Control
var dock: PanelContainer
var pointer: Control
var pet_catalog: Array = []
var ocean: Control
var touch: Control
var labels: Control
var compact_chrome := preload("res://ui/compact_chrome.gd").new()

func setup(hud: CanvasLayer) -> void:
	host = hud
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	labels = preload("res://ui/companion_labels.gd").new()
	labels.host = host
	host.root.add_child(labels)
	host.root.move_child(labels, 0)
	labels.action_requested.connect(func(id: String) -> void: forward_action(id, "follow", {}))
	usage = preload("res://ui/usage_card.gd").new()
	add_child(usage)
	usage.resized.connect(func() -> void: layout.call_deferred())
	usage.minimum_size_changed.connect(func() -> void: layout.call_deferred())
	mayor = preload("res://ui/mayor_card.gd").new()
	add_child(mayor)
	mayor.action_requested.connect(forward_action)
	reply = preload("res://ui/mayor_reply.gd").new()
	add_child(reply)
	reply.set_toolbar(mayor)
	dock = preload("res://ui/live_dock.gd").new()
	add_child(dock)
	dock.action_requested.connect(forward_action)
	dock.width_changed.connect(func(width: float) -> void:
		preload("res://ui/hud_chrome.gd").dock_layout(host, width)
		# Tight docks use the compact header; never hide and drop slot focus.
		host.hotbar.visible = true
		for control in [host.hotbar, ocean, touch]:
			if is_instance_valid(control): control.offset_right = -width
		compact_chrome.layout()
		dock_width_changed.emit(width))
	pointer = preload("res://ui/build_pointer.gd").new()
	add_child(pointer)
	touch = preload("res://ui/touch_controls.gd").new()
	touch.host = host
	add_child(touch)
	move_child(touch, 0)
	ocean = preload("res://ui/ocean_controls.gd").new()
	add_child(ocean)
	ocean.swim.host = host
	ocean.action_requested.connect(func(_id: String) -> void: host.ocean_interact.emit())
	ocean.helm_requested.connect(func(action: String, held: bool) -> void: host.ocean_helm.emit(action, held))
	var manifest_file := "res://assets/companion-manifest.json"
	if FileAccess.file_exists(manifest_file):
		var manifest = JSON.parse_string(FileAccess.get_file_as_string(manifest_file))
		if manifest is Dictionary: pet_catalog = manifest.get("catalog", [])
	host.modal.pet_catalog = pet_catalog
	compact_chrome.setup(host)
	resized.connect(layout)
	layout()

func _process(_delta: float) -> void:
	compact_chrome.layout()

func layout() -> void:
	if not is_instance_valid(usage): return
	usage.size = Vector2(minf(276, maxf(0, size.x)), usage.get_combined_minimum_size().y)
	var toolbar_clearance := 86.0 if size.x < 1000 else 0.0
	usage.position = Vector2(0, maxf(0, size.y - usage.size.y - toolbar_clearance))

func forward_action(id: String, action: String, payload: Dictionary) -> void:
	if action == "settings":
		host.open_panel("Town settings")
		return
	if action == "follow" and host.is_menu_open and not payload.get("keep_panel", false): host.close_panel()
	if action == "terminal_release": sync_visibility()
	action_requested.emit(id, action, payload)

func selected_record() -> Dictionary:
	for entry in entries:
		if str(entry.get("id", "")) == selected_id: return entry
	return {}

func set_companions(data: Array, selected: String) -> void:
	if selected_id != selected: selected_usage = {}
	entries = data
	selected_id = selected
	host.set_companion_count(data.size())
	host.roster.set_data(data, selected)
	var modal_changed: bool = host.modal.companions != data or host.modal.selected_id != selected
	host.modal.companions = data.duplicate(true)
	host.modal.selected_id = selected
	var record := selected_record()
	dock.set_record(record)
	var ordinary: bool = not record.is_empty() and record.get("source", "") != "mayor" and selected != "pet-town-mayor"
	if ordinary:
		if not is_instance_valid(profile):
			profile = preload("res://ui/companion_pages.gd").profile_toolbar(record)
			add_child(profile)
			profile.connect("action_requested", Callable(self, "forward_action"))
		else: profile.call("set_record", record)
	elif is_instance_valid(profile):
		remove_child(profile)
		profile.queue_free()
		profile = null
	if modal_changed and host.modal.visible and host.modal.selected_tab == "Companions": host.modal.refresh_companions()
	_render_usage()
	sync_visibility()

func set_usage(data: Dictionary, selected: Dictionary = {}) -> void:
	var next := data.duplicate(true)
	if not preload("res://ui/coin_format.gd").known(next.get("coins", {})) and preload("res://ui/coin_format.gd").known(usage_snapshot.get("coins", {})):
		next.coins = usage_snapshot.coins.duplicate()
		next.coinSyncUnavailable = true
	usage_snapshot = next
	selected_usage = selected
	host.modal.set_usage_snapshot(usage_snapshot)
	_render_usage()

func _render_usage() -> void:
	var record := selected_record()
	var reading := selected_usage
	if reading.is_empty(): reading = usage_snapshot.get("byAgent", {}).get(selected_id, {})
	usage.render_combined(usage_snapshot, reading, Style.text_or(record.get("label"), "Companion") if not record.is_empty() else "", Style.text_or(record.get("model")))
	layout.call_deferred()

func toggle_usage() -> void:
	usage.toggle_overlay_visible()
	host.modal.usage_visible = usage.overlay_visible_by_intent

func set_usage_visible(value: bool) -> void:
	usage.set_overlay_visible(value)
	host.modal.usage_visible = value

func sync_visibility() -> void:
	var allowed: bool = not host.is_menu_open and host.root.visible
	usage.set_visibility_allowed(allowed)
	dock.visible = allowed and not selected_id.is_empty() and selected_id != "pet-town-mayor" and dock.terminal_visible
	mayor.visible = selected_id == "pet-town-mayor" and (allowed or host.active_panel == "Town settings")
	if is_instance_valid(profile):
		profile.call("set_terminal_mode", dock.terminal_visible)
		profile.visible = allowed and not dock.terminal_visible
	pointer.visible = allowed and selected_id.is_empty()
	ocean.visible = allowed
	if not allowed: ocean.release_controls(); touch.release_controls()
	update_reply_anchor()
	dock.layout()

func update_reply_anchor() -> void:
	var anchor: Control
	if selected_id == "pet-town-mayor" and not host.is_menu_open and host.root.visible:
		anchor = labels.labels.get("pet-town-mayor")
	reply.set_head_label(anchor)

func set_mayor(data: Dictionary) -> void:
	mayor.set_state(data)
	reply.set_latest_reply(mayor.latest_reply)
	sync_visibility()

func set_terminal(data: Dictionary, defer_view := false) -> void:
	dock.set_terminal(data, defer_view)
	if not defer_view: sync_visibility()

func refresh_terminal() -> void:
	dock.refresh_terminal()
	sync_visibility()

func set_build_pointer(point: Vector2, state: String, _material := "") -> void:
	pointer.set_target(point, state)
