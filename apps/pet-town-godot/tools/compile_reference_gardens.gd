extends SceneTree

const SOURCE := "res://assets/cozy-island/reference-gardens-editable.glb"
const OUTPUT := "res://scenes/reference_gardens_trimmed.scn"
const SHADOW_BUDGET := preload("res://scripts/town_shadow_budget.gd")

func _initialize() -> void:
	call_deferred("_compile")

func _compile() -> void:
	var scene := (load(SOURCE) as PackedScene).instantiate() as Node3D
	root.add_child(scene)
	var removed := 0
	for candidate in scene.find_children("*", "MeshInstance3D", true, false):
		var mesh := candidate as MeshInstance3D
		var label := String(mesh.name).to_lower()
		if "deep sea" in label or "sea glint" in label:
			mesh.free()
			removed += 1
	assert(removed == 197, "Unexpected number of redundant sea tiles")
	SHADOW_BUDGET.disable_tiny_casters(scene)
	var packed := PackedScene.new()
	assert(packed.pack(scene) == OK)
	assert(ResourceSaver.save(packed, OUTPUT) == OK)
	print("Compiled reference gardens without %d redundant sea tiles" % removed)
	quit()
