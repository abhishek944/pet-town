extends Control

signal action_requested(id: String, action: String, payload: Dictionary)
signal dock_width_changed(width: float)
const Style = preload("res://ui/hud_style.gd")
var host: CanvasLayer
var entries: Array = []
var selected_id := ""
var usage: ScrollContainer
var usage_column: VBoxContainer
var town: PanelContainer
var followed: PanelContainer
var mayor: PanelContainer
var dock: PanelContainer
var pointer: Control
var pet_catalog: Array = []
var ocean: Control
var touch: Control
var labels: Control

func setup(hud: CanvasLayer) -> void:
	host = hud
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	labels = preload("res://ui/companion_labels.gd").new()
	labels.host = host
	host.root.add_child(labels)
	host.root.move_child(labels, 0)
	labels.action_requested.connect(func(id: String) -> void: forward_action(id, "follow", {}))
	usage = ScrollContainer.new()
	usage.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(usage)
	var column := VBoxContainer.new()
	usage_column = column
	column.size_flags_horizontal = SIZE_EXPAND_FILL
	column.add_theme_constant_override("separation", 10)
	usage.add_child(column)
	town = preload("res://ui/usage_card.gd").new()
	column.add_child(town)
	town.resized.connect(func() -> void: layout.call_deferred())
	followed = preload("res://ui/usage_card.gd").new()
	column.add_child(followed)
	followed.resized.connect(func() -> void: layout.call_deferred())
	followed.hide()
	mayor = preload("res://ui/mayor_card.gd").new()
	add_child(mayor)
	mayor.action_requested.connect(forward_action)
	dock = preload("res://ui/live_dock.gd").new()
	add_child(dock)
	dock.action_requested.connect(forward_action)
	dock.width_changed.connect(func(width: float) -> void: dock_width_changed.emit(width))
	pointer = preload("res://ui/build_pointer.gd").new()
	add_child(pointer)
	touch = preload("res://ui/touch_controls.gd").new()
	touch.host = host
	add_child(touch)
	move_child(touch, 0)
	ocean = preload("res://ui/ocean_controls.gd").new()
	add_child(ocean)
	ocean.action_requested.connect(func(_id: String) -> void: host.ocean_interact.emit())
	ocean.helm_requested.connect(func(action: String, held: bool) -> void: host.ocean_helm.emit(action, held))
	var manifest_file := "res://assets/companion-manifest.json"
	if FileAccess.file_exists(manifest_file):
		var manifest = JSON.parse_string(FileAccess.get_file_as_string(manifest_file))
		if manifest is Dictionary: pet_catalog = manifest.get("catalog", [])
	host.modal.pet_catalog = pet_catalog
	resized.connect(layout)
	layout()
	usage.hide()

func layout() -> void:
	var compact := size.x < 700 or size.y < 600
	usage.position = Vector2(14 if compact else 24, 160)
	usage.size = Vector2(minf(235 if compact else 282, size.x - 28), maxf(40, size.y - 280))
	usage.set_anchors_and_offsets_preset(PRESET_BOTTOM_LEFT)
	usage.offset_left = 14 if compact else 24
	usage.offset_right = usage.offset_left + minf(235 if compact else 282, size.x - 28)
	usage.offset_top = -minf(usage_column.get_combined_minimum_size().y, maxf(40, size.y - 280)) - 118
	usage.offset_bottom = -118

func forward_action(id: String, action: String, payload: Dictionary) -> void:
	if action == "settings":
		host.open_panel("Town settings")
		return
	if action == "follow" and host.is_menu_open and not payload.get("keep_panel", false): host.close_panel()
	action_requested.emit(id, action, payload)

func set_companions(data: Array, selected: String) -> void:
	entries = data
	selected_id = selected
	host.set_companion_count(data.size())
	host.roster.set_data(data, selected)
	var modal_changed: bool = host.modal.companions != data or host.modal.selected_id != selected
	host.modal.companions = data.duplicate(true)
	host.modal.selected_id = selected
	var record: Dictionary = {}
	for entry in data:
		if str(entry.id) == selected: record = entry
	dock.set_record(record)
	mayor.visible = record.get("source", "") == "mayor" or selected == "pet-town-mayor"
	if modal_changed and host.modal.visible and host.modal.selected_tab == "Companions": host.modal.refresh_companions()
	sync_visibility()

func set_usage(data: Dictionary, selected: Dictionary = {}) -> void:
	var totals: Dictionary = data.get("totals", {}) if data.get("available", false) else {}
	town.render(totals, "Town usage", "Codex · %d/%d tracked sessions" % [int(data.get("measuredSessions", 0)), int(data.get("trackedSessions", 0))], "Usage collector unavailable" if not data.get("available", false) else "Waiting for recorded usage")
	usage.set_meta("available", not data.is_empty())
	var record: Dictionary = {}
	for entry in entries:
		if str(entry.id) == selected_id: record = entry
	if selected.is_empty(): selected = data.get("byAgent", {}).get(selected_id, {})
	followed.visible = not record.is_empty()
	followed.render(selected, "Following · " + str(record.get("label", "Companion")), str(selected.get("model", "Usage unavailable")), "Usage is currently available for tracked Codex sessions", true)
	sync_visibility()
	layout.call_deferred()

func sync_visibility() -> void:
	usage.visible = usage.get_meta("available", false) and not host.is_menu_open
	dock.visible = not selected_id.is_empty() and selected_id != "pet-town-mayor" and not host.is_menu_open
	mayor.visible = selected_id == "pet-town-mayor" and (not host.is_menu_open or host.active_panel == "Town settings")
	pointer.visible = not host.is_menu_open and selected_id.is_empty()
	ocean.visible = not host.is_menu_open
	if host.is_menu_open: ocean.release_controls(); touch.release_controls()
	dock.layout()

func set_mayor(data: Dictionary) -> void:
	mayor.set_state(data)
	sync_visibility()

func set_terminal(data: Dictionary) -> void:
	dock.set_terminal(data)

func set_build_pointer(point: Vector2, state: String, _material := "") -> void:
	pointer.set_target(point, state)
