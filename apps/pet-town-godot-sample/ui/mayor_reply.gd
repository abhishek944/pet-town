extends Control
## Latest native Mayor reply, anchored to companion_labels' already projected/occlusion-checked nameplate.

const Style = preload("res://ui/hud_style.gd")
const BUBBLE_WIDTH := 360.0
const MAX_PANEL_HEIGHT := 190.0
const MIN_PANEL_HEIGHT := 58.0
const POINTER_HEIGHT := 13.0
const EDGE_MARGIN := 12.0
const TOOLBAR_GAP := 8.0
const TEXT_SIZE := 13

var latest_reply := ""
var head_label: Control
var toolbar: Control
var bubble: PanelContainer
var reply_text: TextEdit
var pointer_border: Polygon2D
var pointer_fill: Polygon2D
var measured_reply := ""
var measured_width := -1.0
var measured_height := 0.0

func _ready() -> void:
	# Keep the speech tail on this frame's name pill (priority 40).
	process_priority = 50
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	pointer_border = Polygon2D.new()
	pointer_border.color = Color("dfcca4")
	add_child(pointer_border)
	pointer_fill = Polygon2D.new()
	pointer_fill.color = Color("fff8e9")
	add_child(pointer_fill)

	bubble = PanelContainer.new()
	bubble.mouse_filter = Control.MOUSE_FILTER_PASS
	var frame := StyleBoxFlat.new()
	frame.bg_color = Color("fff8e9")
	frame.border_color = Color("dfcca4")
	frame.set_border_width_all(1)
	frame.set_corner_radius_all(20)
	frame.content_margin_left = 17
	frame.content_margin_right = 17
	frame.content_margin_top = 11
	frame.content_margin_bottom = 11
	frame.shadow_color = Color("263f3233")
	frame.shadow_size = 7
	frame.shadow_offset = Vector2(0, 4)
	bubble.add_theme_stylebox_override("panel", frame)
	add_child(bubble)

	reply_text = TextEdit.new()
	reply_text.editable = false
	reply_text.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	reply_text.custom_minimum_size = Vector2(0, 0)
	reply_text.add_theme_font_override("font", Style.BODY)
	reply_text.add_theme_font_size_override("font_size", TEXT_SIZE)
	reply_text.add_theme_color_override("font_color", Color("5f6348"))
	reply_text.add_theme_color_override("font_readonly_color", Color("5f6348"))
	reply_text.add_theme_constant_override("line_spacing", 0)
	reply_text.add_theme_color_override("font_selected_color", Color("fff8e9"))
	reply_text.add_theme_color_override("selection_color", Color("54703d"))
	reply_text.focus_mode = Control.FOCUS_ALL
	reply_text.accessibility_name = "Mayor's latest reply"
	reply_text.tooltip_text = "Tab to read. Use Page Up or Page Down to scroll the reply."
	reply_text.mouse_filter = Control.MOUSE_FILTER_STOP
	var clear_style := StyleBoxFlat.new()
	clear_style.bg_color = Color.TRANSPARENT
	clear_style.set_content_margin_all(0)
	reply_text.add_theme_stylebox_override("normal", clear_style)
	reply_text.add_theme_stylebox_override("read_only", clear_style)
	var focus_style := StyleBoxFlat.new()
	focus_style.bg_color = Color.TRANSPARENT
	focus_style.border_color = Color("54703d")
	focus_style.set_border_width_all(2)
	focus_style.set_corner_radius_all(4)
	focus_style.set_content_margin_all(1)
	reply_text.add_theme_stylebox_override("focus", focus_style)
	bubble.add_child(reply_text)

	get_viewport().size_changed.connect(_layout_reply)
	reply_text.text = latest_reply
	reply_text.accessibility_description = latest_reply
	_layout_reply()

