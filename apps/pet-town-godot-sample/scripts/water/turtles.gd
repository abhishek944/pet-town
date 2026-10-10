extends Node3D
const MarineBody = preload("marine_body.gd")
var habitat: RefCounted
var turtles: Array=[]
var kelp:=Vector3(-129,0,108)

func setup(owner_habitat: RefCounted, data: Dictionary) -> void:
	habitat=owner_habitat
	for index in 2:
		var root: Node3D=load("res://assets/"+data.wildlife["ocean-sea-turtle-"+str(index)]).instantiate()
		var body := MarineBody.new()
		body.configure_body(preload("res://scripts/physics/profiles.gd").marine("turtle"))
		body.habitat = habitat
		body.minimum_depth = 2.5
		body.habitat_radius = 1.1
		body.add_child(root)
		add_child(body)
		var phase := index * PI
		body.position = kelp + Vector3(5 + cos(phase) * 5, habitat.world.water_at(kelp) - 1.8, sin(phase) * 7)
		preload("res://scripts/asset_style.gd").apply(root)
		var fins: Array=[]
		for part in 4:
			fins.append(root.find_child("Flipper"+str(part),true,false))
		turtles.append({"node":body,"model":root,"fins":fins})

func update(delta: float, time: float, activity: RefCounted = null) -> void:
	for index in turtles.size():
		var turtle: Dictionary=turtles[index]
		if activity:
			turtle.node.set_simulating(activity.near(turtle.node.global_position,turtle.node.simulating))
		if not turtle.node.simulating: continue
		var phase:=time*0.075+index*PI
		var point:=kelp+Vector3(5+cos(phase)*5,0,sin(phase)*7)
		var breath:=maxf(0,sin(time*0.045+index*2)-0.8)*5
		var depth:=minf(habitat.depth(point)-0.7,1.8-breath*1.4)
		point.y=habitat.world.water_at(point)-depth
		turtle.node.seek(point, 0.75, delta)
		turtle.model.rotation.x=sin(time*0.45+index)*0.035
		for fin_index in turtle.fins.size():
			var fin: Node3D=turtle.fins[fin_index]
			if fin:
				fin.rotation.z=sin(time*1.6+index+(0 if fin_index%2==0 else 1))*(-1 if fin_index<2 else 1)*0.26
