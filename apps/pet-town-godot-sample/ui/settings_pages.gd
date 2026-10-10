extends RefCounted

const Content = preload("res://ui/settings_content.gd")
const Palette = preload("res://ui/settings_style.gd")
const GUIDES := [
	["GETTING AROUND", [["Walk", "W A S D"], ["Jump · hold to glide", "Space"], ["Run", "Shift"], ["Turn camera", "Q E"], ["Look around", "Right drag"], ["Zoom", "Scroll"]]],
	["SWIMMING", [["Dive · hold", "X"], ["Rise · hold", "Space"], ["Stay at depth", "Release both"], ["Materials", "Build button"]]],
	["BUILDING", [["Place / break", "Right / Left click"], ["Choose block", "1 … ="], ["Cycle blocks", "Shift + scroll"], ["Copy a block", "Middle click"], ["Undo / redo", "Ctrl Z / Ctrl ⇧ Z"]]],
	["FRIENDS & WORLD", [["Pet a friend", "F"], ["Take a photo", "P"], ["World sound", "M"], ["World volume", "[ ]"], ["Lock mouse", "L"], ["Call Mayor", "⌥ M"], ["Cycle companions", "⌥ A"], ["Usage", "⌥ T"], ["Town settings", "H"], ["Journal", "J"], ["Asset library", "K"]]]
]

static func help(body: VBoxContainer) -> void:
	Content.intro(body, "MAKE YOURSELF AT HOME", "How to play", "A few little shortcuts for your time in town.")
	for group in GUIDES:
		Content.section(body, group_title(str(group[0])))
		for entry in group[1]:
			var row := HBoxContainer.new()
			row.custom_minimum_size.y = 44
			row.add_theme_constant_override("separation", 12)
			body.add_child(row)
			var label := Palette.ink_label(entry[0], 13)
			label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			label.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			row.add_child(label)
			var key := Palette.ink_label(entry[1], 11)
			key.add_theme_stylebox_override("normal", Palette.box("eee5d1", "dfceb0", 8, 9, 9, 5, 5))
			key.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			row.add_child(key)
			body.add_child(Palette.divider())

static func group_title(text: String) -> String:
	var lower := text.to_lower()
	return lower.substr(0, 1).to_upper() + lower.substr(1)

static func world(body: VBoxContainer, host: Control) -> void:
	Content.intro(body, "SETTLE INTO YOUR TOWN", "World", "Sound and display preferences for your time in town.")
	Content.section(body, "Town sound")
	Content.toggle(body, "Music & town sounds · M", host.sound_enabled, func(enabled: bool) -> void:
		host.sound_enabled = enabled
		host.sound_toggled.emit(enabled))
	body.add_child(Palette.ink_label("Mayor voice has its own controls.", 11, Palette.QUIET))
	var amount := Palette.ink_label("World volume · %d%%" % (host.volume * 100), 12, Palette.QUIET)
	body.add_child(amount)
	var slider := HSlider.new()
	Palette.slider(slider)
	slider.accessibility_name = "World volume"
	slider.accessibility_description = "World sound only. Mayor voice has its own controls."
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.min_value = 0
	slider.max_value = 100
	slider.value = host.volume * 100
	slider.value_changed.connect(func(value: float) -> void:
		host.volume = value / 100.0
		amount.text = "World volume · %d%%" % value
		host.volume_changed.emit(host.volume))
	body.add_child(slider)
	Content.section(body, "Town display")
	Content.toggle(body, "Show coins & usage · ⌥ T", host.usage_visible, func(shown: bool) -> void:
		host.usage_visible = shown
		host.usage_toggled.emit(shown))
	Content.section(body, "")
	Content.note(body, "✓  Your builds are saved on this device.\n\nReset world opens a separate confirmation.")
