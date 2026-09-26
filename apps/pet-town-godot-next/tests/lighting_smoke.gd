extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var catalog := WorkshopCatalog.new()
	var errors := []
	if not catalog.load_all():
		errors.append("catalog did not load")
	var editor := WorkshopEditor.new()
	root.add_child(editor)
	editor.catalog = catalog
	var lighthouse := editor.create_object("lighthouse", "light-test")
	var lamp := editor.create_object("street-lantern", "lamp-test")
	if lighthouse == null or lamp == null:
		errors.append("lighting objects did not instantiate")
	else:
		var pivot := lighthouse.model.find_child("LighthouseBeacon", true, false) as Node3D
		if pivot == null:
			errors.append("lighthouse has no rotating beacon")
		else:
			var beams := pivot.find_children("BeaconBeam*", "SpotLight3D", true, false)
			if beams.size() != 2:
				errors.append("beacon does not light both directions")
			for candidate in beams:
				var beam := candidate as SpotLight3D
				if beam.spot_range * sin(-beam.rotation.x) <= pivot.position.y:
					errors.append("beacon beam does not reach the island")
			var before: float = pivot.rotation.y
			pivot.call("_process", 1.0)
			if pivot.rotation.y == before:
				errors.append("beacon did not rotate")
		var warm := lamp.model.find_child("WarmGlow", true, false) as OmniLight3D
		if warm == null or warm.light_energy < 1.0:
			errors.append("street lantern warm light is too dim or missing")
	print("LIGHTING_SMOKE errors=", errors)
	editor.free()
	quit(0 if errors.is_empty() else 1)
