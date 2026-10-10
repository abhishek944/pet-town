extends Node

const Safe = preload("safe_placement.gd")
const Data = preload("land_journal_data.gd")
var sample: Node3D
var places: Array = []
var progress: RefCounted
var garden: Node3D
var fishing: Node3D
var lanterns: Node3D
var shells: Node3D
var elapsed := 0.0
var following := false
var discovery_delay := 0.0

func setup(value: Node3D, definitions: Array, shell_definitions: Array = [], budget: RefCounted = null) -> void:
	sample = value
	for place in definitions:
		if sample.world.contains(Vector3(place.x, 0, place.z)): places.append(place)
	progress = preload("land_progress.gd").new()
	progress.setup(sample.hud.show_toast, definitions, shell_definitions)
	garden = preload("land_garden.gd").new()
	add_child(garden)
	garden.setup(sample, progress)
	if budget: await budget.checkpoint()
	fishing = preload("land_fishing.gd").new()
	add_child(fishing)
	fishing.setup(sample, self, progress)
	if budget: await budget.checkpoint()
	lanterns = preload("land_lanterns.gd").new()
	add_child(lanterns)
	lanterns.setup(sample, progress)
	if budget: await budget.checkpoint()
	shells = preload("land_shells.gd").new()
	add_child(shells)
	shells.setup(sample, progress, shell_definitions)
	if budget: await budget.checkpoint()
	sample.hud.settings_toggled.connect(panel_changed)
	refresh()

func panel_changed(_open: bool) -> void:
	if sample.hud.active_panel != "Journal": fishing.cancel()
	refresh()

func enabled() -> bool:
	return progress.available and not following and sample.hud.active_panel == "Journal" and get_tree().root.has_focus() and sample.hud.visible and not sample.builder.is_edit_pending()

func _process(delta: float) -> void:
	if not sample: return
	elapsed -= delta
	discovery_delay -= delta
	if elapsed > 0: return
	elapsed = 0.15 if fishing.phase == "nibble" else 0.3
	if not sample.hud.is_menu_open and not following and progress.available and discovery_delay <= 0:
		for place in places:
			if place.id in progress.state.stamps or distance_to(place) > 7.0: continue
			if progress.stamp(place.id):
				sample.hud.show_toast("%s Discovered %s · %d/%d" % [place.icon, place.name, progress.state.stamps.size(), places.size()])
			else:
				discovery_delay = 5
				break
	refresh()

func distance_to(place: Dictionary) -> float:
	var point: Vector3 = sample.actor.global_position
	return Vector2(point.x - place.x, point.z - place.z).length()

func location(id: String) -> String:
	for place in places:
		if place.id == id:
			return "%s · %s%s" % [place.name, "Nearby" if distance_to(place) <= 8 else "%dm away" % roundi(distance_to(place)), " · Best after dusk" if id in ["camp", "lantern-grove"] else ""]
	return ""

func land_data() -> Dictionary:
	return Data.data(self)

func refresh() -> void:
	var data := land_data()
	var ocean = sample.get("ocean")
	if ocean and ocean.has_method("journal_data"):
		var water: Dictionary = ocean.journal_data()
		for key in ["places", "experiences", "collection"]: data[key].append_array(water.get(key, []))
	sample.hud.set_journal_data(data.places, data.experiences, data.collection)
	var reminder := {}
	if fishing.phase != "idle":
		reminder = Data.card("Willowmere fishing", "fish", fishing.message, [Data.action("fish", fishing.label(), fishing.can_fish() and fishing.phase != "waiting")])
	sample.hud.set_journal_reminder(reminder)

func perform(id: String) -> void:
	if id == "photo":
		sample.hud.close_panel()
		sample.take_photo()
		return
	if id.begins_with("visit:"):
		visit(id.trim_prefix("visit:"))
		return
	if enabled():
		if id == "garden": garden.tend()
		elif id == "fish": fishing.perform()
		elif id.begins_with("wish:"): lanterns.hang(id.trim_prefix("wish:"))
		elif id.begins_with("collect:"): shells.collect(id.trim_prefix("collect:"))
		elif id.begins_with("feature:"): shells.feature(id.trim_prefix("feature:"))
	var ocean = sample.get("ocean")
	if ocean and ocean.has_method("perform"):
		if ocean.perform(id) and id.begins_with("ocean-heading:"):
			sample.hud.close_panel()
	refresh()

func visit(id: String) -> void:
	if following:
		sample.hud.show_toast("Choose Leave in Companions before travelling with your explorer.")
		return
	if sample.builder.is_edit_pending():
		sample.hud.show_toast("Your world changes are still saving. Try again in a moment.")
		return
	for place in places:
		if place.id != id: continue
		var point = Safe.travel_point(sample.world, Vector3(place.x, 0, place.z), sample.actor)
		if point == null:
			sample.hud.show_toast("This destination is obstructed by builds or scenery. Clear a little space or walk there along the path.")
			return
		fishing.cancel()
		sample.actor.relocate(point)
		sample.hud.close_panel()
		elapsed = 0
		return

func reset() -> void:
	if progress.reset():
		fishing.cancel()
		elapsed = 0
		refresh()
