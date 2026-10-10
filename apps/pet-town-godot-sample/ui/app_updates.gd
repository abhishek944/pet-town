extends VBoxContainer

signal action_requested(action: String)
const Palette = preload("res://ui/settings_style.gd")
const Style = preload("res://ui/hud_style.gd")
var heading: Label
var copy: Label
var progress: ProgressBar
var check: Button
var download: Button
var install: Button
var news: Button
var state: Dictionary = {}
var confirmation: ConfirmationDialog
var confirmation_scrim: ColorRect
var confirmation_layer: CanvasLayer
var confirmation_copy: VBoxContainer
var confirmation_actions: HFlowContainer
var native_buttons: HBoxContainer

func _ready() -> void:
	preload("res://ui/settings_content.gd").intro(self, "MADE FOR YOUR TIME TOGETHER", "About Pet Town", "Pet Street and Pet Town, updated together.")
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", Palette.box(Palette.CREAM, Palette.BORDER, 10))
	add_child(card)
	var column := VBoxContainer.new()
	card.add_child(column)
	column.add_child(Style.title("App updates", 17))
	heading = Style.label("Checking for updates…", 13)
	heading.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(heading)
	copy = Style.text("", 12)
	copy.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(copy)
	progress = ProgressBar.new()
	progress.custom_minimum_size.y = 16
	column.add_child(progress)
	var actions := HFlowContainer.new()
	column.add_child(actions)
	check = Palette.action("Check for updates")
	check.pressed.connect(func() -> void: action_requested.emit("update_check"))
	actions.add_child(check)
	download = Palette.action("Download update")
	download.pressed.connect(func() -> void: action_requested.emit("update_download"))
	actions.add_child(download)
	install = Palette.action("Install & Restart", true)
	install.add_theme_color_override("font_color", Color("fff7e4"))
	install.pressed.connect(confirm_install)
	actions.add_child(install)
	news = Palette.action("What’s new ↗")
	news.pressed.connect(func() -> void:
		var version: String = str(state.availableVersion) if state.get("availableVersion") else ""
		OS.shell_open("https://github.com/abhishek944/pet-town/releases/" + ("tag/v" + version.uri_encode() if not version.is_empty() else "latest")))
	actions.add_child(news)
	visibility_changed.connect(_page_visibility_changed)
	set_state({})

func set_state(data: Dictionary) -> void:
	state = data
	var phase: String = str(data.get("phase", "unavailable"))
	if phase != "ready": _dismiss_confirmation()
	var current: String = str(data.get("currentVersion", ""))
	var available: String = str(data.availableVersion) if data.get("availableVersion") else "update"
	heading.text = {"idle":"Check for updates", "checking":"Checking for updates…", "current":"Pet Town is up to date", "available":"Pet Town %s is available" % available, "downloading":"Downloading Pet Town %s…" % available, "ready":"Pet Town %s is ready to install" % available, "preparing":"Preparing to install…", "installing":"Installing update…", "error":"Couldn’t check for updates"}.get(phase, "App updates require Pet Town desktop")
	copy.text = {"idle":"Current version %s." % current, "checking":"Checking for a newer Pet Town release.", "current":"You have version %s." % current, "available":"You have version %s. Restart only when you choose." % current, "downloading":"Your town remains available while the update downloads.", "ready":"Downloaded and verified. Install & Restart only when you choose.", "preparing":"Saving the town and checking that Settings is safe to close.", "installing":"Pet Town will restart when installation finishes.", "error":str(data.get("error", "Check for updates again."))}.get(phase, "Open this town in Pet Town desktop to check and install updates.")
	if data.get("error"): copy.text = str(data.error)
	check.visible = phase != "unavailable"
	check.disabled = phase in ["checking", "downloading", "preparing", "installing"]
	download.visible = phase == "available"
	install.visible = phase == "ready"
	news.visible = (data.get("availableVersion") != null and not str(data.availableVersion).is_empty()) or phase == "current"
	progress.visible = phase == "downloading"
	progress.max_value = maxf(1, float(data.totalBytes) if data.get("totalBytes") != null else 1.0)
	progress.value = float(data.get("downloadedBytes", 0))

