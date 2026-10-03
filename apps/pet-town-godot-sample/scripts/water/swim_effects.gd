extends Node3D
var world: Node3D
var actor: CharacterBody3D
var bubbles: MultiMeshInstance3D
var plankton: MultiMeshInstance3D
var time:=0.0

func setup(owner_world: Node3D) -> void:
	world=owner_world
	bubbles=points(24,Color("c5eee9"),0.06,0.45)
	plankton=points(40,Color("87ffe2"),0.055,0.85)

func points(count: int, tint: Color, size: float, alpha: float) -> MultiMeshInstance3D:
	var node:=MultiMeshInstance3D.new()
	var mesh:=MultiMesh.new()
	mesh.transform_format=MultiMesh.TRANSFORM_3D
	var quad:=QuadMesh.new()
	quad.size=Vector2.ONE*size
	var material:=StandardMaterial3D.new()
	material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
	material.billboard_mode=BaseMaterial3D.BILLBOARD_ENABLED
	material.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA
	material.albedo_color=Color(tint,alpha)
	material.no_depth_test=false
	quad.material=material
	mesh.mesh=quad
	mesh.instance_count=count
	node.multimesh=mesh
	node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(node)
	return node

func update(delta: float, night: float) -> void:
	time+=delta
	if not actor: return
	var point:=actor.position
	var surface: float=world.water_at(point)
	var motion=actor.get("motion")
	bubbles.visible=motion and motion.swimming and point.y+1.2<surface
	if bubbles.visible:
		for i in 24:
			var phase:=fposmod(time*0.6+i/24.0,1)
			var at:=point+Vector3(sin(i*2.4+time)*(0.15+phase*0.3),0,cos(i*2.4+time)*(0.15+phase*0.3))
			at.y=minf(surface-0.1,point.y+0.65+phase*1.8)
			bubbles.multimesh.set_instance_transform(i,Transform3D(Basis.IDENTITY,at))
	plankton.visible=surface>-999 and point.y<surface+0.45 and night>0.2
	if not plankton.visible: return
	var material: StandardMaterial3D=plankton.multimesh.mesh.material
	material.albedo_color.a=minf(0.85,(night-0.2)*1.1)
	for i in 40:
		var angle:=i*2.39996+time*0.1
		var radius:=0.45+(i%7)*0.18
		var at:=point+Vector3(cos(angle)*radius,0,sin(angle)*radius)
		var floor_y: float=world.ground_at(at)
		var water_y: float=world.water_at(at)
		var valid:=water_y-floor_y>0.25 and water_y>-999
		at.y=maxf(floor_y+0.15,minf(water_y-0.06,point.y+sin(time*0.7+i)*0.65))
		plankton.multimesh.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3.ONE if valid else Vector3.ZERO),at))
