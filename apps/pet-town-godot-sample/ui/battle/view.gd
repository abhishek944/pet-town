extends CanvasLayer
const Style = preload("res://ui/hud_style.gd")
const Layout = preload("layout.gd")
var session: Node3D
var root: Control
var overlay: Control
var screen: Control
var combat: Control
var hint: Label

func _ready() -> void:
	layer = 30
	root = Control.new()
	root.theme = Style.theme()
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	Layout.full(root)
	overlay = Control.new()
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(overlay)
	Layout.full(overlay)
	overlay.hide()

func _process(_delta: float) -> void:
	if not is_instance_valid(session.town): return
	if is_instance_valid(combat): combat.refresh()
	if is_instance_valid(screen) and screen.has_method("refresh"): screen.refresh()

func clear_screen() -> void:
	if is_instance_valid(screen):
		overlay.remove_child(screen)
		screen.queue_free()
	screen = null
	overlay.show()

func show_screen(kind: String) -> void:
	clear_screen()
	screen = preload("screens.gd").new()
	screen.session = session
	screen.kind = kind
	overlay.add_child(screen)
	Layout.full(screen)

func entry() -> void:
	remove_combat()
	show_screen("entry")

func results() -> void:
	remove_combat()
	show_screen("result")

func history() -> void: show_screen("history")

func playing() -> void:
	clear_screen()
	if not is_instance_valid(combat):
		combat = preload("combat_hud.gd").new()
		combat.session = session
		overlay.add_child(combat)
		Layout.full(combat)
	combat.show()

func remove_combat() -> void:
	if is_instance_valid(combat):
		overlay.remove_child(combat)
		combat.queue_free()
	combat = null

func pause_card(automatic: bool) -> void:
	clear_screen()
	screen = preload("pause.gd").new()
	screen.session = session
	screen.automatic = automatic
	overlay.add_child(screen)
	Layout.full(screen)

func confirm_leave() -> void:
	pause_card(false)
	screen.confirmation = true
	screen.rebuild()

func town_view() -> void:
	clear_screen()
	remove_combat()
	overlay.hide()
