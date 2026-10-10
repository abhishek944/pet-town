extends RefCounted
var average_msec := 16.7
var automatic := 900
var timer := 0.0
func budget(setting: String, frame_msec: float) -> int:
	average_msec = lerpf(average_msec, frame_msec, 0.015)
	timer += minf(frame_msec / 1000.0, 0.1)
	if timer > 4:
		timer = 0
		if average_msec > 28: automatic = maxi(240, automatic - 180)
		elif average_msec < 19: automatic = mini(1500, automatic + 120)
	return int({"low":240, "medium":700, "high":1500}.get(setting, automatic))
