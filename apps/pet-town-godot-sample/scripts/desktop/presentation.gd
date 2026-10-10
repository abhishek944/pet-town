extends Node
## Live Mayor overrides on the exact source facial nodes after baked locomotion.
var body: RigidBody3D
var nodes: Dictionary={}
var mouth_scale:=Vector3.ONE
var elapsed:=0.0
var look_yaw:=0.0
var look_pitch:=0.0
var was_speaking:=false

func setup(actor: RigidBody3D, model: Node3D, facial: Dictionary) -> void:
	body=actor
	process_priority=20
	for key in ["smile","mouthO","neck","head","hips"]:
		var value=facial.get(key,"")
		var name: String=str(value.get("name","")) if value is Dictionary else str(value)
		if not name.is_empty(): nodes[key]=model.find_child(name,true,false)
	var scale_data=facial.get("mouthScale",facial.get("mouthOScale",[1,1,1]))
	if facial.get("mouthO") is Dictionary: scale_data=facial.mouthO.get("scale",scale_data)
	if scale_data is Array and scale_data.size()==3:
		mouth_scale=Vector3(float(scale_data[0]),float(scale_data[1]),float(scale_data[2]))

func _process(delta: float) -> void:
	if not is_instance_valid(body) or body.entry.get("source","")!="mayor": return
	elapsed=body.elapsed
	var speaking: bool=body.entry.get("status","")=="speaking"
	var smile: Node3D=nodes.get("smile")
	var mouth: Node3D=nodes.get("mouthO")
	if speaking:
		if smile: smile.visible=false
		if mouth:
			mouth.visible=true
			mouth.scale=Vector3(mouth_scale.x,0.55+absf(sin(elapsed*11))*0.3,mouth_scale.z)
	elif was_speaking:
		if smile: smile.visible=true
		if mouth: mouth.scale=Vector3.ONE*0.00001
	was_speaking=speaking
	if not body.entry.get("conversationActive",false) or body.controlled or not body.view: return
	var offset: Vector3=body.view.camera.global_position-body.global_position
	var yaw:=wrapf(atan2(offset.x,offset.z)-body.visual.rotation.y,-PI,PI)
	var pitch:=atan2(offset.y-1.05,Vector2(offset.x,offset.z).length())
	if absf(yaw)>1.5:
		yaw=0
		pitch=0
	look_yaw=lerpf(look_yaw,clampf(yaw,-0.95,0.95),1-exp(-7*delta))
	look_pitch=lerpf(look_pitch,clampf(pitch,-0.45,0.4),1-exp(-7*delta))
	var neck: Node3D=nodes.get("neck")
	var hips: Node3D=nodes.get("hips")
	if neck:
		neck.rotation.x-=look_pitch
		neck.rotation.y+=look_yaw*0.75
		neck.rotation.z+=look_yaw*-0.06
	if hips: hips.rotation.y+=look_yaw*0.2
