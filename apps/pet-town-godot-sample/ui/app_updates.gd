extends VBoxContainer

signal action_requested(action: String)
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

func _ready() -> void:
	add_child(Style.title("About Pet Town"))
	add_child(Style.text("Your desktop pets and 3D Town, updated together.", 12))
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", Style.panel("f3eddd", 14, "dfcfac", false))
	add_child(card)
	var column := VBoxContainer.new()
	card.add_child(column)
	column.add_child(Style.title("App updates", 21))
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
	check = Style.flat_button("Check for updates")
	check.pressed.connect(func() -> void: action_requested.emit("update_check"))
	actions.add_child(check)
	download = Style.flat_button("Download update")
	download.pressed.connect(func() -> void: action_requested.emit("update_download"))
	actions.add_child(download)
	install = Style.flat_button("Install & Restart", "426448", "426448")
	install.add_theme_color_override("font_color", Color("fff7e4"))
	install.pressed.connect(confirm_install)
	actions.add_child(install)
	news = Style.flat_button("What’s new ↗")
	news.pressed.connect(func() -> void:
		var version: String = str(state.availableVersion) if state.get("availableVersion") else ""
		OS.shell_open("https://github.com/abhishek944/pet-town/releases/" + ("tag/v" + version.uri_encode() if not version.is_empty() else "latest")))
	actions.add_child(news)
	set_state({})

func set_state(data: Dictionary) -> void:
	state = data
	var phase: String = str(data.get("phase", "unavailable"))
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
	confirmation = ConfirmationDialog.new()
	confirmation.title = "Install and restart Pet Town?"
	confirmation.dialog_text = "Installing will close all Pet Town windows and end active Mayor voice or terminal sessions. Save your work in every open window before continuing."
	confirmation.ok_button_text = "Install & Restart"
	confirmation.cancel_button_text = "Keep playing"
	confirmation.confirmed.connect(func() -> void: action_requested.emit("update_install"))
	confirmation.popup_hide.connect(confirmation.queue_free)
	add_child(confirmation)
	confirmation.popup_centered(Vector2i(460, 190))
	confirmation.get_cancel_button().grab_focus()
