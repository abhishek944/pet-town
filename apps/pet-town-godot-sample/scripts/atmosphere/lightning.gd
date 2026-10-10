extends Node3D
var mesh: MeshInstance3D
var life := 0.0
func _ready() -> void:
	mesh = MeshInstance3D.new()
	mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mesh)
	mesh.hide()
func show_event(position_in_world: Vector3, strength: float, style: String) -> void:
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = Color("c8dbec")
	material.emission_enabled = true
	material.emission = Color("bfd7f5")
	material.emission_energy_multiplier = 1.5 if style == "soft" else 3.0
	var geometry := ImmediateMesh.new()
	geometry.surface_begin(Mesh.PRIMITIVE_TRIANGLES, material)
	var p := position_in_world
	var width := 0.035 if style == "soft" else 0.08
	for i in 12:
		var next := p + Vector3(randf_range(-1.3,1.3),-2.2,randf_range(-0.5,0.5))
		_segment(geometry,p,next,width)
		if i in [3,6,8]: _segment(geometry,p,p+Vector3(randf_range(-4,4),-4,1),width*0.45)
		p = next
	geometry.surface_end()
	mesh.mesh = geometry
	mesh.show()
	life = 0.22 + strength * 0.08
func _segment(geometry: ImmediateMesh, a: Vector3, b: Vector3, width: float) -> void:
	var side := Vector3.RIGHT * width
	for vertex in [a-side,a+side,b+side,a-side,b+side,b-side]: geometry.surface_add_vertex(vertex)
func clear() -> void:
	life = 0
	if mesh: mesh.hide()
func _process(delta: float) -> void:
	life -= delta
	if life <= 0: clear()
