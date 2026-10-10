extends Node3D
## Actual selected seed launcher; every pellet sweeps scenery and living enemies.
var session: Node3D
var gun: Node3D
var muzzle: Node3D
var flash: MeshInstance3D
var cooldown := 0.0
var recoil := 0.0
var pellets: Array = []

func setup(host: Node3D) -> void:
	session = host
	gun = preload("res://assets/battle/seed-launcher.glb").instantiate()
	gun.position = Vector3(-0.39, 0.68, 0.30)
	gun.rotation.y = -PI / 2 + 0.19
	session.avatar.visual.add_child(gun)
	muzzle = Node3D.new()
	muzzle.position = Vector3(0.285, 0, 0)
	gun.add_child(muzzle)
	flash = sphere(0.08, Color("f7df8a"))
	muzzle.add_child(flash)
	flash.hide()

func sphere(radius: float, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2
	node.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	node.material_override = material
	return node

func step(delta: float) -> void:
	cooldown -= delta
	recoil = maxf(0, recoil - delta)
	gun.position.z = 0.30 - recoil * 0.3
	flash.visible = recoil > 0.08
	if cooldown <= 0 and session.avatar.health.value > 0:
		var enemy := nearest()
		if enemy:
			var direction: Vector3 = enemy.position - session.avatar.position
			session.avatar.visual.rotation.y = atan2(direction.x, direction.z)
			var origin := muzzle.global_position
			var destination: Vector3 = enemy.contact_center()
			if session.arena.visible_line(origin, destination):
				var node := sphere(0.065, Color("8fb14f"))
				add_child(node)
				node.global_position = origin
				pellets.append({"node": node, "direction": origin.direction_to(destination), "distance": 0.0})
				cooldown = 0.6
				recoil = 0.12
	for i in range(pellets.size() - 1, -1, -1):
		var pellet: Dictionary = pellets[i]
		var a: Vector3 = pellet.node.global_position
		var travel: Vector3 = pellet.direction * minf(26 * delta, 14 - pellet.distance)
		var b := a + travel
		var q := PhysicsRayQueryParameters3D.create(a, b, 1)
		var hit := get_world_3d().direct_space_state.intersect_ray(q)
		var limit := a.distance_to(hit.position) if not hit.is_empty() else travel.length()
		var victim: RigidBody3D
		var closest := limit
		for enemy in session.enemies:
			if not is_instance_valid(enemy) or enemy.health.value <= 0: continue
			var center: Vector3 = enemy.contact_center()
			var along := clampf((center - a).dot(pellet.direction), 0, travel.length())
			if along < closest and (a + pellet.direction * along).distance_to(center) < 0.55:
				victim = enemy
				closest = along
		if victim: victim.hurt(20)
		pellet.distance += travel.length()
		if victim or not hit.is_empty() or pellet.distance >= 14:
			pellet.node.queue_free()
			pellets.remove_at(i)
		else: pellet.node.global_position = b

func nearest() -> RigidBody3D:
	var result: RigidBody3D
	var distance := 14.0
	for enemy in session.enemies:
		if not is_instance_valid(enemy) or enemy.health.value <= 0: continue
		var next: float = session.avatar.position.distance_to(enemy.position)
		if next < distance and session.arena.visible_line(session.avatar.contact_center(), enemy.contact_center()):
			distance = next
			result = enemy
	return result
