extends SceneTree

func _initialize() -> void:
	for path in ["res://navigation/town_collision.res", "res://navigation/build_land_collision.res"]:
		var shape := load(path) as ConcavePolygonShape3D
		print("COLLISION_AUDIT path=%s triangles=%d" % [path, shape.get_faces().size() / 3])
	var nav := load("res://navigation/town_walkable.res") as NavigationMesh
	var triangles := 0
	for index in nav.get_polygon_count():
		triangles += nav.get_polygon(index).size() - 2
	print("COLLISION_AUDIT navigation_polygons=%d triangles=%d" % [nav.get_polygon_count(), triangles])
	quit()
