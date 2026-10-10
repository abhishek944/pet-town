extends RefCounted
## Battle records never share a world/care/usage file. Publish only after atomic rename.
const FILE := "user://battle-results.json"
const RULES := "solo-v1"
var history: Array = []
var bests := {}
var notice := ""
var blocked := false

func read() -> void:
	if not FileAccess.file_exists(FILE): return
	var data = JSON.parse_string(FileAccess.get_file_as_string(FILE))
	if not valid(data):
		var backup := FILE + ".unreadable-" + str(Time.get_unix_time_from_system())
		blocked = DirAccess.rename_absolute(FILE, backup) != OK
		notice = "Battle history could not be read. " + ("The original file is preserved; saving is unavailable." if blocked else "The original was preserved for recovery; new results can be saved.")
		return
	history = data.history
	bests = data.bests

func valid(data: Variant) -> bool:
	if not data is Dictionary or data.get("schema") != 1: return false
	if not data.get("history") is Array or not data.get("bests") is Dictionary: return false
	if data.history.size() > 20 or data.bests.size() > 20: return false
	var ids := {}
	for row in data.history:
		if not valid_row(row) or ids.has(row.id): return false
		ids[row.id] = true
	for key in data.bests:
		var row = data.bests[key]
		if not valid_row(row) or row.outcome != "Completed" or key != version(row): return false
	return true

func valid_row(row: Variant) -> bool:
	if not row is Dictionary: return false
	for key in ["id", "timestamp", "starter", "arena", "rules", "outcome"]:
		if not row.get(key) is String or row[key].is_empty(): return false
	if row.outcome not in ["Completed", "Defeated", "Abandoned"]: return false
	for key in ["kills", "pet", "wildlife", "elapsed"]:
		if not (row.get(key) is float or row.get(key) is int) or not is_finite(float(row[key])) or row[key] < 0: return false
	if row.pet > 100 or row.wildlife > 100 or row.elapsed > 300 or row.kills != floor(row.kills): return false
	if row.outcome == "Abandoned": return row.get("score") == null
	if not (row.get("score") is int or row.get("score") is float): return false
	return row.score == score(row.outcome, row.kills, row.pet, row.wildlife)

static func score(outcome: String, kills: int, pet: float, wildlife: float) -> int:
	return floori(10 * kills + (3 * pet + 2 * wildlife + 500 if outcome == "Completed" else 0))

static func version(row: Dictionary) -> String:
	return str(row.arena) + ":" + str(row.rules)

func best(arena: String) -> int:
	return int(bests.get(arena + ":" + RULES, {}).get("score", -1))

func save(row: Dictionary) -> bool:
	if blocked or not valid_row(row): return false
	for previous in history:
		if previous.id == row.id: return true
	var next := history.duplicate(true)
	next.push_front(row.duplicate(true))
	next.resize(mini(20, next.size()))
	var records := bests.duplicate(true)
	var key := version(row)
	if row.outcome == "Completed" and row.score > records.get(key, {}).get("score", -1): records[key] = row.duplicate(true)
	while records.size() > 20: records.erase(records.keys()[0])
	var temp := FILE + ".tmp"
	var output := FileAccess.open(temp, FileAccess.WRITE)
	if not output: return false
	output.store_string(JSON.stringify({"schema": 1, "history": next, "bests": records}))
	output.flush()
	var ok := output.get_error() == OK
	output.close()
	if not ok or DirAccess.rename_absolute(temp, FILE) != OK: return false
	history = next
	bests = records
	return true
