extends Control

signal dismissed
const Style = preload("res://ui/hud_style.gd")
var identity: Control
var tagline: Label
var start: Button
var note: Label
var loading: Label
var wash: ColorRect
var is_loading := false
var loading_background: TextureRect

func _ready() -> void:
	theme = Style.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	wash = ColorRect.new()
	wash.color = Color("f9e7b80f")
	wash.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	wash.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(wash)
	identity = Control.new()
	identity.mouse_filter = MOUSE_FILTER_IGNORE
	identity.size = Vector2(920, 210)
	identity.pivot_offset = Vector2(460, 105)
	add_child(identity)
	var sign := TextureRect.new()
	sign.texture = load("res://ui/icons/welcome-sign.svg")
	Style.position(sign, Rect2(92, 12, 736, 195))
	sign.pivot_offset = Vector2(368, 93)
	sign.rotation = deg_to_rad(-2)
	sign.mouse_filter = MOUSE_FILTER_IGNORE
	identity.add_child(sign)
	var title := Style.label("Pet Town", 107)
	var lettering := FontVariation.new()
	lettering.base_font = Style.TITLE
	lettering.spacing_glyph = -6
	title.add_theme_font_override("font", lettering)
	title.add_theme_color_override("font_color", Color("fff2d0"))
	title.add_theme_color_override("font_shadow_color", Color("5a3e26"))
	title.add_theme_constant_override("shadow_offset_y", 3)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	Style.position(title, Rect2(92, 31, 736, 142))
	title.pivot_offset = Vector2(368, 71)
	title.rotation = deg_to_rad(-2)
	identity.add_child(title)
	var sprig := TextureRect.new()
	sprig.texture = load("res://ui/icons/welcome-sprig.svg")
	Style.position(sprig, Rect2(768, -10, 82, 94))
	sprig.rotation = deg_to_rad(12)
	sprig.mouse_filter = MOUSE_FILTER_IGNORE
	identity.add_child(sprig)
	tagline = Style.label("a cozy little block world", 19)
	tagline.add_theme_stylebox_override("normal", Style.panel("fffcf0ee", 24, "ffffff99", false))
	add_child(tagline)
	start = Style.button("  Click anywhere to begin", Vector2(310, 55))
	start.icon = load("res://ui/icons/mouse.svg")
	start.add_theme_constant_override("icon_max_width", 24)
	start.add_theme_font_size_override("font_size", 19)
	start.add_theme_font_override("font", Style.HEAVY)
	start.add_theme_stylebox_override("normal", Style.panel("fffdf4", 32, "ffffff"))
	start.pressed.connect(finish)
	add_child(start)
	note = Style.label("best with sound on", 12)
	note.add_theme_color_override("font_color", Color("fff9e7"))
	note.add_theme_color_override("font_shadow_color", Color("314c30"))
	note.add_theme_constant_override("shadow_offset_y", 1)
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(note)
	loading = Style.label("Waking up the town…", 16)
	loading.add_theme_stylebox_override("normal", Style.panel("fffdf4", 32, "ffffff"))
	add_child(loading)
	loading.hide()
	resized.connect(layout)
	layout()

func layout() -> void:
	var compact := size.y <= 650 or size.x <= 1000
	var factor := 0.82 if compact else 1.0
	if size.x <= 700:
		factor = 0.55
	if size.x <= 430:
		factor = 0.43
	identity.position = Vector2(size.x / 2 - 460, 65 if compact else 126)
	identity.scale = Vector2.ONE * factor
	tagline.position = Vector2((size.x - tagline.get_combined_minimum_size().x) / 2, 280 if compact else 350)
	start.position = Vector2((size.x - 310) / 2, size.y - 152 if compact else 524)
	Style.position(note, Rect2(0, size.y - 47, size.x, 18))
	if loading:
		loading.position = Vector2((size.x - loading.get_combined_minimum_size().x) / 2, start.position.y)

func set_loading(value: bool, message := "Waking up the town…") -> void:
	is_loading = value
	start.visible = not value
	loading.visible = value
	loading.text = message
	if value and not loading_background:
		var gradient := Gradient.new()
		gradient.colors = PackedColorArray([Color("9fd8ff"), Color("c6e9ff"), Color("ffe8f0")])
		gradient.offsets = PackedFloat32Array([0.0, 0.45, 1.0])
		var texture := GradientTexture2D.new()
		texture.gradient = gradient
		texture.fill_from = Vector2(0, 0)
		texture.fill_to = Vector2(0, 1)
		loading_background = TextureRect.new()
		loading_background.texture = texture
		loading_background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		loading_background.mouse_filter = MOUSE_FILTER_IGNORE
		wash.add_child(loading_background)
	if loading_background: loading_background.visible = value
	layout()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		accept_event()
		finish()

func finish() -> void:
	if not visible or is_loading:
		return
	hide()
	dismissed.emit()
