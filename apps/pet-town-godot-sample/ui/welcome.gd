extends Control

signal dismissed
const Style = preload("res://ui/hud_style.gd")
const LOADING := "Waking up the town…"
const FAILURE := "The town could not load. Please reopen Pet Town."
var picnic: Control
var identity: Label
var tagline: Label
var start: Button
var note: Label
var loading: Label
var dot: Panel
var footer: VBoxContainer
var loading_cue: PanelContainer
var dot_pulse: Tween
var loading_row: HBoxContainer
var is_loading := false
var world_rendering_suspended := false

func suspend_world_rendering() -> void:
	world_rendering_suspended = true
	get_viewport().disable_3d = true

func resume_world_rendering() -> void:
	if not world_rendering_suspended: return
	world_rendering_suspended = false
	get_viewport().disable_3d = false

func _exit_tree() -> void:
	resume_world_rendering()

func _ready() -> void:
	theme = Style.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	picnic = preload("res://ui/opening/picnic.gd").new()
	add_child(picnic)
	var preferences := ConfigFile.new()
	preferences.load("user://preferences.cfg")
	picnic.set_motion_enabled(not bool(preferences.get_value("atmosphere", "reduced_motion", false)))
	identity = Style.title("Pet Town", 84, "694732")
	var lettering := FontVariation.new()
	lettering.base_font = Style.TITLE
	lettering.spacing_glyph = -3
	identity.add_theme_font_override("font", lettering)
	identity.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(identity)
	tagline = Style.text("a cozy little block world", 15, "786850")
	tagline.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(tagline)
	footer = VBoxContainer.new()
	footer.mouse_filter = MOUSE_FILTER_IGNORE
	footer.add_theme_constant_override("separation", 12)
	add_child(footer)
	footer.minimum_size_changed.connect(position_footer)
	start = Style.button("Let’s play →")
	start.add_theme_font_size_override("font_size", 16)
	for state in ["normal", "hover", "pressed"]:
		var box := cue_style("586e48" if state == "normal" else "657c52", "384b2a")
		start.add_theme_stylebox_override(state, box)
		start.add_theme_color_override("font_" + ("color" if state == "normal" else state + "_color"), Color("fff9e9"))
	start.add_theme_color_override("font_focus_color", Color("fff9e9"))
	start.pressed.connect(finish)
	start.size_flags_horizontal = SIZE_SHRINK_CENTER
	footer.add_child(start)
	loading_cue = PanelContainer.new()
	loading_cue.mouse_filter = MOUSE_FILTER_IGNORE
	loading_cue.size_flags_horizontal = SIZE_SHRINK_CENTER
	var paper := cue_style("fff9eaf5", "c2b28f")
	paper.content_margin_left = 25
	paper.content_margin_right = 25
	paper.content_margin_top = 13
	paper.content_margin_bottom = 13
	loading_cue.add_theme_stylebox_override("panel", paper)
	footer.add_child(loading_cue)
	loading_row = HBoxContainer.new()
	loading_row.mouse_filter = MOUSE_FILTER_IGNORE
	loading_row.add_theme_constant_override("separation", 12)
	loading_cue.add_child(loading_row)
	dot = Panel.new()
	dot.mouse_filter = MOUSE_FILTER_IGNORE
	dot.custom_minimum_size = Vector2(7, 7)
	dot.size_flags_vertical = SIZE_SHRINK_CENTER
	var dot_style := Style.panel("83925e", 4, "83925e", false)
	dot_style.set_content_margin_all(0)
	dot.add_theme_stylebox_override("panel", dot_style)
	loading_row.add_child(dot)
	loading = Style.label(LOADING, 16)
	loading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	loading.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	loading.size_flags_horizontal = SIZE_EXPAND_FILL
	loading.add_theme_color_override("font_color", Color("55442e"))
	loading_row.add_child(loading)
	note = Style.text("best with sound on", 11, "685a46")
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	note.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	var note_style := Style.panel("fcf4e2db", 9, "fcf4e200", false)
	note_style.set_content_margin_all(4)
	note.add_theme_stylebox_override("normal", note_style)
	note.size_flags_horizontal = SIZE_SHRINK_CENTER
	footer.add_child(note)
	resized.connect(layout)
	visibility_changed.connect(func():
		if not is_visible_in_tree(): resume_world_rendering())
	set_loading(false)

