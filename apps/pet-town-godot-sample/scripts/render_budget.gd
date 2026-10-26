extends Node
## Limit drawing work, not simulation, voice or the desktop bridge.
const FOREGROUND_FPS := 60
const BACKGROUND_FPS := 15
var previous_cap := 0
var foreground_cap := FOREGROUND_FPS

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	previous_cap = Engine.max_fps
	if previous_cap > 0: foreground_cap = mini(FOREGROUND_FPS,previous_cap)
	get_window().focus_entered.connect(set_focused.bind(true))
	get_window().focus_exited.connect(set_focused.bind(false))
	set_focused(get_window().has_focus())

func set_focused(focused: bool) -> void:
	Engine.max_fps = foreground_cap if focused else mini(foreground_cap,BACKGROUND_FPS)

func _exit_tree() -> void:
	Engine.max_fps = previous_cap
