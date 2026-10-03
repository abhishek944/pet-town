extends Node
var host: Node3D

func _process(_delta: float) -> void:
	if not host or not host.town: return
	var records: Array=[]
	for id in host.actors:
		var actor: Node3D=host.actors[id]
		var head:=actor.global_position+Vector3.UP*1.4
		if is_instance_valid(actor.presentation):
			var node=actor.presentation.nodes.get("head")
			if is_instance_valid(node): head=node.global_position
		records.append({"id":id,"label":actor.entry.get("label","Companion"),"status":actor.entry.get("status",""),"head":head,"root":actor.visual})
	host.town.hud.set_companion_labels(records,host.town.rig.camera,host.selected_id)
