extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var town := load("res://main.tscn").instantiate() as Node3D
	root.add_child(town)
	town.call("_set_town_mode", "chill", false)
	var arguments := OS.get_cmdline_user_args()
	if not arguments.is_empty() and arguments[0] == "command":
		town.call("_open_command_palette")
		print("TOWN UI VISUAL command")
		return
	var section := int(arguments[0]) if not arguments.is_empty() else 0
	town.call("_open_settings_section", section)
	print("TOWN UI VISUAL section=", section)