func cue_style(color: String, border: String) -> StyleBoxFlat:
	var box := Style.panel(color, 30, border, false)
	box.border_width_top = 1
	box.border_width_bottom = 3
	box.content_margin_left = 29
	box.content_margin_right = 29
	box.content_margin_top = 16
	box.content_margin_bottom = 16
	box.shadow_color = Color("5f41201f")
	box.shadow_size = 9
	box.shadow_offset = Vector2(0,4)
	return box

func layout() -> void:
	if not is_instance_valid(identity): return
	var title_size := roundi(clampf(minf(size.x * 0.095, size.y * 0.117), 32, 84))
	identity.add_theme_font_size_override("font_size", title_size)
	Style.position(identity, Rect2(0, size.y * 0.06 - 2, size.x, title_size * 1.25))
	tagline.add_theme_font_size_override("font_size", 12 if size.x < 500 else 15)
	Style.position(tagline, Rect2(0, identity.position.y + title_size * 1.25 + 14, size.x, 22))
	var failed := is_loading and loading.text != LOADING
	var font_size := 14 if failed or size.x < 500 else 16
	loading.add_theme_font_size_override("font_size", font_size)
	loading.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART if failed else TextServer.AUTOWRAP_OFF
	var text_width := loading.get_theme_font("font").get_string_size(loading.text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x
	var content_width := ceilf(text_width) + loading_cue.get_theme_stylebox("panel").get_minimum_size().x
	content_width += dot.custom_minimum_size.x + loading_row.get_theme_constant("separation")
	var cue_width := minf(maxf(size.x - 32, 0), 480 if failed else content_width)
	loading_cue.custom_minimum_size = Vector2(cue_width, 52)
	start.custom_minimum_size = Vector2(minf(230, size.x - 32), 58)
	position_footer()

func position_footer() -> void:
	if not is_instance_valid(footer): return
	footer.size = footer.get_combined_minimum_size()
	footer.position = Vector2((size.x - footer.size.x) / 2, size.y * 0.952 - footer.size.y)

func set_loading(value: bool, message := LOADING) -> void:
	is_loading = value
	start.visible = not value
	loading_cue.visible = value
	loading.text = message
	var failed := message != LOADING and value
	dot.visible = not failed
	if is_instance_valid(dot_pulse): dot_pulse.kill()
	dot.modulate.a = 1.0
	if value and not failed and picnic.motion_enabled:
		dot_pulse = create_tween().set_loops().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		dot_pulse.tween_property(dot, "modulate:a", 0.32, 0.7)
		dot_pulse.tween_property(dot, "modulate:a", 1.0, 0.7)
	loading.add_theme_color_override("font_color", Color("7a493f") if failed else Color("55442e"))
	if failed: picnic.set_motion_enabled(false)
	layout()

func _input(event: InputEvent) -> void:
	if not is_visible_in_tree(): return
	# Loading consumes all input before gameplay shortcuts see it. Ready keeps
	# keyboard/controller activation explicit and clears held actions on exit.
	if event is InputEventKey or event is InputEventJoypadButton:
		get_viewport().set_input_as_handled()
		if not is_loading and (event.is_action_pressed("ui_focus_next") or event.is_action_pressed("ui_focus_prev")): start.grab_focus()
		if not is_loading and event.is_action_pressed("ui_accept") and not event.is_echo(): finish()
	elif is_loading:
		get_viewport().set_input_as_handled()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		accept_event()
		finish()

func finish() -> void:
	if not is_visible_in_tree() or is_loading: return
	preload("res://scripts/town_input.gd").clear_gameplay()
	resume_world_rendering()
	hide()
	dismissed.emit()
