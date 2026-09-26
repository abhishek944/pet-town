extends SceneTree

func _initialize() -> void:
	for info in ProjectSettings.get_property_list():
		var key := String(info["name"])
		if "shadow" in key and ("size" in key or "atlas" in key):
			print("RENDER_SETTING ", key, " = ", ProjectSettings.get_setting(key))
	quit()
