extends Node3D
# Original Three.js build preview colors, easing, pulse, idle fade and denial shake.
var host: Node3D
var ghost: MeshInstance3D
var target_outline: MeshInstance3D
var placement_outline: MeshInstance3D
var texture_material: ShaderMaterial
var target_material: ShaderMaterial
var outline_material: ShaderMaterial
var active_until := 0
var fade := 0.0
var ghost_fade := 0.0
var elapsed := 0.0
var scale_amount := 1.0
var denial_shake := 0.0
var smoothed := Vector3.ZERO
var has_position := false
var selection := -1

func setup(owner_builder: Node3D) -> void:
	host = owner_builder
	var mesh := preload("preview_mesh.gd").cube()
	target_material = outline(Color.WHITE,0.036,0.3)
	outline_material = outline(Color("fff3c4"),0.04,0.12)
	outline_material.set_shader_parameter("target_face",Vector3.ZERO)
	texture_material = ShaderMaterial.new()
	texture_material.shader = preload("res://shaders/building-preview-texture.gdshader")
	texture_material.set_shader_parameter("atlas",host.world.terrain.materials[0].get_shader_parameter("uAtlas"))
	for face in ["top","side","bottom"]:
		texture_material.set_shader_parameter("glass_"+face,load("res://assets/region-glass-%s.png"%face))
	target_outline = instance(mesh,target_material,10)
	target_outline.scale = Vector3.ONE*1.008
	ghost = instance(mesh,texture_material,11)
	placement_outline = instance(mesh,outline_material,12)
	wake()

func outline(color: Color,width: float,glow: float) -> ShaderMaterial:
	var material := ShaderMaterial.new()
	material.shader = preload("res://shaders/building-preview-outline.gdshader")
	material.set_shader_parameter("outline_color",color)
	material.set_shader_parameter("line_width",width)
	material.set_shader_parameter("glow_amount",glow)
	return material

func instance(mesh: ArrayMesh,material: ShaderMaterial,priority: int) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.material_override = material
	material.render_priority = priority
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	node.visible = false
	add_child(node)
	return node

func wake() -> void:
	active_until = Time.get_ticks_msec()+6000

func denied() -> void:
	denial_shake = 1.0
	wake()

func placed() -> void:
	scale_amount = 0.72
	wake()

func set_selection() -> void:
	if selection == host.selected: return
	selection = host.selected
	var id: int = host.store.palette[selection]
	var definition: Dictionary = host.store.definitions[id]
	texture_material.set_shader_parameter("layers",Vector3(definition.top,definition.side,definition.bottom))
	texture_material.set_shader_parameter("overlays",Vector2(definition.get("topOver",-1),definition.get("exposedSideOver",-1)))
	texture_material.set_shader_parameter("glass",id == host.store.GLASS)
	texture_material.set_shader_parameter("emission_amount",1.1 if definition.get("emissive",0) else 0.5)
	wake()

func update(delta: float,hit: Dictionary,enabled: bool) -> void:
	set_selection()
	elapsed += delta
	var show := enabled and not hit.is_empty() and Time.get_ticks_msec() < active_until
	var show_ghost := show and not overlaps_actor(hit.place)
	fade += (float(show)-fade)*(1.0-exp(-delta*(12.0 if show else 6.0)))
	ghost_fade += (float(show_ghost)-ghost_fade)*(1.0-exp(-delta*(12.0 if show_ghost else 8.0)))
	target_outline.visible = fade > 0.01
	ghost.visible = ghost_fade > 0.01
	placement_outline.visible = ghost.visible
	var night: float = float(host.world.effects.daylight.sample.stars)
	target_material.set_shader_parameter("animation_time",elapsed)
	target_material.set_shader_parameter("opacity",(1.0-0.45*night)*fade)
	outline_material.set_shader_parameter("animation_time",elapsed)
	if not hit.is_empty():
		target_outline.position = Vector3(hit.cell)+Vector3.ONE*0.5
		target_material.set_shader_parameter("target_face",Vector3(hit.direction))
	if show_ghost:
		var aim := Vector3(hit.place)+Vector3.ONE*0.5
		if not has_position or smoothed.distance_to(aim)>3.0: smoothed=aim
		else: smoothed=smoothed.lerp(aim,1.0-exp(-delta*26.0))
		has_position = true
	if not ghost.visible:
		if not target_outline.visible: has_position=false
		return
	scale_amount += (1.0-scale_amount)*(1.0-exp(-delta*12.0))
	denial_shake = maxf(0.0,denial_shake-delta*3.0)
	ghost.position = smoothed+Vector3(sin(denial_shake*40.0)*denial_shake*0.08,0,0)
	placement_outline.position = ghost.position
	var pulse := sin(elapsed*4.0)
	var size := (0.93+0.02*pulse)*scale_amount*(0.9+0.1*ghost_fade)
	ghost.scale = Vector3.ONE*size
	placement_outline.scale = Vector3.ONE*(size+0.004)
	var allowed: bool = not hit.is_empty() and host.can_place(hit.place)
	outline_material.set_shader_parameter("outline_color",Color("fff3c4") if allowed else Color("ff8a7a"))
	texture_material.set_shader_parameter("opacity",(0.4+0.04*pulse if allowed else 0.14)*ghost_fade)
	outline_material.set_shader_parameter("opacity",(0.9 if allowed else 0.75)*(1.0-0.35*night)*ghost_fade)

func overlaps_actor(cell: Vector3i) -> bool:
	var volume := AABB(Vector3(cell),Vector3.ONE).grow(0.12)
	return volume.has_point(host.actor.global_position+Vector3.UP*0.4) or volume.has_point(host.actor.global_position+Vector3.UP*1.1)
