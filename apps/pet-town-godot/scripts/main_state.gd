extends Node3D
## Godot renderer for the Pet Town JSONL bridge. The helper remains the agent authority.

const FOLLOW_RESPONSE := 6.0
const FOLLOW_HEIGHT_RESPONSE := 2.0
const FOLLOW_OFFSET := Vector3(0.0, 0.8, 0.0)
const MIN_CAMERA_DISTANCE := 24.0
const MAX_CAMERA_DISTANCE := 440.0
const WIDESCREEN_OVERVIEW_DISTANCE := 205.0
const WIDESCREEN_ASPECT := 1.6
const DETAILS_WIDTH := 400.0
const DRAG_NONE := 0
const DRAG_PAN := 1
const DRAG_ORBIT := 2
const COMPANION_SCENE := preload("res://scenes/companion.tscn")
const MAYOR_ID := "pet-town-mayor"
const MODEL_SCENES := [
	preload("res://assets/kaykit/Knight.glb"),
	preload("res://assets/kaykit/Ranger.glb"),
	preload("res://assets/kaykit/Rogue.glb"),
	preload("res://assets/kaykit/Barbarian.glb"),
	preload("res://assets/kaykit/Mage.glb"),
	preload("res://assets/kaykit/Rogue_Hooded.glb"),
	preload("res://assets/kaykit/skeletons/Skeleton_Mage.glb"),
	preload("res://assets/kaykit/skeletons/Skeleton_Minion.glb"),
	preload("res://assets/kaykit/skeletons/Skeleton_Rogue.glb"),
	preload("res://assets/kaykit/skeletons/Skeleton_Warrior.glb"),
]
const MODEL_NAMES := [
	"Knight", "Ranger", "Rogue", "Barbarian", "Mage", "Hooded Rogue",
	"Skeleton Mage", "Skeleton Minion", "Skeleton Rogue", "Skeleton Warrior",
]

@onready var camera: Camera3D = $OrbitCamera
@onready var overview_target: Vector3 = $CameraFocus.position
@onready var pets_root: Node3D = $LiveAgents
@onready var town_ui: CanvasLayer = $TownUI

var camera_target := Vector3.ZERO
var selected_pet: CharacterBody3D
var controlled_pet: CharacterBody3D
var selected_id := ""
var following_pet := false
var click_origin := Vector2.ZERO
var camera_yaw := deg_to_rad(90.0)
var camera_pitch := deg_to_rad(43.0)
var camera_distance := WIDESCREEN_OVERVIEW_DISTANCE
var camera_dragging := false
var camera_drag_mode := DRAG_NONE
var camera_at_overview := true
var camera_drag_position := Vector2.ZERO

var pets_by_id := {}
var agents_by_id := {}
var stable_agent_ids: Array[String] = []
var bridge_pid := -1
var bridge_stdin: FileAccess
var bridge_stdout: FileAccess
var bridge_retry_at := 0
var received_snapshot := false
var mayor_focus_serial := -1
var mayor_listening := false
var speaking_wave: Panel
var speaking_bars: Array[ColorRect] = []

var ui_root: Control
var notice: Label
var details_panel: Panel
var details_name: Label
var details_subtitle: Label
var details_status: Label
var details_source: Label
var details_camera: Label
var details_appearance: Label
var details_action: Button
var details_close: Button
var avatar_reset: Button
var avatar_frame: Panel
var avatar_container: SubViewportContainer
var avatar_viewport: SubViewport
var avatar_root: Node3D
var avatar_model: Node3D
var avatar_yaw := deg_to_rad(-18.0)
var avatar_pitch := deg_to_rad(-8.0)
var avatar_dragging := false
var avatar_drag_position := Vector2.ZERO
var help_scrim: ColorRect
var help_board: Panel
var help_close: Button

func _model_index(id: String) -> int:
	return _stable_number(id) % MODEL_SCENES.size()

func _stable_number(value: String) -> int:
	var number := 0
	for index in value.length():
		number = (number * 31 + value.unicode_at(index)) % 2147483647
	return number

func _spawn_position(index: int) -> Vector3:
	var points := [Vector3(-3.0, 2.0, 1.0), Vector3(2.0, 1.85, -4.0), Vector3(3.1, 2.36, 8.0), Vector3(-5.0, 2.14, 4.0), Vector3(1.0, 2.1, 3.0), Vector3(5.0, 1.8, -4.0)]
	var slot := index % 60
	var base: Vector3 = points[slot % points.size()]
	var ring := slot / points.size()
	return base + Vector3(cos(float(slot) * 2.4) * ring * 1.5, 0.0, sin(float(slot) * 2.4) * ring * 1.5)

func _display_status(status: String) -> String:
	return {"working": "Working", "blocked": "Blocked", "idle": "Idle", "done": "Done", "unknown": "Unknown", "ended": "Agent ended"}.get(status, "Unknown")

func _display_source(source: String) -> String:
	return source.capitalize() if not source.is_empty() else "Unknown"

func _appearance_for(id: String) -> String:
	return MODEL_NAMES[0 if id == MAYOR_ID else _model_index(id)] if not id.is_empty() else "—"

func _status_color(status: String) -> Color:
	return {"working": Color("70d287"), "blocked": Color("e49b5b"), "idle": Color("b9c1b8"), "done": Color("91c9e8"), "unknown": Color("b9a77a"), "ended": Color("b9c1b8")}.get(status, Color("b9c1b8"))

func _set_notice(message: String) -> void:
	notice.text = message
	notice.visible = not message.is_empty()

func _details_are_open() -> bool:
	return is_instance_valid(details_panel) and details_panel.visible

func _help_is_open() -> bool:
	return is_instance_valid(help_board) and help_board.visible


func _style(background: Color, radius: float, border := Color.TRANSPARENT, border_width := 0) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = background
	box.corner_radius_top_left = int(radius)
	box.corner_radius_top_right = int(radius)
	box.corner_radius_bottom_left = int(radius)
	box.corner_radius_bottom_right = int(radius)
	box.border_color = border
	box.border_width_left = border_width
	box.border_width_top = border_width
	box.border_width_right = border_width
	box.border_width_bottom = border_width
	box.content_margin_left = 12.0
	box.content_margin_right = 12.0
	box.content_margin_top = 10.0
	box.content_margin_bottom = 10.0
	return box
