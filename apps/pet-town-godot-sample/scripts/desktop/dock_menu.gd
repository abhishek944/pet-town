extends Node
# Godot owns the Dock while the native town runs; the desktop owns it otherwise.
var transport: Node
var menu := RID()
const ITEMS := [
	["Settings", "preferences"],
	["Open Pet Town", "open-3d-town"],
	["Close Pet Town", "close-3d-town"],
	["Show Pet Street", "show-town"],
	["Hide Pet Street", "hide-town"],
]

func _ready() -> void:
	if not NativeMenu.has_system_menu(NativeMenu.DOCK_MENU_ID): return
	menu = NativeMenu.get_system_menu(NativeMenu.DOCK_MENU_ID)
	for item in ITEMS:
		NativeMenu.add_item(menu, item[0], _select, Callable(), item[1])

func _select(action: Variant) -> void:
	if action == "close-3d-town":
		get_tree().quit()
	else:
		transport.request({"type": "app.menu", "action": action})

func _exit_tree() -> void:
	if not menu.is_valid(): return
	for item in ITEMS:
		var index := NativeMenu.find_item_index_with_tag(menu, item[1])
		if index >= 0: NativeMenu.remove_item(menu, index)
