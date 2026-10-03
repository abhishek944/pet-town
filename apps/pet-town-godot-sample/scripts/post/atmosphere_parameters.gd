extends RefCounted
## Source updatePostAtmosphere and height-aware sky fog, source low quality tier.
const TIERS := {"low": [.25,0.0,6.0,.5],"med": [.35,.2,8.0,.5],"high": [.5,.3,14.0,1.0]}
var quality := "low"
var daylight: Node

func sample(elevation: float, exposure: float, camera: Camera3D, focus: float, underwater: bool) -> PackedFloat32Array:
	var tier: Array = TIERS.get(quality,TIERS.med)
	var bloom_scale: float = tier[3]
	var day := smoothstep(.1,.45,elevation)
	var night := 1-smoothstep(-.28,0,elevation)
	var golden := maxf(0,1-day-night)
	var angle := asin(clampf(elevation,-1,1))
	var sky_golden := smoothstep(-.06,.04,angle)*(1-smoothstep(.22,.45,angle))
	var weight := maxf(maxf(golden,sky_golden),smoothstep(-.32,-.12,elevation)*(1-smoothstep(0,.2,elevation)))
	var raw = daylight.get("sample") if is_instance_valid(daylight) else null
	var state: Dictionary = raw if raw is Dictionary else {}
	var sun: Vector3 = state.get("sun_direction",Vector3(.4,elevation,.3).normalized())
	var horizon: Color = state.get("horizon",Color(.78,.88,1))
	var fog := _scene_color(horizon,exposure)
	var scatter := (_scene_color(state.get("sunHz",horizon),exposure)-fog)*(1-smoothstep(.35,.9,angle)*.6)
	var haze := fog.lerp(Vector3.ONE*fog.dot(Vector3(.2126,.7152,.0722)),.35*golden)
	var haze_amount := .9*.35*(1-float(underwater))*(1-.5*weight)*(1-.4*night)
	var start := maxf(18,focus*1.15)
	var mist := (.22*day+.18*golden+.1*night)*(1-float(underwater))
	var shaft_amount := 0.0
	var sun_uv := Vector2(.5,.5)
	var projection := Vector2.ONE
	var basis := Basis.IDENTITY
	var position := Vector3.ZERO
	var near := .05
	var far := 500.0
	if camera:
		basis = camera.global_basis
		position = camera.global_position
		near = camera.near
		far = camera.far
		var matrix := camera.get_camera_projection()
		projection = Vector2(matrix.x.x,matrix.y.y)
		sun_uv = camera.unproject_position(position+sun*1000)/camera.get_viewport().get_visible_rect().size
		var edge := maxf(absf(sun_uv.x*2-1),absf(sun_uv.y*2-1))
		shaft_amount = smoothstep(.05,.45,(-basis.z).dot(sun))*(1-smoothstep(1.1,1.8,edge))*smoothstep(-.02,.08,sun.y)*(.55*day+.7*golden)*(1-float(underwater))
	var sun_color: Color = state.get("sun",Color(1,.9,.74))
	sun_color = sun_color.srgb_to_linear()
	var normalized := Vector3(sun_color.r,sun_color.g,sun_color.b)/maxf(.3,maxf(sun_color.r,maxf(sun_color.g,sun_color.b)))
	var shaft: Vector3 = Vector3(1,.9,.74).lerp(normalized,.6)*(shaft_amount*.55 if shaft_amount>.002 else 0)
	return PackedFloat32Array([
		haze.x,haze.y,haze.z,haze_amount,
		start,start+92*maxf(1,focus/25),minf(1,.35+.65*weight),mist,
		sun.x,sun.y,sun.z,shaft_amount,
		shaft.x,shaft.y,shaft.z,.85*(1-.35*night)*(1+.6*sky_golden),
		sun_uv.x,sun_uv.y,.3*(1+.35*golden+.9*night)*(.65 if bloom_scale<.75 else .85 if bloom_scale<1 else 1.0),.55*(.5+.5*bloom_scale),
		projection.x,projection.y,near,far,
		basis.x.x,basis.x.y,basis.x.z,position.x,
		basis.y.x,basis.y.y,basis.y.z,position.y,
		basis.z.x,basis.z.y,basis.z.z,position.z,
		tier[0],tier[1],tier[2],tier[3],
		fog.x,fog.y,fog.z,float(state.get("fogN",18)),
		scatter.x,scatter.y,scatter.z,float(state.get("fogF",110))])

func _scene_color(display: Color, exposure: float) -> Vector3:
	var linear := display.srgb_to_linear()
	var value := Vector3(linear.r,linear.g,linear.b).clamp(Vector3.ZERO,Vector3.ONE*.93)
	var peak := maxf(value.x,maxf(value.y,value.z))
	if peak>.76:
		value *= (.24*.24/(1-peak)-.24+.76)/peak
	var low := minf(value.x,minf(value.y,value.z))
	var offset := (low+.04 if low>=.04 else sqrt(maxf(low,0)/6.25))-low
	return (value+Vector3.ONE*offset)/maxf(exposure,.001)
