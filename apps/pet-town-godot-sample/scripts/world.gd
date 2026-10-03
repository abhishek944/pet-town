extends Node3D
const Buffers = preload("region/buffers.gd")
var manifest := {}
var voxels: RefCounted
var terrain: Node3D
var vegetation: Node3D
var effects: Node3D
var ground := {}
var props := {}
var prop_controller: Node3D

func _ready() -> void:
	manifest=Buffers.read_json("region-manifest.json")
	if manifest.is_empty():
		push_error("Original-world export is missing; run the region exporter.")
		return
	for cell in Buffers.read_json(manifest.groundFile).cells:
		ground[Vector2i(floori(cell[0]),floori(cell[2]))]=Vector2(cell[1],cell[3])
	terrain=load("res://scripts/region/terrain.gd").new()
	add_child(terrain)
	terrain.setup(manifest)
	vegetation=load("res://scripts/region/vegetation.gd").new()
	add_child(vegetation)
	vegetation.setup(manifest)
	prop_controller=load("res://scripts/region/props.gd").new()
	add_child(prop_controller)
	prop_controller.setup(manifest)
	props=prop_controller.props
	effects=load("res://scripts/effects/world_effects.gd").new()
	add_child(effects)
	effects.setup(manifest)

func spawn_point() -> Vector3:
	var p: Dictionary=manifest.spawn
	return Vector3(p.x,p.y+0.1,p.z)

func ground_at(point: Vector3) -> float:
	return ground.get(Vector2i(floori(point.x),floori(point.z)),Vector2(-20,1)).x

func water_at(point: Vector3) -> float:
	var cell: Vector2=ground.get(Vector2i(floori(point.x),floori(point.z)),Vector2(-20,1))
	return float(manifest.waterLevel) if cell.y>0.5 else -1000.0

func contains(point: Vector3) -> bool:
	var b: Dictionary=manifest.bounds
	return point.x>=b.minX and point.x<b.maxX and point.z>=b.minZ and point.z<b.maxZ

func add_mesh_collision(root: Node3D) -> void:
	var faces := PackedVector3Array()
	collect_faces(root,root.global_transform.affine_inverse(),faces)
	if faces.is_empty(): return
	var body := StaticBody3D.new()
	var collider := CollisionShape3D.new()
	var shape := ConcavePolygonShape3D.new()
	shape.set_faces(faces)
	collider.shape=shape
	body.add_child(collider)
	root.add_child(body)

func collect_faces(node: Node, to_root: Transform3D, faces: PackedVector3Array) -> void:
	if node is MeshInstance3D and node.mesh:
		faces.append_array((to_root*node.global_transform)*node.mesh.get_faces())
	for child in node.get_children():
		collect_faces(child,to_root,faces)
