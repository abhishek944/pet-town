extends Node3D
var habitat: RefCounted
var turtles: Array=[]
var kelp:=Vector3(-129,0,108)

func setup(owner_habitat: RefCounted, data: Dictionary) -> void:
	habitat=owner_habitat
	for index in 2:
		var root: Node3D=load("res://assets/"+data.wildlife["ocean-sea-turtle-"+str(index)]).instantiate()
		add_child(root)
		preload("res://scripts/asset_style.gd").apply(root)
		var fins: Array=[]
		for part in 4:
			fins.append(root.find_child("Flipper"+str(part),true,false))
		turtles.append({"node":root,"fins":fins})

func update(_delta: float, time: float) -> void:
	for index in turtles.size():
		var turtle: Dictionary=turtles[index]
		var phase:=time*0.075+index*PI
		var point:=kelp+Vector3(5+cos(phase)*5,0,sin(phase)*7)
		turtle.node.visible=habitat.clear(point,2.5,1.7)
		if not turtle.node.visible: continue
		var breath:=maxf(0,sin(time*0.045+index*2)-0.8)*5
		var depth:=minf(habitat.depth(point)-0.7,1.8-breath*1.4)
		point.y=habitat.world.water_at(point)-depth
		turtle.node.position=point
		turtle.node.rotation.y=atan2(-sin(phase)*5,cos(phase)*7)
		turtle.node.rotation.x=sin(time*0.45+index)*0.035
		for fin_index in turtle.fins.size():
			var fin: Node3D=turtle.fins[fin_index]
			if fin:
				fin.rotation.z=sin(time*1.6+index+(0 if fin_index%2==0 else 1))*(-1 if fin_index<2 else 1)*0.26
