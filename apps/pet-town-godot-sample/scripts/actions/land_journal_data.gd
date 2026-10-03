extends RefCounted

static func action(id: String, label: String, enabled := true) -> Dictionary:
	return {"id": id, "label": label, "enabled": enabled}

static func card(title: String, art: String, note: String, actions: Array = [], meta := "") -> Dictionary:
	return {"title": title, "art": art, "note": note, "actions": actions, "meta": meta}

static func data(journal: Node) -> Dictionary:
	var destinations: Array = []
	var experiences: Array = []
	var stamps: Array = []
	var collection: Array = []
	var state: Dictionary = journal.progress.state
	var enabled: bool = journal.enabled()
	for place in journal.places:
		var copy: Dictionary = place.duplicate(true)
		copy.visited = place.id in state.stamps
		copy.action = "visit:" + place.id
		copy.action_label = "Visit →"
		copy.enabled = not journal.following
		var point: Vector3 = journal.sample.actor.global_position
		var dx: float = place.x - point.x
		var dz: float = place.z - point.z
		var direction := ("N" if dz < -5 else "S" if dz > 5 else "") + ("E" if dx > 5 else "W" if dx < -5 else "")
		copy.status = "%s · %dm %s" % ["Stamped" if copy.visited else "Undiscovered", roundi(journal.distance_to(place)), "Here" if direction.is_empty() else direction]
		destinations.append(copy)
		stamps.append(card(place.name, "stamp", place.note, [], "Island trail · " + ("Discovery stamp ✓" if copy.visited else "Still to discover")))
	var garden_labels := ["Plant flower seeds", "Water the seedlings", "Water for blossoms", "Flowers in bloom ✓"]
	var garden_notes := ["An empty bed, ready for six little flowers. Plant, then water twice to see them bloom.", "Seeds are tucked into the soil. A little water will bring out their first leaves.", "Small green stems and buds are growing. Water once more to open the blossoms.", "Coral, lavender, and golden flowers! They will still be here when you return."]
	var garden_note: String = garden_notes[state.garden] if journal.garden.support() != null else "Restore level, dry soil beneath the entire flower bed to see your saved flowers again."
	experiences.append(card("Your picnic garden", "garden", garden_note, [action("garden", garden_labels[state.garden], enabled and journal.garden.can_tend()), action("visit:picnic", "Find the garden", not journal.following)], journal.location("picnic")))
	collection.push_front(card("Your picnic garden", "garden", garden_notes[state.garden], [], "%d/3 · %s" % [state.garden, garden_labels[state.garden]]))
	var fishing_note: String = journal.fishing.message
	if journal.fishing.supported().is_empty(): fishing_note = "Restore a level, dry fishing shore and leave the lake beneath the bobber clear of blocks."
	elif not journal.fishing.can_fish(): fishing_note = "Visit Willowmere Lake, choose Leave if following a companion, and open this journal beside the fishing rod. Closing the journal puts your cast away."
	experiences.append(card("Willowmere fishing", "fish", fishing_note, [action("fish", journal.fishing.label(), journal.fishing.can_fish() and journal.fishing.phase != "waiting"), action("visit:willowmere-lake", "Find the lake", not journal.following)], journal.location("willowmere-lake")))
	for name in journal.progress.FISH:
		collection.append(card(name, "fish", "Discovered at Willowmere Lake ✓" if name in state.fish else "Still to meet at Willowmere Lake", [], "Fish you have met · %d/3" % state.fish.size()))
	var wishes: Array = []
	for wish in journal.progress.WISHES: wishes.append(action("wish:" + wish, wish, enabled and journal.lanterns.can_hang()))
	wishes.append(action("visit:lantern-grove", "Find the grove", not journal.following))
	var wish_note := "Choose a wish to hang a warm lantern between the two wooden posts."
	if journal.lanterns.heights().is_empty(): wish_note = "Restore level, dry ground beneath both posts to see your saved wishes again."
	elif state.lanterns.size() >= 8: wish_note = "Eight warm wishes light the grove. Come back at dusk to enjoy them."
	experiences.append(card("Wish lanterns", "lantern", wish_note, wishes, journal.location("lantern-grove") + " · %d/8 wishes" % state.lanterns.size()))
	collection.append(card("Wishes in the grove", "lantern", "No wishes hung yet. Visit Lantern Grove to hang your first lantern." if state.lanterns.is_empty() else " · ".join(state.lanterns), [], "%d/8 wishes hung" % state.lanterns.size()))
	var nearby: Dictionary = journal.shells.nearby()
	var shell_actions: Array = [action("visit:shell-cove", "Find Shell Cove", not journal.following)]
	if not nearby.is_empty(): shell_actions.push_front(action("collect:" + nearby.id, "Collect " + nearby.name, enabled))
	experiences.append(card("Coastal shell hunt", "shell", "Six colorful shells wait along the dry coastal paths. Follow their hints below, then open J nearby to collect them.", shell_actions, "%d/6 shells collected" % state.shells.size()))
	for shell in journal.shells.definitions:
		var found: bool = shell.id in state.shells
		var actions: Array = []
		if found: actions.append(action("feature:" + shell.id, "Featured ✓" if state.favorite == shell.id else "Feature on the shelf", enabled and journal.shells.at_display()))
		collection.append(card(shell.name, "shell", shell.hint, actions, "Featured favorite ✓" if state.favorite == shell.id else "Collected ✓" if found else "Still to discover"))
		experiences.append(card(shell.name, "shell", shell.hint, [action("collect:" + shell.id, "Collected ✓" if found else "Collect shell", enabled and not found and nearby.get("id", "") == shell.id)], "%dm away" % roundi(journal.distance_to(shell))))
	experiences.append(card("A night at Stargazer Camp", "stars", "Walk to the camp, listen to the island and watch the changing sky. Bring a view home with photo mode.", [action("visit:camp", "Find the camp", not journal.following)], journal.location("camp")))
	experiences.append(card("Collect a view", "photo", "Orbit the camera, then save a keepsake with photo mode. Cloudrest Lookout and Seabreeze Bluff make lovely panoramas.", [action("photo", "Take a photo"), action("visit:lookout", "Find Cloudrest Lookout", not journal.following)]))
	collection.append_array(stamps)
	return {"places": destinations, "experiences": experiences, "collection": collection}
