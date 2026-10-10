extends RefCounted
const DAY := 86400.0
const PACES := {"fast": 960.0, "medium": 3600.0, "slow": 14400.0}
const MOMENTS := {"early_morning":19800.0, "morning":32400.0, "noon":43200.0,
	"afternoon":54000.0, "evening":61200.0, "dusk":66600.0, "night":79200.0}
static func hold(seconds: float, moment: String) -> float:
	return floorf(seconds / DAY) * DAY + float(MOMENTS[moment])
static func advance(seconds: float, delta: float, pace: String) -> float:
	return seconds + maxf(0.0, delta) * DAY / float(PACES[pace])
