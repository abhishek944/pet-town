extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var town := load("res://main.tscn").instantiate() as Node3D
	root.add_child(town)
	town.set_process(false)
	town.call("_open_settings_section", 3)
	for frame in 40:
		await process_frame
	var settings := town.get("settings_window") as Control
	var cards := settings.find_children("*", "TownPreview", true, false)
	var live_viewports := settings.find_children("*", "SubViewport", true, false).size()
	var cached := 0
	for card in cards:
		if (card as TownPreview).snapshot != null:
			cached += 1
	var cache_size := TownPreview.snapshots.size()
	settings.call("close_settings")
	town.call("_open_settings_section", 3)
	var reopened_cards := settings.find_children("*", "TownPreview", true, false)
	var reopened_cached := 0
	for card in reopened_cards:
		if (card as TownPreview).snapshot != null:
			reopened_cached += 1
	print("PREVIEW CACHE cards=", cards.size(), " cached=", cached, " live_viewports=", live_viewports, " reopened_cached=", reopened_cached)
	town.free()
	quit(0 if cards.size() >= 20 and cached == cards.size() and live_viewports == 0 and cache_size == cards.size() and reopened_cached == reopened_cards.size() else 1)
