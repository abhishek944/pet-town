extends RefCounted

## Shared page hierarchy and controls, following the Time & weather reference.
const S = preload("res://ui/atmosphere_style.gd")
const Palette = preload("res://ui/settings_style.gd")

static func intro(host: VBoxContainer, eyebrow: String, title: String, description: String) -> void:
	host.add_theme_constant_override("separation", 8)
	var copy := VBoxContainer.new()
	copy.add_theme_constant_override("separation", 3)
	host.add_child(copy)
	var kicker := S.label(eyebrow, 9)
	kicker.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	copy.add_child(kicker)
	var heading := S.Base.title(title, 22)
	heading.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	copy.add_child(heading)
	var note := S.label(description, 11)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	copy.add_child(note)
	host.add_child(Palette.spacer(2))

static func section(host: VBoxContainer, title: String) -> void:
	S.section(host, title)

static func toggle(host: VBoxContainer, text: String, value: bool, changed: Callable) -> CheckButton:
	var button := S.toggle(host, text, "", func(_field: String, enabled: bool): changed.call(enabled))
	button.set_pressed_no_signal(value)
	button.remove_meta("field")
	return button

static func note(host: VBoxContainer, text: String) -> void:
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", S.box("edf0da", 10, "d6debd"))
	var label := S.label(text, 11)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	card.add_child(label)
	host.add_child(card)
