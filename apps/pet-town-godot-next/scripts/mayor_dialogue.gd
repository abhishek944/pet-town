class_name MayorDialogue
extends PanelContainer

const MAX_BUBBLE_HEIGHT := 300.0
const BUBBLE_WIDTH := 420.0
const CONTENT_PADDING := 32.0
const LABEL_SPACING := 6.0

var speaker: Label
var message: RichTextLabel
var current_text := ""
var current_name := ""
var desired_width := 180.0

func _ready() -> void:
	set_anchors_preset(Control.PRESET_TOP_LEFT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	size = Vector2(BUBBLE_WIDTH, 134)
	var card := StyleBoxFlat.new()
	card.bg_color = Color("11251ef0")
	card.border_color = Color("caa768")
	card.set_border_width_all(2)
	card.set_corner_radius_all(24)
	card.corner_radius_bottom_left = 5
	card.set_content_margin_all(16)
	add_theme_stylebox_override("panel", card)
	var stack := VBoxContainer.new()
	stack.add_theme_constant_override("separation", 6)
	add_child(stack)
	speaker = Label.new()
	speaker.add_theme_color_override("font_color", Color("f5c87d"))
	speaker.add_theme_font_size_override("font_size", 15)
	stack.add_child(speaker)
	message = RichTextLabel.new()
	message.bbcode_enabled = false
	message.scroll_active = true
	message.mouse_filter = Control.MOUSE_FILTER_STOP
	message.fit_content = false
	message.custom_minimum_size = Vector2.ZERO
	message.size_flags_vertical = Control.SIZE_EXPAND_FILL
	message.add_theme_color_override("default_color", Color("f8f3e8"))
	message.add_theme_font_size_override("normal_font_size", 21)
	stack.add_child(message)
	visible = false

func update_for(pet: LiveCompanion, camera: WorkshopCamera, speech: String, blocked: bool) -> void:
	if blocked or not is_instance_valid(pet) or speech.strip_edges().is_empty():
		visible = false
		return
	if not camera.fpv_enabled and camera.is_position_behind(pet.global_position):
		visible = false
		return
	var text_changed := speech != current_text
	var name_changed := pet.display_name != current_name
	if text_changed:
		current_text = speech
		message.text = speech
		message.scroll_to_line(0)
	if name_changed:
		current_name = pet.display_name
		speaker.text = current_name.to_upper()
	if text_changed or name_changed:
		var font := message.get_theme_font("normal_font")
		var font_size := message.get_theme_font_size("normal_font_size")
		desired_width = maxf(180.0, speaker.get_combined_minimum_size().x + CONTENT_PADDING)
		for line in speech.split("\n"):
			desired_width = maxf(desired_width, font.get_string_size(line, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x + CONTENT_PADDING + 8.0)
	var viewport := get_viewport_rect().size
	var bubble_width := maxf(0.0, minf(minf(desired_width, BUBBLE_WIDTH), viewport.x - 32.0))
	var chrome_height := CONTENT_PADDING + LABEL_SPACING + speaker.get_combined_minimum_size().y
	var max_height := maxf(0.0, minf(MAX_BUBBLE_HEIGHT, viewport.y - 32.0))
	var body_height := maxf(32.0, float(message.get_content_height()) + 4.0)
	var bubble_height := minf(chrome_height + body_height, max_height)
	message.custom_minimum_size.y = maxf(0.0, bubble_height - chrome_height)
	size = Vector2(bubble_width, bubble_height)
	if camera.fpv_enabled:
		position = Vector2(viewport.x - bubble_width - 16.0, (viewport.y - bubble_height) * 0.5)
	else:
		var anchor := camera.unproject_position(pet.global_position + Vector3.UP * 1.65)
		position = Vector2(
			clampf(anchor.x + 28.0, 16.0, viewport.x - bubble_width - 16.0),
			clampf(anchor.y - bubble_height - 44.0, 16.0, viewport.y - bubble_height - 16.0)
		)
	visible = true
