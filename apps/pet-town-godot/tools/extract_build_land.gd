extends SceneTree
## Copies the authored terrain into a small, object-free Build mode scene.

func _initialize() -> void:
	call_deferred("extract")

func extract() -> void:
	var island := load("res://assets/cozy-island/grand-moonhaven.glb").instantiate() as Node3D
	root.add_child(island)
	var terrain := island.find_child("Grand Moonhaven - tenfold broad terraced island", true, false) as MeshInstance3D
	assert(terrain != null and terrain.mesh != null, "Authored terrain mesh is missing")
	var scene_root := Node3D.new()
	scene_root.name = "BuildLand"
	root.add_child(scene_root)
	var visual := MeshInstance3D.new()
	visual.name = "AuthoredTerrain"
	visual.mesh = terrain.mesh
	visual.transform = terrain.global_transform
	scene_root.add_child(visual)
	visual.owner = scene_root
	var packed := PackedScene.new()
	packed.pack(scene_root)
	assert(ResourceSaver.save(packed, "res://scenes/build_land.tscn") == OK)
	var faces := PackedVector3Array()
	for vertex in terrain.mesh.get_faces():
		faces.append(terrain.global_transform * vertex)
	var shape := ConcavePolygonShape3D.new()
	shape.set_faces(faces)
	assert(ResourceSaver.save(shape, "res://navigation/build_land_collision.res") == OK)
	print("BUILD LAND: ", faces.size() / 3, " terrain triangles")
	quit()
