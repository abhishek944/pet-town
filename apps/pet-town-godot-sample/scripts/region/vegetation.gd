extends Node3D
const Buffers = preload("buffers.gd")
const DetailLevels = preload("vegetation_lod.gd")
var materials: Array[ShaderMaterial] = []
var player: Node3D
var update_time := 0.0
var last_lighting_ms := -1000
var rank_fields: Dictionary = {}
var tier: Dictionary = {}
var missing_ranks := 0
var editable_groups: Array = []

func setup(manifest: Dictionary, budget: RefCounted = null) -> void:
	await load_ranks(budget)
	for field in manifest.vegetation.fields:
		var blob: bool=field.name=="blob"
		var material := make_blob(field.material) if blob else make_material(field.material)
		if not blob:
			materials.append(material)
			apply_density(material,field)
		var ranks: Dictionary=rank_fields.get("%s:%s" % [field.name,field.variant],{})
		var prepared: Dictionary = await preload("vegetation_buffers.gd").prepare(field,ranks,budget)
		missing_ranks+=int(prepared.missing)
		var groups: Dictionary = prepared.groups
		var distance_scale: float=tier.get("dist",1.0)
		var lods: Array = field.lods
		var detail_groups := {}
		for lod in lods.size():
			var mesh := Buffers.resource_mesh(lods[lod].file)
			mesh.surface_set_material(0,material)
			for key in groups:
				var group: Dictionary = groups[key]
				var multi := MultiMesh.new()
				multi.transform_format = MultiMesh.TRANSFORM_3D
				multi.use_custom_data = true
				multi.mesh = mesh
				multi.instance_count = int(group.count)
				multi.buffer = group.buffer
				var origin := Vector3(key.x*16+8,0,key.y*16+8)
				var instance := MultiMeshInstance3D.new()
				instance.name = field.name+"_"+str(field.variant)+"_"+str(key)+"_lod"+str(lod)
				instance.multimesh = multi
				instance.set_meta("foliage_anchors",group.anchors)
				instance.position = origin
				instance.visibility_range_begin = 0 if lod == 0 else float(lods[lod].distance)*distance_scale
				instance.visibility_range_end = float(lods[lod+1].distance)*distance_scale if lod+1<lods.size() else float(field.maxDistance)*distance_scale
				instance.visibility_range_begin_margin = 1
				instance.visibility_range_end_margin = 1
				instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if field.castShadow else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
				add_child(instance)
				if not detail_groups.has(key): detail_groups[key] = []
				detail_groups[key].append(instance)
				if budget: await budget.checkpoint()
		for levels in detail_groups.values():
			DetailLevels.link(levels)
			if str(field.name).begins_with("grass") or str(field.name).begins_with("tall") or str(field.name).begins_with("fl_") or str(field.name).begins_with("clover") or str(field.name).begins_with("fern"):
				editable_groups.append({"meshes":levels.map(func(level): return level.multimesh),"anchors":levels[0].get_meta("foliage_anchors")})
	if missing_ranks>0: push_warning("Original vegetation ranks missing for %s instances" % missing_ranks)
	for tree in manifest.trees:
		var body := StaticBody3D.new()
		body.position=Vector3(tree.x,tree.y,tree.z)
		var shape := CylinderShape3D.new()
		shape.radius=maxf(tree.radius,0.08)
		shape.height=tree.height*0.65
		var collider := CollisionShape3D.new()
		collider.shape=shape
		collider.position.y=shape.height*0.5
		body.add_child(collider)
		add_child(body)
		if budget: await budget.checkpoint()

