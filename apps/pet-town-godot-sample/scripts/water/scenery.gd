extends Node3D
const Habitat=preload("habitat.gd")
var habitat:=Habitat.new()
var records: Array=[]
var time:=0.0
var poll:=0.0

func setup(world: Node3D, data: Dictionary) -> void:
	habitat.world=world
	for record in data.get("scenery",[]):
		var packed=load("res://assets/"+record.file)
		if not packed: continue
		var node: Node3D=packed.instantiate()
		add_child(node)
		preload("res://scripts/asset_style.gd").apply(node)
		node.position=Vector3(record.position[0],record.position[1],record.position[2])
		node.rotation.y=record.yaw
		var entry: Dictionary=record.duplicate()
		entry.node=node
		records.append(entry)
	reseat()

func reseat() -> void:
	for record in records:
		var height:=habitat.supported(record)
		record.node.visible=is_finite(height)
		if record.node.visible: record.node.position.y=height

func update(delta: float) -> void:
	time+=delta
	poll-=delta
	if poll<=0:
		reseat()
		poll=0.75
	for record in records:
		if record.sway and record.node.visible:
			record.node.rotation.z=sin(time*0.75+record.phase)*0.055
			record.node.rotation.x=sin(time*0.5+record.phase)*0.035