func confirm_install() -> void:
	if state.get("phase", "") != "ready": return
	if is_instance_valid(confirmation):
		confirmation.grab_focus()
		return
	confirmation = ConfirmationDialog.new()
	confirmation.theme = Style.theme()
	var paper := Style.panel("fff8e9", 24, "d9c39c", false)
	paper.set_content_margin_all(22)
	confirmation.theme.set_stylebox("panel", "AcceptDialog", paper)
	# Keep native modal/confirm/cancel handling, but draw the approved title inside.
	confirmation.borderless = true
	confirmation.transparent_bg = true
	confirmation.transparent = true
	confirmation.theme.set_constant("buttons_min_height", "AcceptDialog", 44)
	confirmation.theme.set_constant("buttons_min_width", "AcceptDialog", 0)
	confirmation.theme.set_constant("buttons_separation", "AcceptDialog", 23)
	confirmation.dialog_autowrap = true
	confirmation.title = "Install and restart Pet Town?"
	confirmation.dialog_text = "Installing will close all Pet Town windows and end active Mayor voice or terminal sessions. Save your work in every open window before continuing."
	confirmation.ok_button_text = "Install & Restart"
	confirmation.cancel_button_text = "Keep playing"
	confirmation.get_label().add_theme_font_size_override("font_size", 14)
	confirmation.get_label().add_theme_color_override("font_color", Color("716449"))
	confirmation.get_label().add_theme_constant_override("line_spacing", 6)
	var body := VBoxContainer.new()
	body.add_theme_constant_override("separation", 12)
	confirmation.add_child(body)
	var warning_scroll := ScrollContainer.new()
	warning_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	warning_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	warning_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(warning_scroll)
	confirmation_copy = VBoxContainer.new()
	confirmation_copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	confirmation_copy.add_theme_constant_override("separation", 14)
	warning_scroll.add_child(confirmation_copy)
	var title := Style.title(confirmation.title, 23)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	confirmation_copy.add_child(title)
	confirmation.get_label().reparent(confirmation_copy)
	confirmation_copy.minimum_size_changed.connect(func() -> void: call_deferred("_fit_confirmation"))
	body.minimum_size_changed.connect(func() -> void: call_deferred("_fit_confirmation"))
	confirmation_actions = HFlowContainer.new()
	confirmation_actions.add_theme_constant_override("h_separation", 10)
	confirmation_actions.add_theme_constant_override("v_separation", 8)
	body.add_child(confirmation_actions)
	confirmation.confirmed.connect(_confirm_install)
	confirmation.canceled.connect(_dismiss_confirmation)
	confirmation.close_requested.connect(_dismiss_confirmation)
	confirmation.visibility_changed.connect(_confirmation_visibility_changed)
	confirmation_scrim = ColorRect.new()
	confirmation_scrim.color = Color("3c281e47")
	confirmation_scrim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	confirmation_scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	# The production HUD is CanvasLayer 10; dim its Settings, not only the world.
	confirmation_layer = CanvasLayer.new()
	confirmation_layer.layer = 11
	get_viewport().add_child(confirmation_layer)
	confirmation_layer.add_child(confirmation_scrim)
	add_child(confirmation)
	native_buttons = confirmation.get_ok_button().get_parent() as HBoxContainer
	# Keep the native buttons and signals; only their presentation can stack.
	confirmation.get_cancel_button().reparent(confirmation_actions)
	confirmation.get_ok_button().reparent(confirmation_actions)
	native_buttons.hide()
	_style_confirmation_button(confirmation.get_cancel_button(), true)
	_style_confirmation_button(confirmation.get_ok_button(), false)
	confirmation.popup_centered(Vector2i(460, 244))
	get_viewport().size_changed.connect(_fit_confirmation)
	_fit_confirmation()
	confirmation.get_cancel_button().grab_focus()

func _fit_confirmation() -> void:
	if not is_instance_valid(confirmation): return
	native_buttons.hide()
	var available := Vector2(get_viewport_rect().size) - Vector2(32, 32)
	var width := minf(460, maxf(1, available.x))
	for button in [confirmation.get_cancel_button(), confirmation.get_ok_button()]:
		button.custom_minimum_size.x = minf(203, maxf(1, width - 44))
	var height := maxf(244, confirmation_copy.get_combined_minimum_size().y + confirmation_actions.get_combined_minimum_size().y + 56)
	confirmation.size = Vector2i(roundi(width), roundi(minf(height, maxf(1, available.y))))
	confirmation.move_to_center()

func _style_confirmation_button(button: Button, safe: bool) -> void:
	var background := "e7efd8" if safe else "fff1e1"
	var border := "bdcfac" if safe else "d8b994"
	for state_name in ["normal", "hover", "pressed", "disabled"]:
		button.add_theme_stylebox_override(state_name, Style.panel(background, 10, border, false))
	button.add_theme_font_size_override("font_size", 12)
	for state in ["font_color", "font_focus_color", "font_hover_color", "font_pressed_color"]:
		button.add_theme_color_override(state, Color("405d42" if safe else "87533e"))
	button.custom_minimum_size = Vector2(0, 44)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL

func _confirm_install() -> void:
	if not is_instance_valid(confirmation): return
	var eligible: bool = state.get("phase", "") == "ready"
	_dismiss_confirmation()
	if eligible: action_requested.emit("update_install")

func _dismiss_confirmation() -> void:
	if get_viewport().size_changed.is_connected(_fit_confirmation):
		get_viewport().size_changed.disconnect(_fit_confirmation)
	if is_instance_valid(confirmation_layer): confirmation_layer.queue_free()
	confirmation_layer = null
	confirmation_scrim = null
	if not is_instance_valid(confirmation): return
	var dialog := confirmation
	confirmation = null
	dialog.queue_free()

func _confirmation_visibility_changed() -> void:
	if is_instance_valid(confirmation) and not confirmation.visible:
		call_deferred("_dismiss_confirmation")

func _page_visibility_changed() -> void:
	if not is_visible_in_tree(): _dismiss_confirmation()
