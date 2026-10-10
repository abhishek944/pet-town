extends Node3D
## Three native instance batches per school retain 54 individually posed reef fish.
const MarineBody = preload("marine_body.gd")
const Profiles = preload("res://scripts/physics/profiles.gd")
var habitat: RefCounted
var schools: Array=[]

func setup(owner_habitat: RefCounted, data: Dictionary) -> void:
	habitat=owner_habitat
	for index in data.schools.size():
		var definition: Dictionary=data.schools[index].duplicate()
		var root: Node3D=load("res://assets/"+definition.file).instantiate()
		add_child(root)
		preload("res://scripts/asset_style.gd").apply(root)
		var parts: Array=[]
		collect(root,root.global_transform.affine_inverse(),parts,int(definition.count))
		root.queue_free()
		definition.parts=parts
		definition.index=index
		definition.active=true
		definition.render_dirty=true
		for place in data.places:
			if place.id==definition.place: definition.center=Vector3(place.x,0,place.z)
		definition.bodies = []
		for fish_index in int(definition.count):
			var body := MarineBody.new()
			var size := 0.8 + (fish_index % 4) * 0.07
			body.configure_body(Profiles.marine("fish", size, index))
			body.habitat = habitat
			body.habitat_radius = maxf(0.25, body.body_radius * 0.5)
			body.school_id = index
			var phase: float = TAU * fish_index / int(definition.count) + index * 1.7
			var point: Vector3 = definition.center + Vector3(cos(phase) * definition.radius, 0, sin(phase) * definition.radius * 0.7)
			point.y = habitat.world.water_at(point) - minf(habitat.depth(point) - 0.7, definition.depth)
			body.position = point
			body.rotation.y = atan2(-sin(phase) * signf(definition.speed), cos(phase) * 0.7 * signf(definition.speed))
			add_child(body)
			definition.bodies.append({"body": body, "size": size, "phase": phase})
		schools.append(definition)

func collect(node: Node, origin: Transform3D, parts: Array, count: int) -> void:
	if node is MeshInstance3D:
		var instance:=MultiMeshInstance3D.new()
		var mesh:=MultiMesh.new()
		mesh.transform_format=MultiMesh.TRANSFORM_3D
		# Carry painted surface overrides into the shared batch, not one copy per fish.
		mesh.mesh=node.mesh.duplicate()
		for surface in range(node.mesh.get_surface_count()):
			mesh.mesh.surface_set_material(surface,node.get_active_material(surface))
		mesh.instance_count=count
		instance.multimesh=mesh
		instance.material_override=node.material_override
		instance.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(instance)
		parts.append({"mesh":mesh,"local":origin*node.global_transform,"tail":node.name=="Tail","fins":node.name=="PectoralFins"})
	for child in node.get_children(): collect(child,origin,parts,count)

func step(delta: float, time: float, activity: RefCounted = null) -> void:
	for school in schools:
		var active: bool = activity.near(school.center,school.active,float(school.radius)+4) if activity else true
		if active != school.active:
			school.active = active
			school.render_dirty = true
			for record in school.bodies: record.body.set_simulating(active)
		if not active: continue
		for index in school.bodies.size():
			var record: Dictionary = school.bodies[index]
			record.phase += delta * float(school.speed)
			var phase: float = record.phase
			var radius: float = school.radius + sin(index * 2.7) * 0.7
			var point: Vector3 = school.center + Vector3(cos(phase) * radius, 0, sin(phase) * radius * 0.7)
			point.y = habitat.world.water_at(point) - minf(habitat.depth(point) - 0.7, school.depth + sin(time * 0.8 + index * 0.7) * 0.35)
			var body = record.body
			body.seek(point, absf(school.speed) * school.radius * 1.3, delta, body.flock())

func update(_delta: float, time: float) -> void:
	for school in schools:
		if not school.active and not school.render_dirty: continue
		school.render_dirty = false
		for index in school.bodies.size():
			var record: Dictionary = school.bodies[index]
			var body = record.body
			var pose: Transform3D = global_transform.affine_inverse() * body.get_global_transform_interpolated()
			pose.basis = pose.basis.scaled(Vector3.ONE * (record.size if body.contact_enabled else 0.0))
			for part in school.parts:
				var local: Transform3D = part.local
				if part.tail:
					local.basis = local.basis * Basis(Vector3.UP, sin(time * 7 + record.phase + index) * 0.17)
				elif part.fins:
					local.basis = local.basis * Basis(Vector3.RIGHT, sin(time * 4.5 + record.phase + index) * 0.07)
				part.mesh.set_instance_transform(index, pose * local)
