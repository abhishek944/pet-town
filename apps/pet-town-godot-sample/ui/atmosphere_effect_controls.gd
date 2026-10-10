extends RefCounted
const S = preload("res://ui/atmosphere_style.gd")
static func build(page: VBoxContainer) -> void:
	S.section(page,"Effects & comfort")
	page.add_child(S.label("Weather intensity",12))
	S.choices(page,"intensity",[["gentle","Gentle\nQuiet, light effects"],["balanced","Balanced\nRich, readable weather"],["dramatic","Dramatic\nDense, stronger effects"]],page.choose)
	page.add_child(S.label("Lightning flashes",12))
	S.choices(page,"lightning",[["off","Off"],["soft","Soft"],["full","Full"]],page.choose,0,true)
	S.toggle(page,"Reduce weather & water motion","reduced_motion",page.choose)
	var row := HBoxContainer.new()
	page.add_child(row)
	var label := S.label("Effect quality",12)
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(label)
	page.quality = OptionButton.new()
	page.quality.custom_minimum_size = Vector2(120,44)
	page.quality.accessibility_name = "Effect quality"
	for title in ["Auto","Low","Medium","High"]: page.quality.add_item(title)
	page.quality.item_selected.connect(func(index: int): page.choose("quality",["auto","low","medium","high"][index]))
	row.add_child(page.quality)
