extends RefCounted
var ocean: Node3D

func data() -> Dictionary:
	var place_rows: Array=[]
	var experiences: Array=[]
	var collection: Array=[]
	var actor: CharacterBody3D=ocean.actor
	for place in ocean.places():
		var found: bool=ocean.discoveries().has(place.id)
		var offset:=Vector2(place.x-actor.position.x,place.z-actor.position.z) if actor else Vector2.ZERO
		var direction:=cardinal(offset)
		var current: String=" · Current heading" if ocean.heading_id==place.id else ""
		var status: String=("Boat" if place.get("transport",false) else ("Stamped" if found else "Undiscovered"))+" · "+str(roundi(offset.length()))+"m "+direction+current
		place_rows.append({"id":place.id,"name":place.name,"icon":"≈","note":place.note,"status":status,
			"action":"ocean-heading:"+place.id,"action_label":"Head this way","enabled":true,"visited":found,
			"category":"Beyond the shore","x":place.x,"z":place.z,"radius":place.radius})
		collection.append({"title":place.name,"art":place.get("art","reef"),"note":"",
			"meta":"Ocean · "+("Discovery stamp ✓" if found else "Still to discover"),"actions":[],"found":found})
	for adventure in ocean.source.get("experiences",[]):
		var place: Dictionary=ocean.find_place(adventure.id)
		if place.is_empty(): continue
		var distance:=Vector2(place.x-actor.position.x,place.z-actor.position.z).length() if actor else 0.0
		var meta: String=place.name+" · "+("Nearby" if distance<=place.radius else str(roundi(distance))+"m away")
		if adventure.get("dusk",false): meta+=" · Best after dusk"
		if not adventure.get("passive",false) and ocean.discoveries().has(place.id): meta+=" · Discovered ✓"
		experiences.append({"title":adventure.name,"art":adventure.art,"note":adventure.note+"\n"+adventure.how,
			"meta":meta,"actions":[{"id":"ocean-heading:"+adventure.id,"label":"Set a heading","enabled":true}]})
	experiences.append({"title":"A little swimming guide","art":"reef","meta":"Start at Driftwood Camp, then walk west to the sea.",
		"note":"WASD to swim · Shift to swim faster\nHold Control to dive · Hold Space to rise\nRelease both to stay at depth. There is no oxygen timer.\nGamepad: X to dive, A to rise. Touch: hold Dive and the jump arrow to rise. Controlled companions can dive too.","actions":[]})
	return {"places":place_rows,"experiences":experiences,"collection":collection}

static func cardinal(offset: Vector2) -> String:
	var text:=("N" if offset.y<-5 else ("S" if offset.y>5 else ""))+("E" if offset.x>5 else ("W" if offset.x<-5 else ""))
	return "Here" if text.is_empty() else text
