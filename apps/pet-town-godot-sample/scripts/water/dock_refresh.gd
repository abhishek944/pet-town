extends RefCounted
## Re-seat the source's merged gangway geometry when its shore support is edited.
var world: Node3D
var root: Node3D
var source: Dictionary
var meshes: Array=[]
var shore:=0.0
var initial_slope:=0.0
var poll:=0.0

func setup(owner_world: Node3D, model: Node3D, data: Dictionary) -> void:
	world=owner_world
	root=model
	source=data
	shore=float(data.dockShore)
	initial_slope=(shore-(float(world.manifest.waterLevel)+0.81))/(float(data.dock.shoreX)-float(data.dock.x))
	collect(model)

func collect(node: Node) -> void:
	if node is MeshInstance3D:
		var arrays: Array=node.mesh.surface_get_arrays(0)
		meshes.append({"node":node,"arrays":arrays,"material":node.mesh.surface_get_material(0)})
	for child in node.get_children(): collect(child)

func update(delta: float) -> void:
	poll-=delta
	if poll>0: return
	poll=0.75
	var next: float=world.ground_at(Vector3(source.dock.shoreX,0,source.dock.z))+0.03
	if is_equal_approx(next,shore): return
	shore=next
	var slope: float=(shore-(float(world.manifest.waterLevel)+0.81))/(float(source.dock.shoreX)-float(source.dock.x))
	var change:=slope-initial_slope
	for entry in meshes:
		var arrays: Array=entry.arrays.duplicate(true)
		var vertices: PackedVector3Array=arrays[Mesh.ARRAY_VERTEX]
		var normals: PackedVector3Array=arrays[Mesh.ARRAY_NORMAL]
		for i in vertices.size():
			var point:=vertices[i]
			# Dock boards and mooring posts remain fixed; only original ramp triangles move.
			if point.x>0.4 and absf(point.z)<0.91 and absf(point.y-0.6-point.x*initial_slope)<0.08:
				vertices[i].y+=point.x*change
				if normals.size()>i:
					normals[i]=Vector3(normals[i].x-change*normals[i].y,normals[i].y,normals[i].z).normalized()
		arrays[Mesh.ARRAY_VERTEX]=vertices
		arrays[Mesh.ARRAY_NORMAL]=normals
		var mesh:=ArrayMesh.new()
		mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
		mesh.surface_set_material(0,entry.material)
		entry.node.mesh=mesh
	for child in root.get_children():
		if child is StaticBody3D: child.free()
	world.add_mesh_collision(root)
