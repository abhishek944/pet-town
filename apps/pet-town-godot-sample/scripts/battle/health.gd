extends RefCounted
var value := 100.0
var protection := 0.0
var flash := 0.0
var recent_hit := 0.0

func tick(delta: float) -> void:
	protection = maxf(0, protection - delta)
	flash = maxf(0, flash - delta)
	recent_hit = maxf(0, recent_hit - delta)

func hurt(amount: float) -> bool:
	if value <= 0 or protection > 0: return false
	value = maxf(0, value - amount)
	protection = 0.75
	flash = 0.35
	recent_hit = 1.6
	return true
