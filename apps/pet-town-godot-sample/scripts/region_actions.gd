extends Node

var sample: Node3D
var library: Node3D
var journal: Node

func setup(value: Node3D, budget: RefCounted = null) -> void:
	sample = value
	var raw = JSON.parse_string(FileAccess.get_file_as_string("res://scripts/actions/source-data.json"))
	library = preload("res://scripts/actions/asset_placement.gd").new()
	add_child(library)
	await library.setup(sample, raw.assets, budget)
	journal = preload("res://scripts/actions/trail_journal.gd").new()
	add_child(journal)
	await journal.setup(sample, raw.places, raw.get("shells", []), budget)
	sample.hud.asset_place_requested.connect(library.place)
	sample.hud.asset_undo_requested.connect(library.undo)
	sample.hud.asset_preview_requested.connect(library.preview)
	sample.hud.journal_action.connect(journal.perform)
	sample.hud.asset_replace_requested.connect(library.replacements.replace)
	sample.hud.asset_restore_requested.connect(library.replacements.restore_original)
	sample.hud.asset_replace_preview_requested.connect(library.replacements.preview)

func reset() -> void:
	if library:
		library.reset()
	if journal:
		journal.reset()

func set_following(value: bool) -> void:
	if journal:
		journal.following = value
		if value: journal.fishing.cancel()
		journal.refresh()
