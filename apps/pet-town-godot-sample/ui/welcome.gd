extends Control

signal dismissed
const Style = preload("res://ui/hud_style.gd")
const LOADING := "Waking up the town…"
const FAILURE := "The town could not load. Please reopen Pet Town."
var identity: Control
var tagline: Label
var start: Button
var note: Label
var loading: Label
var wash: ColorRect
var is_loading := false
var loading_background: TextureRect
var _layout_pending := false

func _ready() -> void:
	theme = Style.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	loading_background = TextureRect.new()
	loading_background.texture = load("res://ui/icons/loading-woodland.svg")
	loading_background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	loading_background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	loading_background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	loading_background.mouse_filter = MOUSE_FILTER_IGNORE
	loading_background.hide()
	add_child(loading_background)
	wash = ColorRect.new()
	wash.color = Color("f9e7b80f")
	wash.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	wash.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(wash)
	identity = Control.new()
	identity.mouse_filter = MOUSE_FILTER_IGNORE
	identity.size = Vector2(560, 148)
	identity.pivot_offset = Vector2(280, 74)
	identity.rotation = deg_to_rad(-2)
	add_child(identity)
	for x in [72, 483]:
		var rope := TextureRect.new()
		rope.texture = load("res://ui/icons/welcome-rope.svg")
		Style.position(rope, Rect2(x, -130, 5, 140))
		rope.mouse_filter = MOUSE_FILTER_IGNORE
		identity.add_child(rope)
	var sign := TextureRect.new()
	sign.texture = load("res://ui/icons/welcome-sign.svg")
	sign.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	Style.position(sign, Rect2(0, 0, 560, 148))
	sign.mouse_filter = MOUSE_FILTER_IGNORE
	identity.add_child(sign)
	var title := Style.label("Pet Town", 79)
	var lettering := FontVariation.new()
	lettering.base_font = Style.TITLE
	lettering.spacing_glyph = -4
	title.add_theme_font_override("font", lettering)
	title.add_theme_color_override("font_color", Color("fff2d0"))
	title.add_theme_color_override("font_shadow_color", Color("5a3e26"))
	title.add_theme_constant_override("shadow_offset_y", 3)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	Style.position(title, Rect2(0, 17, 560, 107))
	identity.add_child(title)
	var sprig := TextureRect.new()
	sprig.texture = load("res://ui/icons/welcome-sprig.svg")
	sprig.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	Style.position(sprig, Rect2(510, -20, 68, 78))
	sprig.pivot_offset = Vector2(34, 39)
	sprig.rotation = deg_to_rad(12)
	sprig.mouse_filter = MOUSE_FILTER_IGNORE
	identity.add_child(sprig)
	tagline = Style.label("a cozy little block world", 17)
	var tag_style := Style.panel("fff8e9", 12, "ffffff99", false)
	tag_style.content_margin_left = 19
	tag_style.content_margin_right = 19
	tagline.add_theme_stylebox_override("normal", tag_style)
	tagline.add_theme_color_override("font_color", Color("5f6247"))
	tagline.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tagline.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(tagline)
	start = Style.button("  Click anywhere to begin", Vector2(310, 55))
	start.icon = load("res://ui/icons/mouse.svg")
	start.add_theme_constant_override("icon_max_width", 24)
	start.add_theme_font_override("font", Style.HEAVY)
	for state in ["normal", "hover", "pressed"]:
		var begin_style := Style.panel("fffdf4", 32, "ffffff")
		begin_style.shadow_color = Color("5a482b24")
		start.add_theme_stylebox_override(state, begin_style)
	start.add_theme_color_override("font_focus_color", Style.INK)
	start.pressed.connect(finish)
	add_child(start)
	note = Style.label("best with sound on", 12)
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(note)
	loading = Style.label(LOADING, 16)
	loading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	loading.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	loading.hide()
	add_child(loading)
	resized.connect(layout)
	# First layout runs before wrapped-label fonts settle; relayout (once per
	# frame) when either label minimum changes so the tagline keeps its 44px
	# row and Begin stays on screen.
	loading.minimum_size_changed.connect(_request_layout)
	tagline.minimum_size_changed.connect(_request_layout)
	set_loading(false)

func _request_layout() -> void:
	if _layout_pending: return
	_layout_pending = true
	call_deferred("_settle_layout")

func _settle_layout() -> void:
	_layout_pending = false
	layout()

func layout() -> void:
	if not is_instance_valid(identity): return
	var compact := size.y <= 650 or size.x <= 1000
	var factor := 0.82 if compact else 1.0
	if size.x <= 700: factor = 0.55
	if size.x <= 430: factor = 0.43
	factor = minf(factor, maxf(0.2, (size.x - 40) / 600.0))
	var sign_top := (30.0 if size.y < 320 else clampf(size.y * 0.14, 45, 85)) if compact else 164.0
	identity.position = Vector2((size.x - 560) / 2, sign_top - 74 * (1 - factor))
	identity.scale = Vector2.ONE * factor
	tagline.add_theme_font_size_override("font_size", 16 if size.x <= 430 else 17)
	var tag_width := minf(size.x - 32, tagline.get_theme_font("font").get_string_size(tagline.text, HORIZONTAL_ALIGNMENT_LEFT, -1, tagline.get_theme_font_size("font_size")).x + 38)
	tagline.size = Vector2(tag_width, 44)
	tagline.position = Vector2((size.x - tag_width) / 2, minf(280, sign_top + 148 * factor + (18 if size.y < 400 else 32)) if compact else 348)
	start.add_theme_font_size_override("font_size", 16 if size.x <= 430 else 18)
	start.custom_minimum_size = Vector2(minf(310, size.x - 32), 55)
	start.reset_size()
	var failed := loading.text == FAILURE
	loading.custom_minimum_size = Vector2(minf(500 if failed else 290, size.x - 32), 55)
	loading.size = Vector2(loading.custom_minimum_size.x, maxf(55, loading.get_minimum_size().y))
	var cue_height := loading.size.y if is_loading else start.size.y
	var cue_y := minf(size.y - 152 if compact else 524, size.y - 65 - cue_height)
	cue_y = maxf(tagline.position.y + tagline.size.y + (12 if size.y < 400 else 24), cue_y)
	start.position = Vector2((size.x - start.size.x) / 2, cue_y)
	loading.position = Vector2((size.x - loading.size.x) / 2, cue_y)
	Style.position(note, Rect2(0, size.y - 47, size.x, 18))
	note.add_theme_color_override("font_color", Color("3d4d32") if is_loading else Color("fff9e7"))
	note.add_theme_color_override("font_shadow_color", Color.TRANSPARENT if is_loading else Color("314c30"))
	note.add_theme_constant_override("shadow_offset_y", 0 if is_loading else 1)

func set_loading(value: bool, message := LOADING) -> void:
	is_loading = value
	start.visible = not value
	loading.visible = value
	loading.text = message
	var failed := message == FAILURE
	loading.add_theme_font_size_override("font_size", 14 if failed else 16)
	loading.add_theme_color_override("font_color", Color("7a493f") if failed else Style.INK)
	var status_style := Style.panel("fffdf4", 18 if failed else 32, "ddc1a2" if failed else "ffffff")
	status_style.shadow_color = Color("5a482b24")
	status_style.content_margin_left = 24
	status_style.content_margin_right = 24
	status_style.content_margin_top = 14
	status_style.content_margin_bottom = 14
	loading.add_theme_stylebox_override("normal", status_style)
	loading_background.visible = value
	layout()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		accept_event()
		finish()

func finish() -> void:
	if not visible or is_loading: return
	hide()
	dismissed.emit()
