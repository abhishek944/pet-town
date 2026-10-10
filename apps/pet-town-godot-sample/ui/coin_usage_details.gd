extends VBoxContainer

const Style = preload("res://ui/hud_style.gd")
const Format = preload("res://ui/usage_format.gd")
const METRICS := [["uncachedInput", "Input (excluding cached)"], ["cachedInputTokens", "Cached input"], ["outputTokens", "Output (includes reasoning)"], ["reasoningOutputTokens", "Reasoning (part of output)"], ["counted", "Tokens counted once"]]
var values: Dictionary = {}
var model: Label
var price: Label
var note: Label

func _ready() -> void:
	add_theme_constant_override("separation", 7)
	for metric in METRICS:
		var row := HBoxContainer.new()
		var caption := Style.text(metric[1], 10)
		caption.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		caption.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(caption)
		var value := Style.text("—", 10, "4c402f")
		row.add_child(value)
		values[metric[0]] = value
		add_child(row)
	model = Style.text("", 10)
	model.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(model)
	price = Style.text("Est. standard credits · unavailable", 10, "54703d")
	price.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	price.tooltip_text = "Published Codex standard credit rates. Not billed cost or subscription allowance."
	add_child(price)
	note = Style.text("", 9)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(note)

func render(reading: Dictionary, available: bool, context := "") -> void:
	var measured: bool = available and reading.get("status", "") in ["measured", "partial"]
	var metrics := reading.duplicate()
	if Format.valid(reading.get("inputTokens")) and Format.valid(reading.get("cachedInputTokens")):
		metrics.uncachedInput = int(reading.inputTokens) - int(reading.cachedInputTokens)
	if Format.valid(reading.get("inputTokens")) and Format.valid(reading.get("outputTokens")):
		metrics.counted = int(reading.inputTokens) + int(reading.outputTokens)
	for key in values: values[key].text = Format.count(metrics.get(key)) if measured else "—"
	var models: Array = reading.get("models", []) if measured else []
	if models.is_empty() and measured and reading.get("model") is String: models = [reading.model]
	model.text = "Models · " + ", ".join(models) if not models.is_empty() else "Models · unavailable"
	price.text = "Est. standard credits · " + (Format.credits(reading.get("estimatedCredits")) if measured else "unavailable")
	note.text = context + " Cached input is included in input; reasoning is included in output. Credits are estimates, separate from town coins."
