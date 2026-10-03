extends PanelContainer

const Style = preload("res://ui/hud_style.gd")
const Format = preload("res://ui/usage_format.gd")
var heading: Button
var total: Label
var subtitle: Label
var details: VBoxContainer
var metrics: Dictionary = {}
var price: Label
var note: Label
var expanded := false
var followed := false
var available := false

func _ready() -> void:
	add_theme_stylebox_override("panel", Style.panel("fff8e9f5", 16, "e9d7b5"))
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 6)
	add_child(column)
	heading = Style.flat_button("Town usage +", "fff8e900", "fff8e900")
	heading.alignment = HORIZONTAL_ALIGNMENT_LEFT
	heading.pressed.connect(func() -> void:
		expanded = not expanded
		details.visible = expanded or followed)
	column.add_child(heading)
	var row := HBoxContainer.new()
	column.add_child(row)
	total = Style.title("—", 25)
	total.size_flags_horizontal = SIZE_EXPAND_FILL
	row.add_child(total)
	row.add_child(Style.text("tokens", 12, "817258"))
	subtitle = Style.text("Usage unavailable", 11, "54703d")
	subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(subtitle)
	details = VBoxContainer.new()
	details.add_theme_constant_override("separation", 4)
	column.add_child(details)
	for metric in [["inputTokens", "Input"], ["outputTokens", "Output"], ["cachedInputTokens", "Cached input"], ["reasoningOutputTokens", "Reasoning"]]:
		var line := HBoxContainer.new()
		details.add_child(line)
		var label := Style.text(metric[1], 12, "817258")
		label.size_flags_horizontal = SIZE_EXPAND_FILL
		line.add_child(label)
		metrics[metric[0]] = Style.text("—", 12)
		line.add_child(metrics[metric[0]])
	price = Style.text("", 11, "54703d")
	price.tooltip_text = "Published Codex standard credit rates. Not billed cost or subscription allowance."
	details.add_child(price)
	note = Style.text("", 10, "817258")
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	details.add_child(note)
	details.hide()

func render(reading: Dictionary, name: String, model: String, fallback: String, is_followed := false) -> void:
	followed = is_followed
	available = reading.get("status", "") in ["measured", "partial"]
	heading.text = name if followed else name + (" −" if expanded else " +")
	heading.disabled = followed
	total.text = Format.compact(reading.get("totalTokens", null)) if available else "—"
	total.tooltip_text = "%s tokens" % Format.count(reading.get("totalTokens")) if available and Format.valid(reading.get("totalTokens")) else "Usage unavailable"
	subtitle.text = model
	for key in metrics:
		metrics[key].text = Format.count(reading.get(key)) if available else "—"
		metrics[key].get_parent().visible = available
	var estimate = reading.get("estimatedCredits", null)
	price.text = "Est. standard credits · %s" % Format.credits(estimate)
	price.visible = available
	note.text = ("Partial readings · some usage is unavailable" if reading.status == "partial" else "Recorded usage · cached input is included in input") if available else fallback
	details.visible = expanded or followed
