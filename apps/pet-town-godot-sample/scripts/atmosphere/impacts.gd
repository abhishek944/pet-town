extends Node3D
## Fixed-size ring / hail bounce pool; no accumulated scene nodes.
var ring_mesh: Mesh
var pellet_mesh: Mesh
var world: Node3D
var pool: Array[MeshInstance3D] = []
var events: Array[Dictionary] = []
var cursor := 0
var ripple_timer := 0.0
func setup(owner_world: Node3D) -> void:
	world = owner_world
	var ring := TorusMesh.new()
	ring.inner_radius = 0.08
	ring.outer_radius = 0.1
	ring.rings = 8
	ring.ring_segments = 12
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.albedo_color = Color(0.75,0.86,0.9,0.3)
	ring.material = material
	ring_mesh = ring
	var pellet := SphereMesh.new()
	pellet.radius = 0.045
	pellet.height = 0.09
	pellet.radial_segments = 6
	pellet.rings = 3
	var ice := material.duplicate() as StandardMaterial3D
	ice.albedo_color = Color(0.8,0.9,1.0,0.8)
	pellet.material = ice
	pellet_mesh = pellet
	for i in 32:
		var instance := MeshInstance3D.new()
		instance.mesh = ring
		instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		instance.visible = false
		add_child(instance)
		pool.append(instance)
		events.append({"age":1.0,"position":Vector3.ZERO,"kind":"rain"})
func spawn(point: Vector3, normal: Vector3, kind: String, strength: float) -> void:
	var item := pool[cursor]
	item.mesh = pellet_mesh if kind == "hail" else ring_mesh
	item.position = point + normal * 0.025
	var up := normal.normalized()
	var right := Vector3.RIGHT if absf(up.x) < 0.9 else Vector3.FORWARD
	right = (right - up * right.dot(up)).normalized()
	item.basis = Basis(right, up, right.cross(up)).orthonormalized()
	item.visible = true
	events[cursor] = {"age":0.0,"position":item.position,"kind":kind,"strength":strength}
	cursor = (cursor + 1) % pool.size()
	if world.effects.water.is_water(point) and absf(point.y-world.effects.water.water_level) < 0.08 and ripple_timer <= 0:
		world.effects.add_ripple(point, 0.12 * strength)
		ripple_timer = 0.16
func _process(delta: float) -> void:
	ripple_timer = maxf(0, ripple_timer - delta)
	for i in pool.size():
		var event: Dictionary = events[i]
		event.age += delta
		pool[i].visible = event.age < 0.45
		if not pool[i].visible: continue
		var age: float = event.age
		pool[i].scale = Vector3.ONE if event.kind == "hail" else Vector3.ONE * (0.3 + age * 3.0)
		if event.kind == "hail": pool[i].position.y = event.position.y + sin(age / 0.45 * PI) * 0.15
		pool[i].transparency = clampf(age / 0.45, 0, 1)
