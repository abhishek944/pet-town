extends Node
## Installs scene-only postprocessing; CanvasLayer UI is composed afterwards.
const Effect = preload("res://scripts/post/cozy_effect.gd")
const Parameters = preload("res://scripts/post/grade_parameters.gd")
var atmosphere := preload("res://scripts/post/atmosphere_parameters.gd").new()
var effect: CompositorEffect
var environment: Environment
var parameters := Parameters.new()
var focus_y := .5
var focus_distance := 26.0
var has_focus := false

func setup(holder: WorldEnvironment) -> void:
	environment = holder.environment
	atmosphere.daylight = holder.get_parent()
	environment.ssao_enabled = false
	environment.fog_enabled = false
	environment.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	environment.tonemap_exposure = 1.0
	environment.adjustment_enabled = false
	environment.glow_enabled = false
	if not holder.compositor:
		holder.compositor = Compositor.new()
	effect = Effect.new()
	var effects := holder.compositor.compositor_effects
	effects.append(effect)
	holder.compositor.compositor_effects = effects

func update(sun_elevation: float, exposure: float, delta: float, camera: Camera3D = null, target: Node3D = null, underwater := false) -> void:
	if not effect:
		return
	# The custom pass owns exposure. Godot only performs the final sRGB transfer.
	environment.tonemap_exposure = 1.0
	var focus := PackedFloat32Array([.5,26,0,0,.05,500,.5,.3])
	if camera:
		var desired_y := .5
		var desired_distance := 26.0
		if target:
			var point := target.global_position+Vector3.UP*.8
			var screen := camera.unproject_position(point)
			var size := camera.get_viewport().get_visible_rect().size
			var ndc := screen/size*2-Vector2.ONE
			if not camera.is_position_behind(point) and absf(ndc.x)<.95 and absf(ndc.y)<.95:
				desired_y = clampf(1-screen.y/size.y,.3,.7)
				desired_distance = maxf(3,camera.global_position.distance_to(point))
		var weight := 1-exp(-clampf(delta,0,.1)*5) if has_focus else 1.0
		focus_y = lerpf(focus_y,desired_y,weight)
		focus_distance = lerpf(focus_distance,desired_distance,weight)
		has_focus = true
		var tilt := smoothstep(.12,.6,camera.global_basis.z.y)
		focus = PackedFloat32Array([focus_y,focus_distance,.4*tilt,.5*tilt,camera.near,camera.far,.5,.3])
	effect.set_frame(parameters.sample(sun_elevation,exposure,delta,underwater),focus,atmosphere.sample(sun_elevation,exposure,camera,focus_distance,underwater))
