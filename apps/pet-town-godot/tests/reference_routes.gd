extends SceneTree
func _initialize() -> void:
 call_deferred("check_routes")
func check_routes() -> void:
 var map = NavigationServer3D.map_create()
 NavigationServer3D.map_set_active(map,true)
 NavigationServer3D.map_set_cell_size(map,0.3)
 NavigationServer3D.map_set_cell_height(map,0.15)
 var region = NavigationServer3D.region_create()
 NavigationServer3D.region_set_map(region,map)
 NavigationServer3D.region_set_navigation_mesh(region,load("res://navigation/town_walkable.res"))
 NavigationServer3D.map_force_update(map)
 await create_timer(1.0).timeout
 var life = load("res://scenes/town_life.tscn").instantiate()
 root.add_child(life)
 var spots = life.get_node("Activities").get_children()
 var errors = []
 var checked = 0
 for a in spots:
  var from = NavigationServer3D.map_get_closest_point(map,a.global_position)
  print(a.name," projection distance=",from.distance_to(a.global_position))
  if from.distance_to(a.global_position)>2.5: errors.append(str(a.name)+" too far from path")
  for b in spots:
   if a==b: continue
   var to = NavigationServer3D.map_get_closest_point(map,b.global_position)
   var path = NavigationServer3D.map_get_path(map,from,to,true)
   if path.is_empty() or path[path.size()-1].distance_to(to)>.6: errors.append(str(a.name)+" to "+str(b.name))
   checked += 1
 print("RESULT ",checked," paths; errors=",errors)
 NavigationServer3D.free_rid(region)
 NavigationServer3D.free_rid(map)
 quit(0 if errors.is_empty() else 1)
