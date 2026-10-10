extends Node3D
const Presets = preload("res://scripts/atmosphere/presets.gd")
var world: Node3D
var state: RefCounted
var current := Presets.sample("clear")
var start := current.duplicate()
var target := current.duplicate()
var selected := "clear"
var blend := 3.0
var real_seconds := 0.0
var wind_seconds := 0.0
var wet := 0.0
var sample := {}
var options := {}
var quality := preload("res://scripts/atmosphere/quality.gd").new()
var wetness := preload("res://scripts/atmosphere/wetness.gd").new()
var precipitation: Node3D
var storm: Node3D
func setup(owner_world: Node3D, owner_state: RefCounted) -> void:
	world = owner_world
	state = owner_state
	options = state.snapshot()
	selected = options.weather
	current = Presets.sample(selected)
	start = current.duplicate()
	target = current.duplicate()
	precipitation = preload("res://scripts/atmosphere/precipitation.gd").new()
	add_child(precipitation)
	precipitation.setup(world)
	storm = preload("res://scripts/atmosphere/storm.gd").new()
	add_child(storm)
func apply(snapshot: Dictionary) -> void:
	options = snapshot
	if selected != snapshot.weather:
		selected = snapshot.weather
		start = current.duplicate()
		target = Presets.sample(selected)
		blend = 0
func tick(delta: float, camera: Camera3D, _player: Node3D) -> Dictionary:
	real_seconds += delta
	blend = minf(3.0, blend + delta)
	for key in current: current[key] = lerpf(float(start[key]),float(target[key]),smoothstep(0,3,blend))
	var scale: float = {"gentle":0.6,"balanced":1.0,"dramatic":1.35}[options.intensity]
	var gust := 0.75 + sin(real_seconds * 0.47) * 0.17 + sin(real_seconds * 1.13) * 0.08
	var strength: float = current.wind_strength * gust * scale
	if options.reduced_motion: strength *= 0.55
	# Integrate speed so changing gusts/settings never jumps the animation phase.
	var wind_energy := smoothstep(0.24,1.15,strength)
	wind_seconds += delta * (1.0 + wind_energy * 0.65) * (0.65 if options.reduced_motion else 1.0)
	var target_wet := clampf(current.rain_amount + current.hail_amount,0,1)
	wet = move_toward(wet,target_wet,delta * (0.08 if target_wet > wet else 0.012))
	sample = current.duplicate()
	sample.merge(options, true)
	sample.audio_rain = current.rain_amount
	sample.audio_hail = current.hail_amount
	sample.audio_wind = current.wind_strength * gust
	sample.rain_amount = current.rain_amount * scale
	sample.hail_amount = current.hail_amount * scale
	sample.wind = Vector3(0.9,0,0.35).normalized() * strength
	sample.gust = strength
	sample.wind_seconds = wind_seconds
	sample.wetness = wet
	sample.real_seconds = real_seconds
	sample.particle_budget = quality.budget(options.quality,delta*1000)
	storm.tick(delta,sample,camera)
	sample.flash = storm.flash
	precipitation.apply(sample,camera)
	wetness.apply(world,wet)
	preload("res://scripts/atmosphere/wind.gd").apply(world,sample)
	return sample
func compose_daylight(base: Dictionary) -> Dictionary:
	return preload("res://scripts/atmosphere/lighting.gd").compose(base,sample)
