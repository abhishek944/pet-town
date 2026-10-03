extends RefCounted

const Save = preload("save_file.gd")
const PATH := "user://region-journal.json"
const FISH := ["Pebble Minnow", "Silver Willowfin", "Amber Sunperch"]
const WISHES := ["Kindness", "Courage", "Calm"]
var state := {"version": 1, "stamps": [], "garden": 0, "fish": [], "catches": 0, "lanterns": [], "shells": [], "favorite": ""}
var available := true
var report: Callable

func setup(notify: Callable, places: Array, shells: Array) -> void:
	report = notify
	var saved := Save.read(PATH)
	if saved.has("error"):
		fail(saved.error)
		return
	var data: Dictionary = saved.value
	if data.is_empty(): return
	if not valid(data):
		fail("Saved journal progress could not be read. The original file has been kept.")
		return
	for place in places:
		if place.id in data.stamps: state.stamps.append(place.id)
	state.garden = clampi(int(data.get("garden", 0)), 0, 3)
	state.catches = int(data.get("catches", 0))
	for fish in FISH:
		if fish in data.get("fish", []): state.fish.append(fish)
	for wish in data.get("lanterns", []):
		if wish in WISHES and state.lanterns.size() < 8: state.lanterns.append(wish)
	for shell in shells:
		if shell.id in data.get("shells", []): state.shells.append(shell.id)
	var favorite = data.get("favorite", "")
	if favorite in state.shells: state.favorite = favorite

func valid(data: Dictionary) -> bool:
	if data.get("version") != 1 or not data.get("stamps") is Array: return false
	for key in ["fish", "lanterns", "shells"]:
		if data.has(key) and not data[key] is Array: return false
	for key in ["garden", "catches"]:
		var number = data.get(key, 0)
		if not (number is float or number is int) or not is_finite(float(number)) or float(number) != floorf(float(number)) or number < 0: return false
	return data.get("catches", 0) <= 9007199254740991

func fail(message: String) -> void:
	available = false
	report.call(message)

func commit(next: Dictionary) -> bool:
	if not available: return false
	if not Save.write(PATH, next):
		report.call("Your journal progress could not be saved. Check device storage and try again; your progress has been kept.")
		return false
	state = next
	return true

func stamp(id: String) -> bool:
	if id in state.stamps: return true
	var next: Dictionary = state.duplicate(true)
	next.stamps.append(id)
	return commit(next)

func grow() -> bool:
	if state.garden >= 3: return false
	var next: Dictionary = state.duplicate(true)
	next.garden += 1
	return commit(next)

func catch_fish() -> String:
	var next: Dictionary = state.duplicate(true)
	var fish: String = FISH[next.catches % FISH.size()]
	if fish not in next.fish: next.fish.append(fish)
	next.catches += 1
	return fish if commit(next) else ""

func hang(wish: String) -> bool:
	if wish not in WISHES or state.lanterns.size() >= 8: return false
	var next: Dictionary = state.duplicate(true)
	next.lanterns.append(wish)
	return commit(next)

func collect(id: String) -> bool:
	if id in state.shells: return false
	var next: Dictionary = state.duplicate(true)
	next.shells.append(id)
	if next.favorite.is_empty(): next.favorite = id
	return commit(next)

func feature(id: String) -> bool:
	if id not in state.shells: return false
	var next: Dictionary = state.duplicate(true)
	next.favorite = id
	return commit(next)

func reset() -> bool:
	var empty := {"version": 1, "stamps": [], "garden": 0, "fish": [], "catches": 0, "lanterns": [], "shells": [], "favorite": ""}
	if not Save.write(PATH, empty):
		report.call("The journal reset could not be saved. Your progress has been kept.")
		return false
	state = empty
	available = true
	return true
