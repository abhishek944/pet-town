extends CanvasLayer
const Style = preload("hud_style.gd")
var town: Node3D
var busy := false
var last_photo: Dictionary = {}
var overlay: Control
var card: Panel
var flash: ColorRect
var vignette: ColorRect

func _ready() -> void:
	layer = 20
	overlay = Control.new()
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(overlay)
	overlay.resized.connect(layout_card)
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
	card = Panel.new()
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.theme = Style.theme()
	card.custom_minimum_size = Vector2(224, 268)
	card.size = Vector2(224, 268)
	var frame := Style.panel("f5eddc", 12, "d8c5a2")
	frame.shadow_color = Color("26362422")
	frame.shadow_size = 8
	frame.shadow_offset = Vector2(0, 8)
	card.add_theme_stylebox_override("panel", frame)
	overlay.add_child(card)
	layout_card()
	for side in range(2):
		var rail := Panel.new()
		rail.mouse_filter = Control.MOUSE_FILTER_IGNORE
		rail.position = Vector2(0 if side == 0 else 212, 0)
		rail.size = Vector2(12, 268)
		var rail_style := StyleBoxFlat.new()
		rail_style.bg_color = Color("b4a181")
		rail_style.corner_radius_top_left = 12 if side == 0 else 0
		rail_style.corner_radius_bottom_left = 12 if side == 0 else 0
		rail_style.corner_radius_top_right = 12 if side == 1 else 0
		rail_style.corner_radius_bottom_right = 12 if side == 1 else 0
		rail.add_theme_stylebox_override("panel", rail_style)
		card.add_child(rail)
		for index in range(12):
			var hole := ColorRect.new()
			hole.mouse_filter = Control.MOUSE_FILTER_IGNORE
			hole.color = Color("fff8e9")
			hole.position = Vector2(3, 12 + index * 22)
			hole.size = Vector2(5, 8)
			rail.add_child(hole)
	var image := TextureRect.new()
	image.mouse_filter = Control.MOUSE_FILTER_IGNORE
	image.texture = ImageTexture.create_from_image(photo)
	image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	image.position = Vector2(20, 15)
	image.custom_minimum_size = Vector2(182, 168)
	image.size = Vector2(182, 168)
	card.add_child(image)
	var title := Style.label("Photo saved!", 15)
	title.position = Vector2(20, 196)
	title.size = Vector2(184, 20)
	title.add_theme_color_override("font_color", Color("4c6146"))
	card.add_child(title)
	var name := Style.text(caption, 10, "73654f")
	name.position = Vector2(20, 220)
	name.autowrap_mode = TextServer.AUTOWRAP_ARBITRARY
	name.clip_text = true
	name.accessibility_name = caption
	card.accessibility_description = "Photo saved: " + caption
	card.add_child(name)
	# Apply the width after inherited fonts and minimum-size changes settle.
	name.set_deferred("size", Vector2(184, 40))

func layout_card() -> void:
	if not is_instance_valid(card): return
	var viewport := get_viewport().get_visible_rect().size
	card.position = Vector2(maxf(8, viewport.x - 248), clampf(viewport.y - 402, 8, maxf(8, viewport.y - 276)))
