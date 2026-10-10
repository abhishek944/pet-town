extends Control

const PORTRAIT = preload("art/picnic-portrait.png")
const LANDSCAPE = preload("art/picnic-landscape.png")
const POSES = preload("art/picnic-poses.png")
# The imagegen atlas has irregular rows. Rectangles exclude adjacent poses.
const BOXES := [
	[[16,3,236,325],[260,3,261,325],[520,3,263,325],[782,3,242,325],[1026,3,254,325],[1283,3,217,325]],
	[[44,329,209,244],[302,329,201,244],[544,329,220,244],[787,329,246,244],[1070,329,194,244],[1322,329,195,244]],
	[[13,574,226,251],[266,574,237,251],[523,574,236,251],[777,574,244,251],[1023,574,238,251],[1285,574,230,251]],
	[[38,826,201,178],[301,826,197,178],[539,826,211,178],[796,826,200,178],[1051,826,206,178],[1308,826,201,178]]
]
const PLACEMENTS := [Vector3(0.36,0.69,0.45),Vector3(0.66,0.75,0.30),Vector3(0.145,0.77,0.33),Vector3(0.83,0.80,0.20)]
var elapsed := 0.0
var motion_enabled := true
var frame := -1

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	resized.connect(queue_redraw)
	visibility_changed.connect(sync_processing)
	sync_processing()

func sync_processing() -> void:
	set_process(motion_enabled and is_visible_in_tree())
	queue_redraw()

func set_motion_enabled(value: bool) -> void:
	motion_enabled = value
	sync_processing()

func _process(delta: float) -> void:
	elapsed += delta
	var next := floori(elapsed * 5.0)
	if next != frame:
		frame = next
		queue_redraw()

func _draw() -> void:
	var background: Texture2D = PORTRAIT if size.x / maxf(size.y, 1.0) < 1.25 else LANDSCAPE
	var source_size := background.get_size()
	var factor := maxf(size.x / source_size.x, size.y / source_size.y)
	var drawn := source_size * factor
	draw_texture_rect(background, Rect2((size - drawn) / 2.0, drawn), false)
	for i in [0,2,1,3]:
		var phase := posmod(floori((elapsed if motion_enabled else 0.0) * 5.0 + i * 1.6), 6)
		var b: Array = BOXES[i][phase]
		var source := Rect2(b[0],b[1],b[2],b[3])
		var placement: Vector3 = PLACEMENTS[i]
		var height := size.y * placement.z
		var extent := Vector2(height * source.size.x / source.size.y, height)
		var feet := Vector2(size.x * placement.x, size.y * placement.y)
		draw_texture_rect_region(POSES, Rect2(feet - Vector2(extent.x / 2.0, extent.y), extent), source)
