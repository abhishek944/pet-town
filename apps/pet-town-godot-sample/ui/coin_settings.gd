extends VBoxContainer

const Style = preload("res://ui/hud_style.gd")
const Content = preload("res://ui/settings_content.gd")
const Coins = preload("res://ui/coin_format.gd")
var readout: HBoxContainer
var metadata: Label
var coverage: Label
var toggle: Button
var details: VBoxContainer
var totals: VBoxContainer
var sessions: Label
var snapshot: Dictionary = {}

func _ready() -> void:
	add_theme_constant_override("separation", 8)
	Content.intro(self, "YOUR WORK, A LITTLE TREASURE", "Coins & usage", "Your saved balance and the work behind it.")
	Content.section(self, "Your coin balance")
	readout = preload("res://ui/coin_readout.gd").new()
	readout.large = true
	add_child(readout)
	metadata = Style.text("Waiting for recorded usage.", 10)
	metadata.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(metadata)
	coverage = Style.text("", 10, "54703d")
	coverage.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(coverage)
	_divider()
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	var equation := Style.text("1,000,000 tokens = 1 coin", 12, "4c402f")
	equation.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	equation.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	equation.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(equation)
	var fixed := Style.text("Fixed for now", 10)
	var box := Style.panel("f4ead7", 8, "f4ead7", false)
	box.set_content_margin_all(8)
	fixed.add_theme_stylebox_override("normal", box)
	row.add_child(fixed)
	add_child(row)
	add_child(Style.text("Input, output and cached count equally.", 10))
	_divider()
	toggle = Style.flat_button("▸ Token breakdown & sessions", "fff6e400", "fff6e400")
	toggle.alignment = HORIZONTAL_ALIGNMENT_LEFT
	toggle.custom_minimum_size.y = 44
	toggle.add_theme_font_size_override("font_size", 11)
	for state in ["normal", "hover", "pressed"]:
		var toggle_box := toggle.get_theme_stylebox(state).duplicate() as StyleBoxFlat
		toggle_box.set_content_margin_all(0)
		toggle.add_theme_stylebox_override(state, toggle_box)
	toggle.pressed.connect(func() -> void:
		details.visible = not details.visible
		toggle.text = ("▾" if details.visible else "▸") + " Token breakdown & sessions")
	add_child(toggle)
	details = VBoxContainer.new()
	details.add_theme_constant_override("separation", 10)
	add_child(details)
	totals = preload("res://ui/coin_usage_details.gd").new()
	details.add_child(totals)
	sessions = Style.text("", 10)
	sessions.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	details.add_child(sessions)
	var note := Style.text("Existing recorded usage starts your balance once. Earned coins and progress are saved on this device.", 10)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	details.add_child(note)
	details.hide()
	set_snapshot(snapshot)

func _divider() -> void:
	Content.section(self, "")

func set_snapshot(value: Dictionary) -> void:
	snapshot = value
	if not is_instance_valid(readout): return
	var balance: Dictionary = snapshot.get("coins", {})
	readout.set_balance(balance)
	metadata.text = Coins.metadata(balance)
	coverage.text = Coins.coverage(snapshot, true)
	totals.render(snapshot.get("totals", {}), Coins.available(snapshot), "Locally tracked Codex sessions; not account-wide usage.")
	sessions.text = "%s measured · %s tracked sessions" % [preload("res://ui/usage_format.gd").count(snapshot.get("measuredSessions")), preload("res://ui/usage_format.gd").count(snapshot.get("trackedSessions"))]
