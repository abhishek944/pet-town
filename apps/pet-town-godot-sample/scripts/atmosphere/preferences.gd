extends RefCounted
const PATH := "user://preferences.cfg"
static func load_state(config: ConfigFile) -> Dictionary:
	var result := {}
	if config.has_section("atmosphere"):
		for key in config.get_section_keys("atmosphere"):
			result[key] = config.get_value("atmosphere", key)
	return result
static func save_state(config: ConfigFile, state: Dictionary) -> Error:
	var previous := load_state(config)
	for key in state: config.set_value("atmosphere", key, state[key])
	var error := config.save(PATH + ".tmp")
	if error == OK:
		error = DirAccess.rename_absolute(ProjectSettings.globalize_path(PATH + ".tmp"), ProjectSettings.globalize_path(PATH))
	if error != OK:
		config.erase_section("atmosphere")
		for key in previous: config.set_value("atmosphere", key, previous[key])
	return error
