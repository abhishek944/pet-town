extends Node3D
var world: Node3D
var material: ShaderMaterial
var surface: MeshInstance3D
var camera: Camera3D

func setup(owner_world: Node3D) -> void:
	world=owner_world
	material=ShaderMaterial.new()
	material.shader=preload("underwater.gdshader")
	material.render_priority=100
	surface=MeshInstance3D.new()
	var quad:=QuadMesh.new()
	quad.size=Vector2(2,2)
	surface.mesh=quad
	surface.material_override=material
	surface.extra_cull_margin=16384
	surface.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	surface.position.z=-0.2
	surface.visible=false
	add_child(surface)

func update(time: float) -> void:
	var current:=get_viewport().get_camera_3d()
	if not current:
		surface.visible=false
		return
	if camera!=current:
		camera=current
		surface.reparent(camera,false)
	var point:=camera.global_position
	var water: float=world.water_at(point)
	surface.visible=water>-999 and point.y<water+0.2
	if not surface.visible: return
	var daylight := smoothstep(-0.28,0.0,float(world.effects.daylight.sample.sun_elevation))
	material.set_shader_parameter("light_level",lerpf(0.055,1.0,daylight))
	material.set_shader_parameter("water_y",water)
	material.set_shader_parameter("clock",time)

func _exit_tree() -> void:
	if is_instance_valid(surface): surface.queue_free()
