extends Node
var host: Node3D

func _ready() -> void:
	# Sample after the camera and animated companion presentation (priority 20).
	process_priority = 30

func _process(_delta: float) -> void:
	if not host or not host.town: return
	var records: Array=[]
	for id in host.actors:
		var actor: Node3D=host.actors[id]
		var head:=actor.get_global_transform_interpolated().origin+Vector3.UP*1.4
		if is_instance_valid(actor.presentation):
			var node=actor.presentation.nodes.get("head")
			if is_instance_valid(node): head=node.get_global_transform_interpolated().origin
		records.append({"id":id,"label":actor.entry.get("label","Companion"),"status":actor.entry.get("status",""),"head":head,"root":actor.visual})
	host.town.hud.set_companion_labels(records,host.town.rig.camera,host.selected_id)
