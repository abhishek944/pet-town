extends RefCounted
const S = preload("res://ui/atmosphere_style.gd")
static func build(page: VBoxContainer) -> void:
	page.time_summary = S.heading(page,"How time passes")
	S.choices(page,"mode",[["running","Running clock"],["held","Hold a time"]],page.choose,0,true)
	page.running = VBoxContainer.new()
	page.add_child(page.running)
	S.choices(page.running,"pace",[["fast","Fast\n16 min / day"],["medium","Medium\n1 hour / day"],["slow","Slow\n4 hours / day"]],page.choose)
	page.held = VBoxContainer.new()
	page.add_child(page.held)
	S.choices(page.held,"held_preset",[["early_morning","◒\nEarly morning\n5:30 AM"],["morning","☀\nMorning\n9:00 AM"],
		["noon","☀\nNoon\n12:00 PM"],["afternoon","◕\nAfternoon\n3:00 PM"],["evening","◑\nEvening\n5:00 PM"],
		["dusk","◓\nDusk\n6:30 PM"],["night","☾\nNight\n10:00 PM"]],page.choose,4)
	page.held.add_child(S.label("The sun and clock stay here. Life and weather keep moving.",9))
