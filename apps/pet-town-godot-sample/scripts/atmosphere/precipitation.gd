extends Node3D
## World-space rain ribbons and hail pellets, fixed MultiMesh pools.
const MAX_COUNT := 1500
var world: Node3D
var shelter := preload("res://scripts/atmosphere/shelter.gd").new()
var impacts: Node3D
var rain: MultiMeshInstance3D
var hail: MultiMeshInstance3D
var positions := PackedVector3Array()
var velocities := PackedVector3Array()
var kinds := PackedByteArray()
var alive := PackedByteArray()
var landings: Array[Dictionary] = []
var effect := {}
var camera: Camera3D
var previous_limit := 0
var credit := 0.0
var impact_credit := 0.0
func setup(owner_world: Node3D) -> void:
	world = owner_world
	shelter.world = world
	impacts = preload("res://scripts/atmosphere/impacts.gd").new()
	add_child(impacts)
	impacts.setup(world)
	var ribbon := BoxMesh.new()
	ribbon.size = Vector3(0.012,0.55,0.012)
	var pellet := SphereMesh.new()
	pellet.radius = 0.045
	pellet.height = 0.09
	pellet.radial_segments = 6
	pellet.rings = 3
	rain = _mesh(ribbon, Color(0.72,0.85,0.94,0.34))
	hail = _mesh(pellet, Color(0.85,0.94,1.0,0.85))
	positions.resize(MAX_COUNT)
	velocities.resize(MAX_COUNT)
	kinds.resize(MAX_COUNT)
	alive.resize(MAX_COUNT)
	for i in MAX_COUNT: landings.append({})
func _mesh(mesh: Mesh, color: Color) -> MultiMeshInstance3D:
	var material := StandardMaterial3D.new()
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.albedo_color = color
	material.roughness = 0.35
	material.no_depth_test = false
	mesh.surface_set_material(0, material)
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	mm.instance_count = MAX_COUNT
	mm.visible_instance_count = 0
	var instance := MultiMeshInstance3D.new()
	instance.multimesh = mm
	instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	instance.custom_aabb = AABB(Vector3(-200,-100,-200),Vector3(400,300,400))
	add_child(instance)
	return instance
func apply(sample: Dictionary, view: Camera3D) -> void:
	effect = sample
	camera = view
func invalidate() -> void:
	shelter.invalidate()
	alive.fill(0)
	if rain: rain.multimesh.visible_instance_count = 0
	if hail: hail.multimesh.visible_instance_count = 0
func _physics_process(delta: float) -> void:
	if effect.is_empty() or not is_instance_valid(camera): return
	var center := camera.global_position
	var underwater: bool = center.y < world.water_at(center) - 0.1
	var amount: float = effect.rain_amount + effect.hail_amount
	if underwater or amount < 0.005:
		alive.fill(0)
		rain.multimesh.visible_instance_count = 0
		hail.multimesh.visible_instance_count = 0
		return
	shelter.refresh(center)
	var limit := clampi(int(effect.particle_budget),0,MAX_COUNT)
	for i in range(limit,previous_limit): alive[i] = 0
	previous_limit = limit
	var reduced: bool = effect.reduced_motion
	credit = minf(credit + delta * limit * amount * 0.65, 80)
	impact_credit = minf(impact_credit + delta * (6 if reduced else 24), 4)
	var counts := [0,0]
	var casts := 0
	for i in limit:
		if alive[i] == 0 and i < limit and credit >= 1 and casts < 24:
			var point := center + Vector3(randf_range(-17,17),randf_range(8,17),randf_range(-17,17))
			var ground: Dictionary = shelter.surface(point)
			if ground.is_empty() or point.y <= float(ground.height) + 0.5: continue
			if reduced and Vector2(point.x-center.x,point.z-center.z).length() < 5: continue
			positions[i] = point
			kinds[i] = 1 if randf() < float(effect.hail_amount) / maxf(amount,0.01) else 0
			velocities[i] = effect.wind * 2.0 + Vector3.DOWN * (13 if kinds[i] == 1 else 19)
			var velocity := velocities[i]
			var query := PhysicsRayQueryParameters3D.create(point,point+velocity*8.0,1)
			var hit := world.get_world_3d().direct_space_state.intersect_ray(query)
			casts += 1
			var landing := hit if not hit.is_empty() else {"position":point+velocity*8.0,"normal":Vector3.UP}
			var water_level: float = world.effects.water.water_level
			var until_water := (water_level-point.y)/velocity.y
			var water_hit := point+velocity*until_water
			if until_water > 0 and world.effects.water.is_water(water_hit) and water_hit.y > landing.position.y:
				landing = {"position":water_hit,"normal":Vector3.UP,"water":true}
			landings[i] = landing
			alive[i] = 1
			credit -= 1
		if alive[i] == 0: continue
		positions[i] += velocities[i] * delta
		var p := positions[i]
		var landing: Dictionary = landings[i]
		if p.distance_to(center) > 30 or p.y < center.y - 20 or (reduced and Vector2(p.x-center.x,p.z-center.z).length() < 4):
			alive[i] = 0
			continue
		if p.y <= float(landing.position.y):
			alive[i] = 0
			if impact_credit >= 1:
				impacts.spawn(landing.position,landing.normal,"hail" if kinds[i] else "rain",amount)
				impact_credit -= 1
			continue
		var kind: int = kinds[i]
		var mm: MultiMesh = hail.multimesh if kind else rain.multimesh
		var basis := Basis.IDENTITY
		if kind == 0:
			var direction := -velocities[i].normalized()
			var right := direction.cross(Vector3.FORWARD).normalized()
			basis = Basis(right,direction,right.cross(direction))
		mm.set_instance_transform(counts[kind],Transform3D(basis,p))
		counts[kind] += 1
	rain.multimesh.visible_instance_count = counts[0]
	hail.multimesh.visible_instance_count = counts[1]
