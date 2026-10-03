extends Node3D
const Buffers = preload("buffers.gd")
var props: Dictionary = {}
var entries: Dictionary = {}
var materials: Dictionary = {}
var details: Dictionary = {}
var rotors: Array[Node3D] = []
var lanterns: Array[OmniLight3D] = []
var night_factor := -1.0
var lantern_positions: Array[Vector3] = []
var lamp_sources: Array[int] = []
var lamp_weights: Array[float] = []
var lamp_timer := 0.0
var lamp_nearest: Array[int] = []

func setup(manifest: Dictionary) -> void:
	details = Buffers.read_json(manifest.get("propDetailsFile", "region-prop-details.json"))
	for key in details.get("materials", {}):
		materials[key] = make_material(details.materials[key])
	for entry in manifest.props:
		if not entry.get("file"): continue
		var scene: PackedScene = load("res://assets/" + entry.file)
		if scene == null: continue
		var instance: Node3D = scene.instantiate()
		instance.name = str(entry.name).validate_node_name()
		instance.set_meta("original_prop", entry)
		add_child(instance)
		apply_materials(instance)
		add_collision(instance)
		props[entry.file] = instance
		entries[entry.file] = entry
	for entry in details.get("windmills", []):
		var parent := Node3D.new()
		parent.name = "WindmillHub"
		parent.transform = Buffers.transform(entry.parentMatrix)
		add_child(parent)
		var rotor: Node3D = load("res://assets/" + entry.file).instantiate()
		parent.add_child(rotor)
		apply_materials(rotor)
		rotors.append(rotor)
	for point in details.get("lanterns", []):
		lantern_positions.append(Vector3(point[0],point[1],point[2]))
	for i in mini(6,lantern_positions.size()):
		var light := OmniLight3D.new()
		light.position = lantern_positions[i]
		light.light_color = Color.hex((16757350 << 8) | 255)
		light.omni_range = 9.0
		light.omni_attenuation = 1.7
		light.shadow_enabled = false
		add_child(light)
		lanterns.append(light)
		lamp_sources.append(i)
		lamp_weights.append(0.0)
	set_night_factor(0.0)

func make_material(source: Dictionary) -> ShaderMaterial:
	var material := ShaderMaterial.new()
	var variant := "transparent" if source.get("transparent", false) else ("double_sided" if source.get("side", 0) == 2 else "opaque")
	material.shader = load("res://shaders/props/" + variant + ".gdshader")
	var colors := {"color":"base_color", "emissive":"emission_color"}
	for key in colors:
		var value: Array = source.get(key, [0,0,0] if key == "emissive" else [1,1,1])
		material.set_shader_parameter(colors[key],Vector3(value[0],value[1],value[2]))
	var scalars := {"roughness":"surface_roughness", "metalness":"surface_metallic", "opacity":"surface_opacity", "alphaTest":"alpha_cutoff", "bumpScale":"bump_scale", "emissiveIntensity":"emission_energy"}
	for key in scalars:
		material.set_shader_parameter(scalars[key],float(source.get(key,0.0)))
	material.set_shader_parameter("use_vertex_color",source.get("vertexColors",true))
	for pair in [["map","map"],["bumpMap","bump"],["emissiveMap","emission"]]:
		if not source.maps.has(pair[0]): continue
		var map: Dictionary = source.maps[pair[0]]
		var prefix: String = pair[1]
		material.set_shader_parameter("has_" + ("emission_map" if prefix == "emission" else prefix),true)
		material.set_shader_parameter(prefix+"_texture",load("res://assets/"+map.file))
		material.set_shader_parameter(prefix+"_flip_y",map.get("flipY",true))
		material.set_shader_parameter(prefix+"_transform",Vector4(map.repeat[0],map.repeat[1],map.offset[0],map.offset[1]))
	return material

func apply_materials(node: Node) -> void:
	if node is MeshInstance3D and node.mesh:
		var key := material_key(str(node.name))
		if materials.has(key):
			if node.mesh is ArrayMesh:
				for surface in node.mesh.get_surface_count():
					node.mesh.surface_set_material(surface,materials[key])
				node.material_override = null
			else:
				node.material_override = materials[key]
			node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF if details.materials[key].get("noShadow",false) else GeometryInstance3D.SHADOW_CASTING_SETTING_ON
		else:
			preload("res://scripts/asset_style.gd").apply(node)
	for child in node.get_children():
		apply_materials(child)

func material_key(node_name: String) -> String:
	if not node_name.begins_with("props_"): return ""
	var tail := node_name.trim_prefix("props_")
	for key in materials:
		if tail == key or tail.begins_with(key+"_"): return key
	return ""

func add_collision(root: Node3D) -> void:
	var faces := collect_faces(root,root.global_transform.affine_inverse())
	if faces.is_empty(): return
	var body := StaticBody3D.new()
	body.name = "OriginalMeshCollision"
	body.collision_layer = 1
	var shape := ConcavePolygonShape3D.new()
	shape.set_faces(faces)
	shape.backface_collision = true
	var collider := CollisionShape3D.new()
	collider.shape = shape
	body.add_child(collider)
	root.add_child(body)

func collect_faces(node: Node, to_root: Transform3D) -> PackedVector3Array:
	var faces := PackedVector3Array()
	if node is MeshInstance3D and node.mesh:
		faces.append_array((to_root*node.global_transform)*node.mesh.get_faces())
	for child in node.get_children():
		faces.append_array(collect_faces(child,to_root))
	return faces

func set_night_factor(value: float) -> void:
	var factor := clampf(value,0.0,1.0)
	if is_equal_approx(factor,night_factor): return
	night_factor = factor
	for key in materials:
		var energy: float = details.materials[key].get("emissiveIntensity",0.0)
		if key in ["glass","collectionGlass"]: energy = factor*1.35
		elif key == "lamp": energy = 0.1+factor*2.4
		elif key in ["plaster","wood","paint","stone","brick"]: energy = 0.15*(1.0-0.85*factor)
		materials[key].set_shader_parameter("emission_energy",energy)
	for light in lanterns:
		light.light_energy = factor*8.0*lamp_weights[lanterns.find(light)]
		light.visible = factor>0.01

func _process(delta: float) -> void:
	update_lamps(delta)
	for rotor in rotors:
		rotor.rotate_z(-0.42*delta)

func update_lamps(delta: float) -> void:
	if night_factor<0.01 or lanterns.is_empty(): return
	lamp_timer-=delta
	if lamp_timer<=0.0:
		lamp_timer=0.3
		var camera := get_viewport().get_camera_3d()
		var center := camera.global_position if camera else Vector3.ZERO
		lamp_nearest.assign(range(lantern_positions.size()))
		lamp_nearest.sort_custom(func(a: int,b: int) -> bool: return lantern_positions[a].distance_squared_to(center)<lantern_positions[b].distance_squared_to(center))
		lamp_nearest.resize(lanterns.size())
	for i in lanterns.size():
		if lamp_sources[i] in lamp_nearest:
			lamp_weights[i]=minf(1.0,lamp_weights[i]+delta*2.0)
		else:
			lamp_weights[i]=maxf(0.0,lamp_weights[i]-delta*3.0)
			if lamp_weights[i]<=0.0:
				for source in lamp_nearest:
					if source not in lamp_sources:
						lamp_sources[i]=source
						lanterns[i].position=lantern_positions[source]
						break
		lanterns[i].light_energy=night_factor*8.0*lamp_weights[i]
