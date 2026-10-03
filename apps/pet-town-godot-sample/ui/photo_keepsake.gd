extends CanvasLayer
const Style = preload("hud_style.gd")
var town: Node3D
var busy := false
var last_photo: Dictionary = {}
var overlay: Control
var card: PanelContainer
var flash: ColorRect
var vignette: ColorRect

func _ready() -> void:
	layer = 20
	overlay = Control.new()
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(overlay)
	flash = ColorRect.new()
	flash.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	flash.color = Color(1, 1, 1, 0)
	overlay.add_child(flash)
	vignette = ColorRect.new()
	vignette.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vignette.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var material := ShaderMaterial.new()
	material.shader = preload("photo_frame.gdshader")
	vignette.material = material
	vignette.modulate.a = 0
	overlay.add_child(vignette)

func capture() -> void:
	if busy: return
	busy = true
	town.hud.visible = false
	overlay.hide()
	await RenderingServer.frame_post_draw
	var photo := get_viewport().get_texture().get_image()
	var stamp := Time.get_datetime_string_from_system().replace("-", "").replace(":", "").replace("T", "-")
	var filename := "pet-town-" + stamp + ".png"
	var path := "user://" + filename
	var error := photo.save_png(path)
	town.ambience.play_effect("shutter")
	overlay.show()
	flash.color.a = 0.95
	create_tween().tween_property(flash, "color:a", 0.0, 0.7).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	var frame := create_tween()
	frame.tween_property(vignette, "modulate:a", 1.0, 0.21)
	frame.tween_interval(0.77)
	frame.tween_property(vignette, "modulate:a", 0.0, 0.42)
	if error == OK:
		last_photo = {"path": ProjectSettings.globalize_path(path), "name": filename, "width": photo.get_width(), "height": photo.get_height()}
		show_card(photo, filename.trim_suffix(".png"))
	else: town.hud.show_toast("Couldn't save photo")
	await get_tree().create_timer(1.1).timeout
	town.hud.visible = true
	await get_tree().create_timer(2.1).timeout
	if is_instance_valid(card):
		var finish := create_tween()
		finish.tween_property(card, "position:x", card.position.x + 420, 0.6).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
		finish.tween_callback(card.queue_free)
	busy = false

func show_card(photo: Image, caption: String) -> void:
	if is_instance_valid(card): card.queue_free()
	card = PanelContainer.new()
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.theme = Style.theme()
	card.custom_minimum_size = Vector2(300, 225)
	var box := Style.panel("ffffff", 14, "ffffff")
	box.content_margin_left = 12
	box.content_margin_right = 12
	box.content_margin_top = 12
	box.content_margin_bottom = 14
	card.add_theme_stylebox_override("panel", box)
	overlay.add_child(card)
	card.position = get_viewport().get_visible_rect().size - Vector2(330, 259)
	card.pivot_offset = Vector2(150, 112)
	card.rotation = deg_to_rad(-4)
	var column := VBoxContainer.new()
	column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(column)
	var image := TextureRect.new()
	image.mouse_filter = Control.MOUSE_FILTER_IGNORE
	image.texture = ImageTexture.create_from_image(photo)
	image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	image.custom_minimum_size = Vector2(276, 155)
	column.add_child(image)
	column.add_child(Style.label("Photo saved!", 16))
	column.add_child(Style.text(caption, 11))
	var tape := Panel.new()
	tape.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tape.add_theme_stylebox_override("panel", Style.panel("ffd678bf", 4, "ffd67800", false))
	tape.position = Vector2(108, -12)
	tape.size = Vector2(84, 24)
	tape.rotation = deg_to_rad(3)
	card.add_child(tape)
