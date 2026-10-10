extends Control

const Style = preload("res://ui/hud_style.gd")
const Coins = preload("res://ui/coin_format.gd")
var balance: Dictionary = {}
var label: Label

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	label = Style.text("—", 10, "4c402f")
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	add_child(label)
	resized.connect(queue_redraw)
	set_balance(balance)

func set_balance(value: Dictionary) -> void:
	balance = value
	if is_instance_valid(label): label.text = Coins.percentage(value)
	accessibility_name = "Next coin progress: " + Coins.percentage(value)
	tooltip_text = "Waiting for a saved balance"
	if Coins.known(value): tooltip_text = "%s of 1,000,000 tokens toward the next coin" % preload("res://ui/usage_format.gd").count(value.remainderTokens)
	queue_redraw()

func _draw() -> void:
	var center := size / 2
	var radius := minf(size.x, size.y) / 2 - 3
	draw_arc(center, radius, 0, TAU, 96, Color("ded8c5"), 5, true)
	if Coins.known(balance) and int(balance.remainderTokens) > 0:
		draw_arc(center, radius, -PI / 2, -PI / 2 + TAU * float(balance.remainderTokens) / Coins.RATE, 96, Color("b58628"), 5, true)
