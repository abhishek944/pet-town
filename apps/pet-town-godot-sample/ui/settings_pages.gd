extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const GUIDES := [
	["GETTING AROUND", [["Walk", "W A S D"], ["Jump · hold to glide", "Space"], ["Run", "Shift"], ["Turn camera", "Q E"], ["Look around", "Right drag"], ["Zoom", "Scroll"]]],
	["BUILDING", [["Place / break", "Right / Left click"], ["Choose block", "1 … ="], ["Cycle blocks", "Shift + scroll"], ["Copy a block", "Middle click"], ["Undo / redo", "Ctrl Z / Ctrl ⇧ Z"]]],
	["FRIENDS & WORLD", [["Pet a friend", "F"], ["Take a photo", "P"], ["World sound", "M"], ["World volume", "[ ]"], ["Lock mouse", "L"], ["Call Mayor", "⌥ M"], ["Cycle companions", "⌥ A"], ["Usage", "⌥ T"], ["Town settings", "H"], ["Journal", "J"], ["Asset library", "K"]]]
]

static func help(body: VBoxContainer) -> void:
	var columns := HFlowContainer.new()
	columns.add_theme_constant_override("separation", 24)
	body.add_child(columns)
	for group in GUIDES:
		var column := VBoxContainer.new()
		column.custom_minimum_size.x = minf(214, body.get_viewport_rect().size.x - 74)
		column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		column.add_theme_constant_override("separation", 10)
		columns.add_child(column)
		column.add_child(Style.text(group[0], 10))
		for entry in group[1]:
			var row := HBoxContainer.new()
			row.add_theme_constant_override("separation", 6)
			column.add_child(row)
			var text := Style.text(entry[0], 12, "75664d")
			text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			row.add_child(text)
			var key := Style.label(entry[1], 11)
			var box := Style.panel("fff9e8", 5, "cfc09f", false)
			box.content_margin_left = 6
			box.content_margin_right = 6
			box.content_margin_top = 2
			box.content_margin_bottom = 2
			key.add_theme_stylebox_override("normal", box)
			key.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			row.add_child(key)

static func world(body: VBoxContainer, host: Control) -> void:
	body.add_child(Style.title("World sound"))
	var row := HBoxContainer.new()
	row.custom_minimum_size.y = 56
	body.add_child(row)
	var copy := VBoxContainer.new()
	copy.add_theme_constant_override("separation", 3)
	copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	copy.add_child(Style.label("Music & town sounds", 13))
	copy.add_child(Style.text("Mayor voice has its own controls.", 11))
	row.add_child(copy)
	var mute := Style.flat_button("Sound on  M" if host.sound_enabled else "Muted  M", "eee2c9", "d6c19b")
	mute.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	mute.pressed.connect(func() -> void:
		host.sound_enabled = not host.sound_enabled
		mute.text = "Sound on  M" if host.sound_enabled else "Muted  M"
		host.sound_toggled.emit(host.sound_enabled))
	row.add_child(mute)
	var volume := HBoxContainer.new()
	volume.custom_minimum_size.y = 66
	volume.add_theme_constant_override("separation", 15)
	body.add_child(volume)
	volume.add_child(Style.label("World volume", 13))
	var slider := HSlider.new()
	Style.slider(slider)
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	slider.min_value = 0
	slider.max_value = 100
	slider.value = host.volume * 100
	volume.add_child(slider)
	var amount := Style.label("%d%%" % slider.value, 13)
	amount.custom_minimum_size.x = 38
	volume.add_child(amount)
	slider.value_changed.connect(func(value: float) -> void:
		host.volume = value / 100.0
		amount.text = "%d%%" % value
		host.volume_changed.emit(host.volume))
	var usage := Style.flat_button("Hide usage  ⌥ T" if host.usage_visible else "Show usage  ⌥ T")
	usage.custom_minimum_size.y = 44
	usage.pressed.connect(func() -> void:
		host.usage_visible = not host.usage_visible
		usage.text = "Hide usage  ⌥ T" if host.usage_visible else "Show usage  ⌥ T"
		host.usage_toggled.emit(host.usage_visible))
	body.add_child(usage)
	var note := Style.text("Your builds are saved on this device.\nReset world opens a separate confirmation.", 12)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(note)
	var shortcuts := PanelContainer.new()
	shortcuts.add_theme_stylebox_override("panel", Style.panel("edf0da", 12, "d6debd", false))
	var hint := Style.text("J opens Journal    K opens Asset library", 12, "486344")
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	shortcuts.add_child(hint)
	body.add_child(shortcuts)