func set_latest_reply(text: String) -> void:
	if latest_reply == text: return
	latest_reply = text
	if not is_instance_valid(reply_text): return
	reply_text.text = latest_reply
	reply_text.accessibility_description = latest_reply
	if not latest_reply.is_empty(): reply_text.scroll_vertical = 0
	_layout_reply()

func set_head_label(label: Control) -> void:
	head_label = label
	_layout_reply()

func set_toolbar(control: Control) -> void:
	toolbar = control
	_layout_reply()

func _process(_delta: float) -> void:
	_layout_reply()

func _layout_reply() -> void:
	if not is_instance_valid(bubble) or latest_reply.is_empty() or not is_instance_valid(head_label) or not head_label.is_visible_in_tree():
		_hide_reply()
		return
	var viewport := get_viewport_rect().size
	if viewport.x <= EDGE_MARGIN * 2 or viewport.y <= EDGE_MARGIN * 2:
		_hide_reply()
		return

	var width := minf(BUBBLE_WIDTH, viewport.x - EDGE_MARGIN * 2)
	var text_width := maxf(1, width - 36)
	if measured_reply != latest_reply or not is_equal_approx(measured_width, text_width):
		measured_reply = latest_reply
		measured_width = text_width
		measured_height = Style.BODY.get_multiline_string_size(latest_reply, HORIZONTAL_ALIGNMENT_LEFT, text_width, TEXT_SIZE).y
	var desired_panel_height := clampf(measured_height + 26, MIN_PANEL_HEIGHT, MAX_PANEL_HEIGHT)
	var safe_top := EDGE_MARGIN
	if is_instance_valid(toolbar) and toolbar.is_visible_in_tree():
		safe_top = maxf(safe_top, toolbar.position.y + toolbar.size.y + TOOLBAR_GAP)
	# Keep the approved name pill visible and actionable beneath the speech tail.
	var anchor := head_label.position + Vector2(head_label.size.x * 0.5, -8)
	if anchor.x < 0 or anchor.x > viewport.x or anchor.y < 0 or anchor.y > viewport.y:
		_hide_reply()
		return
	var space_above := maxf(0, anchor.y - safe_top - POINTER_HEIGHT)
	var min_panel_height := maxf(MIN_PANEL_HEIGHT, bubble.get_combined_minimum_size().y)
	if min_panel_height > MAX_PANEL_HEIGHT or space_above < min_panel_height:
		_hide_reply()
		return
	var panel_height := minf(maxf(desired_panel_height, min_panel_height), space_above)
	var bubble_left := clampf(anchor.x - width * 0.5, EDGE_MARGIN, viewport.x - width - EDGE_MARGIN)
	var local_anchor_x := anchor.x - bubble_left
	var pointer_center := clampf(local_anchor_x, minf(14, width * 0.5), maxf(width * 0.5, width - 14))
	bubble.size = Vector2(width, panel_height)
	bubble.position = Vector2(bubble_left, anchor.y - POINTER_HEIGHT - panel_height)
	pointer_border.position.x = bubble_left
	pointer_fill.position.x = bubble_left
	bubble.show()
	pointer_border.polygon = PackedVector2Array([Vector2(pointer_center - 13, bubble.position.y + panel_height - 1), Vector2(pointer_center + 13, bubble.position.y + panel_height - 1), Vector2(local_anchor_x, bubble.position.y + panel_height + POINTER_HEIGHT)])
	pointer_fill.polygon = PackedVector2Array([Vector2(pointer_center - 11, bubble.position.y + panel_height), Vector2(pointer_center + 11, bubble.position.y + panel_height), Vector2(local_anchor_x, bubble.position.y + panel_height + POINTER_HEIGHT - 1)])
	pointer_border.show()
	pointer_fill.show()

func _hide_reply() -> void:
	if is_instance_valid(bubble): bubble.hide()
	if is_instance_valid(pointer_border): pointer_border.hide()
	if is_instance_valid(pointer_fill): pointer_fill.hide()
