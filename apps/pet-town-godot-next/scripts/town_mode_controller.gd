class_name TownModeController
extends Node

signal mode_changed(mode: String)

const VERSION := 1
const MODES := ["chill", "build"]
const FILE_NAME := "town-mode.json"

var current_mode := ""
var editor: WorkshopEditor
var catalog: WorkshopCatalog
var wallet: BuildWallet

func configure(builder: WorkshopEditor, source: WorkshopCatalog, balance: BuildWallet) -> void:
	editor = builder
	catalog = source
	wallet = balance

func path() -> String:
	var test_dir := OS.get_environment("PET_TOWN_TEST_DATA_DIR")
	return test_dir.path_join(FILE_NAME) if not test_dir.is_empty() else "user://" + FILE_NAME

func load_initial_mode() -> String:
	if not FileAccess.file_exists(path()):
		return "chill"
	var file := FileAccess.open(path(), FileAccess.READ)
	if file == null:
		return "chill"
	var parsed = JSON.parse_string(file.get_as_text())
	if parsed is Dictionary and int(parsed.get("version", 0)) == VERSION and parsed.get("mode") in MODES:
		return String(parsed["mode"])
	return "chill"

func set_mode(value: String) -> bool:
	if value not in MODES or editor == null:
		return false
	if value == current_mode:
		return true
	if not editor.reload_mode_layout(value):
		return false
	current_mode = value
	_save_mode()
	mode_changed.emit(value)
	return true

func _save_mode() -> bool:
	var location := ProjectSettings.globalize_path(path())
	if DirAccess.make_dir_recursive_absolute(location.get_base_dir()) != OK:
		return false
	var temporary := location + ".tmp"
	var file := FileAccess.open(temporary, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify({"version": VERSION, "mode": current_mode}, "  ") + "\n")
	file.flush()
	file.close()
	return DirAccess.rename_absolute(temporary, location) == OK
