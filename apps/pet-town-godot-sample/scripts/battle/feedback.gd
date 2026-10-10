extends Node3D
var labels: Array = []

func number(point: Vector3, text: String) -> void:
	var label := Label3D.new()
	label.text = text
	label.font = preload("res://ui/fonts/nunito-900.ttf")
	label.font_size = 36
	label.outline_size = 8
	label.modulate = Color("fff5d5")
	label.outline_modulate = Color("5a3922")
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.no_depth_test = false
	add_child(label)
	label.global_position = point
	labels.append({"node": label, "age": 0.0})

func _process(delta: float) -> void:
	for i in range(labels.size() - 1, -1, -1):
		var record: Dictionary = labels[i]
		record.age += delta
		record.node.position.y += delta * 0.35
		record.node.modulate.a = 1 - record.age / 0.6
		if record.age >= 0.6:
			record.node.queue_free()
			labels.remove_at(i)
