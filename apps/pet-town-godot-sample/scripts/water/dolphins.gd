extends Node3D
var habitat: RefCounted
var actor: CharacterBody3D
var actors: Array=[]
var lagoon:=Vector3(-94,0,66)
var reef:=Vector3(-112,0,84)

func setup(owner_habitat: RefCounted, data: Dictionary) -> void:
	habitat=owner_habitat
	for index in 3:
		var node: Node3D=load("res://assets/"+data.wildlife["ocean-dolphin-"+str(index)]).instantiate()
		add_child(node)
		preload("res://scripts/asset_style.gd").apply(node)
		node.position=lagoon+Vector3(index*2,0,0)
		actors.append({"node":node,"index":index,"mode":"roam","age":0.0,
			"cooldown":20.0+index*9,"heading":0.0,"breach":0.0,"next_breach":12.0+index*8,
			"target":Vector3.ZERO,"start":Vector3.ZERO,"ripple_in":0.0,"tail":node.find_child("Tail",true,false)})

func target_for(entry: Dictionary, delta: float, swimming: bool) -> void:
	entry.age+=delta
	entry.cooldown-=delta
	if entry.mode=="roam" and swimming and entry.cooldown<=0 and entry.node.position.distance_squared_to(actor.position)<324:
		entry.mode="escort"
		entry.age=0.0
	if entry.mode=="escort" and (not swimming or entry.age>8):
		entry.mode="guide" if swimming else "roam"
		entry.age=0.0
		entry.start=entry.node.position
		entry.cooldown=55.0
	if entry.mode=="guide" and entry.age>18:
		entry.mode="roam"
		entry.age=0.0
	if entry.mode=="escort":
		var forward:=Vector3.BACK.rotated(Vector3.UP,actor.visual.rotation.y)
		entry.target=actor.position+forward*3+Vector3(3.5,0,0)
	elif entry.mode=="guide": entry.target=entry.start.lerp(reef,minf(1,entry.age/13))
	else:
		var phase: float=entry.age*0.19+entry.index*2.1
		entry.target=lagoon+Vector3(cos(phase)*(8+entry.index),0,sin(phase)*(6+entry.index))

func update(delta: float, time: float) -> void:
	if not actor: return
	var swimming: bool=habitat.clear(actor.position,1) and actor.position.y<habitat.world.water_at(actor.position)+1.2
	for entry in actors:
		target_for(entry,delta,swimming)
		var point: Vector3=entry.node.position
		var offset: Vector3=entry.target-point
		offset.y=0
		var distance:=offset.length()
		point+=offset.normalized()*minf(distance,delta*(2.3 if entry.mode=="roam" else 3.8))
		entry.node.visible=habitat.clear(point,2.3,1.8)
		if not entry.node.visible:
			entry.mode="roam"
			if habitat.clear(entry.target,2.3,1.8): entry.node.position=entry.target
			continue
		if distance>0.05: entry.heading=lerp_angle(entry.heading,atan2(offset.x,offset.z),minf(1,delta*3))
		entry.next_breach-=delta
		if entry.next_breach<=0 and entry.breach==0 and entry.mode=="roam":
			entry.breach=0.001
			entry.next_breach=25.0+entry.index*7
			ripple(point,0.65)
		var height:=-0.85
		var pitch: float=sin(time*3.5+entry.index)*0.06
		if entry.breach>0:
			entry.breach+=delta
			var phase:=minf(1,entry.breach/1.8)
			height+=sin(phase*PI)*2.1
			pitch=-(1-phase*2)*0.65
			if phase==1:
				entry.breach=0.0
				ripple(point,1.2)
		point.y=habitat.world.water_at(point)+height
		entry.ripple_in-=delta
		if entry.ripple_in<=0 and height>-0.5:
			ripple(point,0.18)
			entry.ripple_in=0.8
		entry.node.position=point
		entry.node.rotation=Vector3(pitch,entry.heading,0)
		if entry.tail: entry.tail.rotation.x=sin(time*4.8+entry.index)*0.22

func ripple(point: Vector3, strength: float) -> void:
	if habitat.world.effects: habitat.world.effects.add_ripple(point,strength)
