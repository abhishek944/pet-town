extends Node3D
const FaceMesh = preload("face_mesh.gd")
var store: RefCounted
var world: Node3D
var records: Dictionary = {}
var additions: Dictionary = {}
var glass_material: Material
var replaced: Dictionary={}
var last_profile: Dictionary={}

func setup(owner_world: Node3D,voxel_store: RefCounted) -> void:
	world=owner_world
	store=voxel_store
	var half:=int(world.manifest.sourceBounds.maxX)/16
	for instance in world.terrain.chunks:
		var parts:=str(instance.name).split("_")
		var key:=Vector2i(int(parts[1])-half,int(parts[2])-half)
		if not records.has(key): records[key]=[]
		var arrays: Array=instance.mesh.surface_get_arrays(0)
		var indices: PackedInt32Array=arrays[Mesh.ARRAY_INDEX]
		var points: PackedVector3Array=arrays[Mesh.ARRAY_VERTEX]
		var attrs: PackedFloat32Array=arrays[Mesh.ARRAY_CUSTOM0]
		var cells: Array[Vector3i]=[]
		var faces:=PackedByteArray()
		for index in range(0,indices.size(),3):
			var vertex:=indices[index]
			var face:=int(attrs[vertex*4+3])%8
			var center: Vector3=(points[vertex]+points[indices[index+1]]+points[indices[index+2]])/3.0
			var cell:=Vector3i((center-Vector3(FaceMesh.NORMALS[face])*0.14).floor())
			cells.append(cell)
			faces.append(face)
		var record:={"node":instance,"mesh":instance.mesh,"arrays":arrays,"cells":cells,"faces":faces,"lip":str(instance.name).begins_with("lip")}
		preload("original_filter.gd").prepare(record)
		records[key].append(record)
	glass_material=load("res://scripts/building/glass_material.gd").new().create()

func prepare(snapshot: RefCounted,changed: Array) -> RefCounted:
	var worker:=preload("mesh_worker.gd").new()
	worker.configure(snapshot,changed,world.manifest)
	return worker

func refresh(changed: Array) -> void:
	# Synchronous startup/internal path; interactive edits always use the worker queue.
	var worker:=prepare(preload("mesh_worker.gd").copy_store(store),changed)
	worker.run()
	publish(worker.result)

func publish(result: Dictionary) -> void:
	var begin:=Time.get_ticks_usec()
	last_profile={"filter_us":0,"geometry_us":result.geometry_us,"upload_collision_us":0}
	replaced=result.replaced
	for key in result.groups:
		var tick:=Time.get_ticks_usec()
		for record in records.get(key,[]): preload("original_filter.gd").apply(record,replaced)
		last_profile.filter_us+=Time.get_ticks_usec()-tick
		tick=Time.get_ticks_usec()
		if additions.has(key):
			additions[key].free()
			additions.erase(key)
		var group:=Node3D.new()
		group.name="Edited_%s_%s"%[key.x,key.y]
		add_child(group)
		var surfaces: Array=result.groups[key]
		for index in surfaces.size():
			var arrays: Array=surfaces[index]
			if arrays.is_empty(): continue
			var instance:=MeshInstance3D.new()
			var mesh:=ArrayMesh.new()
			mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays,[],{},preload("original_filter.gd").FLAGS)
			instance.mesh=mesh
			instance.material_override=glass_material if index==1 else world.terrain.materials[1 if index==2 else 0]
			group.add_child(instance)
			if index!=2: instance.create_trimesh_collision()
		additions[key]=group
		last_profile.upload_collision_us+=Time.get_ticks_usec()-tick
	last_profile.total_us=Time.get_ticks_usec()-begin
