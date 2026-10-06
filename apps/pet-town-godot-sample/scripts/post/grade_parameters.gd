extends RefCounted
## Exact CozyOutputShader presets and sampleFxDaylightWeights from the Three world.
const PRESETS := [
	[[1.02,1,.985],[.075,.075,.095],[1,1,1],[1.06,1.04,1],[-.015,0,.04],[.012,.004,0],[.78,.72,.78],.96,.1,.08,.32],
	[[1,1,1],[.045,.04,.065],[1.1,1.07,1.04],[1.01,1,.995],[-.02,0,.03],[.035,.018,-.01],[.72,.6,.72],1.04,.12,.12,.38],
	[[.9,.96,1.08],[.03,.045,.085],[.98,1,1.04],[.97,1,1.03],[-.01,.01,.035],[0,.01,.02],[.55,.6,.78],.82,.1,.08,.5]
]
var clock := 0.0

func sample(elevation: float, exposure: float, delta: float, _underwater: bool) -> PackedFloat32Array:
	var dt := clampf(delta, 0, .1)
	clock += dt
	var day := smoothstep(.1, .45, elevation)
	var night := 1-smoothstep(-.28, 0, elevation)
	var weights := Vector3(day, maxf(0, 1-day-night), night)
	var vectors: Array[Vector3] = []
	for i in 7:
		var value := Vector3.ZERO
		for j in 3:
			var entry: Array = PRESETS[j][i]
			value += Vector3(entry[0],entry[1],entry[2])*weights[j]
		vectors.append(value)
	var scalars := PackedFloat32Array()
	for i in range(7,11):
		scalars.append(PRESETS[0][i]*weights.x+PRESETS[1][i]*weights.y+PRESETS[2][i]*weights.z)
	var fourth := [exposure,scalars[0],scalars[1],scalars[2],scalars[3],.25*weights.y+.1*weights.z,1.0]
	var result := PackedFloat32Array()
	for i in 7:
		result.append_array(PackedFloat32Array([vectors[i].x,vectors[i].y,vectors[i].z,fourth[i]]))
	result.append_array(PackedFloat32Array([0,0,clock,1]))
	return result
