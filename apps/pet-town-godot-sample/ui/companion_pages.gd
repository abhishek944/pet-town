extends RefCounted

const Style = preload("res://ui/hud_style.gd")

static func profile(body: VBoxContainer, host: Control) -> void:
	var record: Dictionary = {}
	for entry in host.companions:
		if str(entry.id) == host.selected_id: record = entry
	var profile := HFlowContainer.new()
	body.add_child(profile)
	if not record.is_empty(): profile.add_child(Style.portrait(record, Vector2(53, 53)))
	var identity := VBoxContainer.new()
	identity.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	profile.add_child(identity)
	identity.add_child(Style.title(record.get("label", "Choose a companion")))
	identity.add_child(Style.text("Following · " + str(record.get("status", "")) if not record.is_empty() else "Pick someone from the list.", 12))
	var picker := OptionButton.new()
	picker.add_item("Choose a companion")
	for entry in host.companions: picker.add_item(str(entry.get("label", "Companion")))
	picker.select(1 + host.companions.find(record) if not record.is_empty() else 0)
	picker.item_selected.connect(func(index: int) -> void:
		if index > 0: host.companion_action.emit(str(host.companions[index-1].id), "follow", {"keep_panel": true}))
	profile.add_child(picker)
	var appearance := HBoxContainer.new()
	body.add_child(appearance)
	var copy := VBoxContainer.new()
	copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	copy.add_child(Style.label("Your pet", 13))
	copy.add_child(Style.text("Choose a companion to change its pet." if record.is_empty() else str(record.get("petId", "Woodland friend")).capitalize(), 12))
	appearance.add_child(copy)
	var change := Style.flat_button("Change pet")
	change.pressed.connect(func() -> void: host.show_pet_gallery())
	appearance.add_child(change)
	var control := Style.flat_button("Release control  C" if record.get("controlled", false) else "Control  C")
	control.disabled = record.is_empty()
	control.pressed.connect(func() -> void: host.companion_action.emit(host.selected_id, "control", {}))
	var tiles := HFlowContainer.new()
	tiles.add_theme_constant_override("h_separation", 14)
	body.add_child(tiles)
	var control_tile := tile(tiles)
	var camera_tile := tile(tiles)
	control_tile.add_child(Style.label("Companion control", 13))
	control_tile.add_child(Style.text("Walk and jump with your companion." if not record.is_empty() else "Follow a companion to walk and jump.", 12))
	control_tile.add_child(control)
	camera_tile.add_child(Style.label("Camera view", 13))
	camera_tile.add_child(Style.text("Choose how you see the town.", 12))
	var cameras := HBoxContainer.new()
	camera_tile.add_child(cameras)
	for first in [false, true]:
		var button := Style.flat_button("First person  V" if first else "Third person")
		button.pressed.connect(func() -> void:
			host.camera_requested.emit(first)
			host.companion_action.emit(host.selected_id, "camera", {"first_person": first}))
		cameras.add_child(button)
	var actions := HBoxContainer.new()
	body.add_child(actions)
	for action in ["focus", "leave"]:
		var label := "Leave companion  Esc" if action == "leave" else ("Open in Herdr ↗" if record.get("source", "") in ["herdr", "mayor"] else "Open agent ↗")
		var button := Style.flat_button(label)
		button.disabled = record.is_empty()
		button.pressed.connect(func() -> void: host.companion_action.emit(host.selected_id, action, {}))
		actions.add_child(button)
	body.add_child(Style.text("Close this panel to return to the town. Your Mayor conversation stays connected.", 12))

static func tile(parent: Control) -> VBoxContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size.x = minf(314, parent.get_viewport_rect().size.x - 74)
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.add_theme_stylebox_override("panel", Style.panel("f2e8d2", 13, "dfccab", false))
	parent.add_child(panel)
	var content := VBoxContainer.new()
	panel.add_child(content)
	return content