func make_material(source: Dictionary) -> ShaderMaterial:
	var result := ShaderMaterial.new()
	result.shader=preload("res://shaders/vegetation/vegetation.gdshader")
	result.set_shader_parameter("source_double_sided",int(source.get("side",0))==2)
	var c: Array=source.color
	result.set_shader_parameter("base_color",Vector3(c[0],c[1],c[2]))
	var defines: Dictionary=source.defines
	for pair in [["world_map","VEG_WORLDMAP"],["bump","VEG_BUMP"],["toon","VEG_TOON"],["billboard","VEG_BILLBOARD"],["fade","VEG_FADE"]]:
		result.set_shader_parameter(pair[0],defines.has(pair[1]))
	if source.get("map"):
		result.set_shader_parameter("map_texture",load("res://assets/"+source.map))
		result.set_shader_parameter("has_map",true)
	result.set_shader_parameter("alpha_test",float(source.get("alphaTest",0)))
	for key in source.uniforms:
		var value = source.uniforms[key]
		if value is Array:
			if value.size()==3: value=Vector3(value[0],value[1],value[2])
			elif value.size()==2: value=Vector2(value[0],value[1])
		result.set_shader_parameter(key,value)
	return result

func _process(delta: float) -> void:
	update_time+=delta
	if update_time<0.05 or not is_instance_valid(player): return
	update_time=0
	var pushers := PackedVector4Array()
	pushers.resize(6)
	pushers[0]=Vector4(player.global_position.x,player.global_position.y,player.global_position.z,1.0)
	for material in materials:
		material.set_shader_parameter("player_position",player.global_position+Vector3.UP)
		material.set_shader_parameter("uPushers",pushers)

func set_lighting(sample: Dictionary) -> void:
	var now:=Time.get_ticks_msec()
	if now-last_lighting_ms<50: return
	last_lighting_ms=now
	var direction: Vector3=sample.get("sun_direction",Vector3(0.5,0.8,0.3))
	var color: Color=sample.get("sun",sample.get("sun_color",Color.WHITE))
	var intensity: float=sample.get("sun_intensity",sample.get("sunI",2.4))
	var energy:=clampf(intensity/2.4,0.0,1.25)*smoothstep(-0.08,0.2,direction.y)
	var linear:=color.srgb_to_linear()
	for material in materials:
		material.set_shader_parameter("sun_dir",direction)
		material.set_shader_parameter("sun_color",Vector3(linear.r,linear.g,linear.b)*energy)

func load_ranks(budget: RefCounted = null) -> void:
	var file:="region-vegetation-ranks.json"
	if not FileAccess.file_exists("res://assets/"+file): return
	var source:=Buffers.read_json(file)
	tier=source.get("tier",{})
	for field in source.get("fields",[]):
		var positions: Dictionary={}
		for i in field.items.size():
			var item: Array = field.items[i]
			positions[Vector3(item[0],item[1],item[2])]=float(item[3])
			if budget and i % 256 == 0: await budget.checkpoint()
		rank_fields["%s:%s" % [field.name,field.variant]]=positions

func apply_density(material: ShaderMaterial,field: Dictionary) -> void:
	var rule=field.get("density")
	if not rule is Array:
		material.set_shader_parameter("density_tier",1.0)
		material.set_shader_parameter("density_rule",Vector3(100000,200000,1))
		return
	material.set_shader_parameter("density_tier",float(tier.get("dens",1.0)))
	material.set_shader_parameter("density_rule",Vector3(rule[0],rule[1],rule[2]))
	if field.name in ["grass","tall"] and not field.material.uniforms.has("uTierScale"):
		var look: Array=tier.get("look",[1,1,1])
		material.set_shader_parameter("uTierScale",Vector3(look[0],look[1],look[0]))

func make_blob(source: Dictionary) -> ShaderMaterial:
	var material:=ShaderMaterial.new()
	material.shader=preload("res://shaders/vegetation/blob.gdshader")
	var color: Array=source.color
	material.set_shader_parameter("base_color",Vector3(color[0],color[1],color[2]))
	material.set_shader_parameter("source_opacity",float(source.opacity))
	if ResourceLoader.exists("res://assets/region-shadow-mask.png"):
		material.set_shader_parameter("shadow_mask",load("res://assets/region-shadow-mask.png"))
	return material
