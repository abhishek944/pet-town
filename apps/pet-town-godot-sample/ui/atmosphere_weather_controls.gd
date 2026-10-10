extends RefCounted
const S = preload("res://ui/atmosphere_style.gd")
const LABELS := {"clear":"Super sunny","cloudy":"Cloudy","light_rain":"Light rain","heavy_rain":"Heavy rain",
	"thunderstorm":"Thunderstorm","hailstorm":"Hailstorm","windy":"Windy","mist":"Mist"}
static func build(page: VBoxContainer) -> void:
	S.section(page,"")
	page.weather_summary = S.heading(page,"Weather")
	S.choices(page,"weather",[["clear","☀\nSuper sunny"],["cloudy","☁\nCloudy"],["light_rain","☂\nLight rain"],
		["heavy_rain","☔\nHeavy rain"],["thunderstorm","ϟ\nThunderstorm"],["hailstorm","❄\nHailstorm"],
		["windy","≋\nWindy"],["mist","◌\nMist"]],page.choose,4)
	page.add_child(S.label("Stays until you choose another atmosphere. Any time of day works.",9))
