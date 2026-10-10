extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const Content = preload("res://ui/settings_content.gd")
const Palette = preload("res://ui/settings_style.gd")

## Create the presentation-only B7 toolbar. Connect action_requested to the existing
## native companion action owner; set_terminal_mode hides/restores it without reserving world width.
static func profile_toolbar(record: Dictionary) -> Control:
	if record.is_empty() or bool(record.get("isMayor", false)) or str(record.get("source", "")).to_lower() == "mayor" or str(record.get("id", "")) == "pet-town-mayor":
		return null
	var toolbar = preload("res://ui/companion_profile_toolbar.gd").new()
	toolbar.set_record(record)
	return toolbar

static func profile(body: VBoxContainer, host: Control) -> void:
	var record: Dictionary = {}
	for entry in host.companions:
		if str(entry.id) == host.selected_id: record = entry
	var empty := record.is_empty()
	Content.intro(body, "A LITTLE COMPANY IN TOWN", "Companions", "Choose a friend and make yourself at home.")
	var picker := OptionButton.new()
	Palette.picker(picker, 156)
	picker.accessibility_name = "Choose a companion"
	picker.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	picker.add_item("Choose a companion")
	for entry in host.companions: picker.add_item(str(entry.get("label", "Companion")))
	picker.select(1 + host.companions.find(record) if not empty else 0)
	picker.item_selected.connect(func(index: int) -> void:
		if index > 0: host.companion_action.emit(str(host.companions[index-1].id), "follow", {"keep_panel": true}))
	if empty:
		body.add_child(Palette.paragraph("No companion is selected. Choose an available companion to use its controls."))
		picker.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
		picker.custom_minimum_size = Vector2(160, 44)
		body.add_child(picker)
	else:
		var head := HBoxContainer.new()
		head.add_theme_constant_override("separation", 14)
		body.add_child(head)
		head.add_child(Style.portrait(record, Vector2(60, 64)))
		var identity := VBoxContainer.new()
		identity.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		identity.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		head.add_child(identity)
		identity.add_child(Palette.identity_label(str(record.get("label", "Companion"))))
		identity.add_child(Palette.line_label("Following · " + str(record.get("status", "")).capitalize(), 12, 20, Palette.QUIET))
		head.add_child(picker)
		body.add_child(Palette.spacer(14))
	Content.section(body, "Your companion")
	var pet := Palette.setting(body, "Your pet", pet_hint(host, record, empty), 68, 13, 11, 4)
	var change := Palette.action("Change pet")
	change.pressed.connect(func() -> void: host.show_pet_gallery())
	pet.add_child(change)
	body.add_child(Palette.divider())
	var control_row := Palette.setting(body, "Companion control", "" if empty else "Walk and jump with your companion.", 68, 13, 11, 4)
	var controlled := bool(record.get("controlled", false))
	var control := Palette.action("Release control · C" if controlled else "Control · C", not empty)
	control.disabled = empty
	control.pressed.connect(func() -> void: host.companion_action.emit(host.selected_id, "control", {}))
	control_row.add_child(control)
	body.add_child(Palette.divider())
	var view = record.get("firstPerson")
	var view_known: bool = view is bool
	var camera_row := Palette.setting(body, "Camera view", "" if view_known else "Current view not reported.", 68, 13, 11, 4)
	var cameras := HBoxContainer.new()
	cameras.add_theme_constant_override("separation", 5)
	var first_person: bool = view if view_known else false
	for first in [false, true]:
		var button := Palette.action("First person · V" if first else "Third person", false, 9, 11)
		preload("res://ui/atmosphere_style.gd").selected(button, view_known and first_person == first, true)
		button.pressed.connect(func() -> void:
			host.camera_requested.emit(first)
			host.companion_action.emit(host.selected_id, "camera", {"first_person": first}))
		cameras.add_child(button)
	camera_row.add_child(cameras)
	body.add_child(Palette.divider())
	body.add_child(Palette.spacer(18))
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 10)
	body.add_child(actions)
	var open := Palette.action("Open in Herdr ↗" if record.get("source", "") in ["herdr", "mayor"] else "Open agent ↗")
	open.disabled = empty
	open.pressed.connect(func() -> void: host.companion_action.emit(host.selected_id, "focus", {}))
	actions.add_child(open)
	var gap := Control.new()
	gap.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	actions.add_child(gap)
	var leave := Palette.action("Leave companion · Esc")
	leave.disabled = empty
	leave.pressed.connect(func() -> void: host.companion_action.emit(host.selected_id, "leave", {}))
	actions.add_child(leave)
	if not empty:
		body.add_child(Palette.spacer(12))
		Content.note(body, "Closing settings keeps your companion selected.\nYour Mayor conversation stays connected.")

static func pet_hint(host: Control, record: Dictionary, empty: bool) -> String:
	if empty: return "You can browse the library without applying a pet."
	var pet_id := str(record.get("petId", ""))
	for entry in host.pet_catalog:
		if str(entry.get("id", "")) == pet_id:
			var species := str(entry.get("species", ""))
			if not species.is_empty(): return "%s · %s" % [str(entry.get("name", pet_id.capitalize())), species]
			return str(entry.get("name", pet_id.capitalize()))
	return pet_id.capitalize() if not pet_id.is_empty() else "Woodland friend"
