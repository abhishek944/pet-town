extends Node3D
## Three native instance batches per school retain 54 individually posed reef fish.
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
		for place in data.places:
			if place.id==definition.place: definition.center=Vector3(place.x,0,place.z)
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

func update(_delta: float, time: float) -> void:
	for school in schools:
		for index in int(school.count):
			var phase: float=time*school.speed+school.index*1.7+index*0.17
			var radius: float=school.radius+sin(index*2.7)*1.4
			var point: Vector3=school.center+Vector3(cos(phase)*radius,0,sin(phase)*radius*0.7)
			var depth: float=habitat.depth(point)
			var size: float=0.8+(index%4)*0.07 if depth>1.6 and habitat.clear(point,1.6,0.65) else 0.0
			point.y=habitat.world.water_at(point)-minf(depth-0.7,school.depth+sin(time*0.8+index*0.7)*0.35)
			var yaw:=atan2(-sin(phase)*signf(school.speed),cos(phase)*0.7*signf(school.speed))
			var pose:=Transform3D(Basis(Vector3.UP,yaw).scaled(Vector3.ONE*size),point)
			for part in school.parts:
				var local: Transform3D=part.local
				if part.tail:
					local.basis=local.basis*Basis(Vector3.UP,sin(time*7+phase+index)*0.17)
				elif part.fins:
					local.basis=local.basis*Basis(Vector3.RIGHT,sin(time*4.5+phase+index)*0.07)
				part.mesh.set_instance_transform(index,pose*local)
