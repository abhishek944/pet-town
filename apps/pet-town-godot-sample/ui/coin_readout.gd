extends HBoxContainer

const Style = preload("res://ui/hud_style.gd")
const Coins = preload("res://ui/coin_format.gd")
var large := false
var number: Label
var progress: Control
var balance: Dictionary = {}

func _ready() -> void:
	add_theme_constant_override("separation", 10 if large else 9)
	var icon := preload("res://ui/coin_icon.gd").new()
	icon.custom_minimum_size = Vector2(32, 32) if large else Vector2(26, 26)
	icon.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	add_child(icon)
	number = Style.title("—", 38 if large else 28)
	number.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	add_child(number)
	var unit := Style.text("coins", 12 if large else 11)
	unit.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	add_child(unit)
	progress = preload("res://ui/coin_progress.gd").new()
	progress.custom_minimum_size = Vector2(52, 52) if large else Vector2(44, 44)
	progress.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	add_child(progress)
	if large: progress.label.add_theme_font_size_override("font_size", 12)
	set_balance(balance)

func set_balance(value: Dictionary) -> void:
	balance = value
	if not is_instance_valid(number): return
	number.text = preload("res://ui/usage_format.gd").count(value.get("wholeCoins")) if Coins.known(value) else "—"
	number.tooltip_text = "Saved coin balance · " + number.text
	# Leave room for the ring at the selected 276px card width.
	number.add_theme_font_size_override("font_size", 38 if large else (23 if number.text.length() > 5 else 28))
	progress.set_balance(value)
