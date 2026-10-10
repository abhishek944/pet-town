extends Node
signal changed
signal save_failed(message: String)
const Catalog = preload("care_catalog.gd")
const INTERVAL := 300.0
const REMINDER_INTERVAL := 1800.0
var catalog: Array = []
var records: Dictionary = {}
var cooldown := 0.0
var store := preload("care_store.gd").new()
var dirty := false
var save_seconds := 0.0
var failure_reported := false

func setup() -> void:
	catalog = Catalog.entries()
	var saved := store.read()
	cooldown = clampf(float(saved.get("reminderCooldown", 0)), 0, REMINDER_INTERVAL)
	for entry in catalog:
		var record: Dictionary = saved.get("species", {}).get(entry.id, {})
		records[entry.id] = {"happiness": int(clampf(float(record.get("happiness", 80)), 20, 100)),
			"seconds": clampf(float(record.get("seconds", 0)), 0, INTERVAL - 0.000001),
			"reminded": bool(record.get("reminded", false))}
	if not store.error.is_empty(): save_failed.emit(store.error)

func advance(seconds: float) -> void:
	if not is_finite(seconds) or seconds <= 0: return
	cooldown = maxf(0, cooldown - seconds)
	var moved := false
	for record in records.values():
		if record.happiness <= 20: continue
		record.seconds += seconds
		var ticks := int(record.seconds / INTERVAL)
		if ticks > 0:
			record.happiness = maxi(20, record.happiness - ticks)
			record.seconds = fmod(record.seconds, INTERVAL) if record.happiness > 20 else 0.0
			moved = true
	dirty = true
	save_seconds += seconds
	if moved: changed.emit()
	if save_seconds >= 30: flush()

func pet(id: String) -> void:
	if not records.has(id): return
	records[id] = {"happiness": 100, "seconds": 0.0, "reminded": false}
	dirty = true
	changed.emit()
	flush()

func eligible() -> Array:
	var result: Array = []
	if cooldown > 0: return result
	for entry in catalog:
		var record: Dictionary = records[entry.id]
		if record.happiness < 40 and not record.reminded: result.append(entry.id)
	return result

func reminded(ids: Array) -> void:
	for id in ids:
		if records.has(id): records[id].reminded = true
	cooldown = REMINDER_INTERVAL
	dirty = true
	flush()

func snapshot(actors: Array) -> Array:
	var counts := {}
	for actor in actors:
		if is_instance_valid(actor):
			var id := str(actor.entry.get("species", ""))
			counts[id] = int(counts.get(id, 0)) + 1
	var result: Array = []
	for entry in catalog:
		var row: Dictionary = entry.duplicate()
		row.happiness = records[entry.id].happiness
		row.mood = Catalog.mood(row.happiness)
		row.count = counts.get(entry.id, 0)
		result.append(row)
	return result

func flush() -> void:
	if not dirty or not store.writable: return
	# Keep dirty progress, but retry periodic failures at the usual cadence.
	save_seconds = 0
	if store.write(records, cooldown):
		dirty = false
		failure_reported = false
	elif not failure_reported:
		failure_reported = true
		save_failed.emit("Wildlife happiness couldn't be saved. Check device storage; this session's progress is still here.")

func _exit_tree() -> void:
	flush()
