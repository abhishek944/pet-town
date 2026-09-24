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
	if not arguments.is_empty() and arguments[0] == "help":
		town.call("_toggle_help", true)
		print("TOWN UI VISUAL help")
		return
	if not arguments.is_empty() and arguments[0] == "details":
		town.set_process(false)
		town.set("selected_id", "preview-companion")
		town.set("agents_by_id", {"preview-companion": {"label": "Willow", "status": "working", "source": "herdr"}})
		town.call("_open_details")
		print("TOWN UI VISUAL details")
		return
	var section := int(arguments[0]) if not arguments.is_empty() else 0
	town.call("_open_settings_section", section)
	print("TOWN UI VISUAL section=", section)
