extends CharacterBody3D
## A single live broker agent. World placement remains in the saved town scene.

signal retirement_finished(agent_id: String)

@export var display_name := "Agent"
@export var agent_id := ""
@export var live_status := "unknown"
@export var appearance_label := "Knight"
@export var walk_speed := 1.65

@onready var navigation_agent: NavigationAgent3D = $NavigationAgent3D
@onready var visual: Node3D = $Visual
@onready var player: AnimationPlayer = $Visual/AnimationPlayer
@onready var caption: Label3D = $Caption

const STATUS_ACTIVITIES := {
	"working": ["gather", "deliver"],
	"blocked": ["rest"],
	"idle": ["visit", "eat", "rest"],
	"done": ["visit"],
	"unknown": ["rest"],
}

var ready_to_walk := false
var manually_controlled := false
var manual_direction := Vector3.ZERO
var destination := Vector3.ZERO
var destination_index := 0
var pause_left := 0.0
var path_settling_frames := 0
var seated := false
var retiring := false
var retirement_tween: Tween
var activity_text := "Connecting"

func _apply_live_status() -> void:
	if retiring:
		return
	caption.text = display_name
	if manually_controlled:
		activity_text = "Exploring town"
		return
	activity_text = {
		"working": "Working in town",
		"blocked": "Waiting on a blocker",
		"idle": "Taking a town break",
		"done": "Work complete",
		"unknown": "Awaiting a live update",
	}.get(live_status, "Awaiting a live update")
	destination_index = _stable_index(_destinations_for_status().size())
	pause_left = 0.0
	call("_set_seated", false)
	if ready_to_walk:
		if live_status == "done":
			destination = global_position
			navigation_agent.target_position = global_position
			_arrive()
		else:
			_choose_next_destination()
			if live_status == "idle":
				global_position = destination
				reset_physics_interpolation()
				_arrive()
	else:
		call("_animate", "Idle_A")

func _choose_next_destination() -> void:
	call("_set_seated", false)
	var destinations := _destinations_for_status()
	if destinations.is_empty():
		destination = global_position
		call("_animate", "Idle_A")
		pause_left = 2.0
		return
	destination = destinations[destination_index % destinations.size()]
	destination_index += 1
	var closest := NavigationServer3D.map_get_closest_point(navigation_agent.get_navigation_map(), destination)
	if closest != Vector3.ZERO:
		destination = closest
	navigation_agent.target_position = destination
	path_settling_frames = 2
	if live_status == "blocked" or live_status == "unknown":
		call("_animate", "Walking_A")
	else:
		call("_animate", "Walking_A")

func _arrive() -> void:
	navigation_agent.velocity = Vector3.ZERO
	velocity.x = 0.0
	velocity.z = 0.0
	match live_status:
		"working":
			call("_animate", "Interact")
			pause_left = 2.2
		"blocked":
			call("_animate", "Idle_A")
			pause_left = 3.2
		"idle":
			call("_animate", "Idle_B")
			call("_set_seated", true)
			activity_text = "Resting in the town center"
			pause_left = 8.0
		"done":
			call("_animate", "Idle_B")
			call("_set_seated", true)
			activity_text = "Work complete"
			pause_left = 0.0
		_:
			call("_animate", "Idle_A")
			pause_left = 2.5


func _stable_index(count: int) -> int:
	if count <= 0:
		return 0
	var value := 0
	for index in agent_id.length():
		value = (value * 31 + agent_id.unicode_at(index)) % 2147483647
	return value % count

func _destinations_for_status() -> Array[Vector3]:
	var destinations: Array[Vector3] = []
	var activities: Array = STATUS_ACTIVITIES.get(live_status, STATUS_ACTIVITIES.unknown)
	for spot in get_tree().get_nodes_in_group("interaction_spots"):
		if String(spot.activity) not in activities:
			continue
		if live_status == "idle" and String(spot.display_name) != "Town bench":
			continue
		var target: Vector3 = spot.global_position
		if live_status == "idle":
			var seed := _stable_seed()
			var angle := fmod(float(seed) * 2.39996323, TAU)
			var radius := 2.6 + float((seed / 17) % 3) * 1.35
			target += Vector3(cos(angle), 0.0, sin(angle)) * radius
		destinations.append(target)
	return destinations

func _stable_seed() -> int:
	var value := 0
	for index in agent_id.length():
		value = (value * 31 + agent_id.unicode_at(index)) % 2147483647
	return value

func _normalized_status(value: String) -> String:
	var normalized := value.to_lower()
	return normalized if normalized in STATUS_ACTIVITIES else "unknown"
