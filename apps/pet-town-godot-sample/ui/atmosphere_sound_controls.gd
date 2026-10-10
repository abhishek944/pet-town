extends RefCounted
const S = preload("res://ui/atmosphere_style.gd")
static func build(page: VBoxContainer) -> void:
	S.section(page,"Weather sound")
	page.volume_label = S.label("Weather volume · 60%",12)
	page.add_child(page.volume_label)
	page.volume_slider = HSlider.new()
	page.volume_slider.max_value = 1
	page.volume_slider.step = 0.01
	page.volume_slider.custom_minimum_size.y = 44
	page.volume_slider.accessibility_name = "Weather volume"
	S.Base.slider(page.volume_slider)
	page.volume_slider.value_changed.connect(func(value: float): page.choose("weather_volume",value))
	page.add_child(page.volume_slider)
	S.toggle(page,"Thunder sound","thunder_enabled",page.choose)
	S.toggle(page,"Quieter while Mayor speaks","duck_for_mayor",page.choose)
	page.add_child(S.label("World mute and volume still apply. Mayor voice stays separate.",11))
	S.section(page,"")
	var remembered := PanelContainer.new()
	remembered.add_theme_stylebox_override("panel",S.box("edf0da",10,"d6debd"))
	page.saved_caption = S.label("",11)
	page.saved_caption.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	remembered.add_child(page.saved_caption)
	page.set_saved(page.saved_ok)
	page.add_child(remembered)
