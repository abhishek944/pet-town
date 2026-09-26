extends SceneTree

const FOOTPRINT := preload("res://scripts/town_selection_footprint.gd")

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", ProjectSettings.globalize_path("res://../../var/test-checklist/selection-audit"))
	var town := load("res://main.tscn").instantiate() as Node3D
	root.add_child(town)
	var checked := 0
	var failures := 0
	var outliers := []
	for node in get_nodes_in_group("editable_trees"):
		var item := node as UserTree
		if item == null or not item.is_visible_in_tree():
			continue
		checked += 1
		var outline: PackedVector2Array = FOOTPRINT.outline(item)
		if outline.size() < 3:
			failures += 1
			print("INVALID_FOOTPRINT ", item.tree_id)
			continue
		var low := outline[0]
		var high := outline[0]
		for point in outline:
			low = low.min(point)
			high = high.max(point)
		var extent := high - low
		if extent.x > 18.0 or extent.y > 18.0:
			outliers.append("%s: %s" % [item.tree_id, extent])
	print("FOOTPRINT_AUDIT checked=", checked, " invalid=", failures, " wide=", outliers.size())
	for entry in outliers.slice(0, 50):
		print("  ", entry)
	town.free()
	quit(0 if failures == 0 else 1)
