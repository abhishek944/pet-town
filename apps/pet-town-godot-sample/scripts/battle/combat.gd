extends Node3D
var session: Node3D
var weapon: Node3D
var spawn_wait := 0.0
var frozen := false
var momentum := {}

func setup(host: Node3D, sources: Array) -> void:
	setup_avatar(host)
	for i in sources.size(): add_animal(sources[i],i)
	setup_effects()

func setup_avatar(host: Node3D) -> void:
	session = host
	session.avatar = preload("avatar.gd").new()
	session.avatar.session = session
	session.avatar.world = session.town.world
	session.avatar.view = session.town.rig
	session.avatar.spawn = Vector3(session.arena.START.x, session.town.world.ground_at(session.arena.START) + 0.06, session.arena.START.z)
	add_child(session.avatar)
	session.avatar.freeze = true
	session.context.target(session.avatar)

func add_animal(source: Node3D, index: int) -> void:
	var animal := preload("wildlife.gd").new()
	var data: Dictionary = source.entry.duplicate(true)
	var home: Vector3 = session.arena.HOMES[index]
	home.y = session.town.world.ground_at(home) + 0.06
	data.position = [home.x, home.y, home.z]
	data.home = data.position.duplicate()
	animal.session = session
	animal.setup(data, session.town.wildlife)
	add_child(animal)
	animal.collision_mask = 15
	animal.freeze = true
	session.animals.append(animal)

func setup_effects() -> void:
	session.feedback = preload("feedback.gd").new()
	add_child(session.feedback)
	weapon = preload("weapon.gd").new()
	add_child(weapon)
	weapon.setup(session)
	var boundary := preload("boundary.gd").new()
	add_child(boundary)
	boundary.setup(session.arena)
	set_frozen(true)

func step(delta: float) -> void:
	session.enemies = session.enemies.filter(func(body): return is_instance_valid(body) and not body.is_queued_for_deletion())
	session.avatar.step(delta)
	for animal in session.animals: animal.step(delta)
	for enemy in session.enemies:
		if session.avatar.health.value <= 0: break
		enemy.step(delta)
	if session.avatar.health.value <= 0: return
	weapon.step(delta)
	spawn_wait -= delta
	if spawn_wait <= 0:
		spawn_wait = lerpf(3, 1, session.elapsed / 300)
		var living: int = session.enemies.filter(func(body): return body.health.value > 0).size()
		if living < 16:
			var p = session.arena.spawn_point(session.avatar, session.animals, session.enemies)
			if p != null:
				var enemy := preload("enemy.gd").new()
				enemy.session = session
				enemy.appearance = ["Minion", "Warrior", "Rogue", "Mage"].pick_random()
				enemy.position = p
				add_child(enemy)
				session.enemies.append(enemy)

func set_frozen(value: bool) -> void:
	if frozen == value: return
	frozen = value
	process_mode = Node.PROCESS_MODE_DISABLED if value else Node.PROCESS_MODE_INHERIT
	for body in [session.avatar] + session.animals + session.enemies:
		if not is_instance_valid(body): continue
		if value:
			momentum[body.get_instance_id()] = body.linear_velocity
			body.freeze = true
			body.linear_velocity = Vector3.ZERO
		else:
			body.freeze = body.health.value <= 0
			if not body.freeze: body.linear_velocity = momentum.get(body.get_instance_id(), Vector3.ZERO)
	if not value: momentum.clear()

func wildlife_health() -> float:
	var total := 0.0
	for animal in session.animals: total += animal.health.value
	return total / maxf(1, session.animals.size())
