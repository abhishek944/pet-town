class_name WorkshopUI
extends "res://scripts/ui_shell.gd"

func configure(source: WorkshopCatalog, credits: BuildWallet, builder: WorkshopEditor) -> void:
	catalog = source
	wallet = credits
	editor = builder
	if companion_scenes.is_empty():
		companion_names.assign(LiveCompanion.MODEL_NAMES)
		companion_scenes.assign(LiveCompanion.MODELS)
	_build()
	_refresh()
	editor.state_changed.connect(_refresh)
	get_viewport().size_changed.connect(_layout)
	_layout()

func set_mode(mode: String) -> void:
	if mode not in ["chill", "build"]:
		return
	town_mode = mode
	if mode == "build" and is_instance_valid(agent_panel):
		agent_panel.visible = false
	_refresh()
	if is_instance_valid(settings_overlay) and settings_overlay.visible:
		_show_settings_page()

func _refresh() -> void:
	if town_mode == "build":
		wallet.load_wallet()
	_refresh_inspector()
	status_label.text = editor.status
	status_panel.visible = is_instance_valid(editor.preview)
	cancel_button.visible = is_instance_valid(editor.preview)
	_layout()

func _layout() -> void:
	var view := get_viewport_rect().size
	size = view
	var inspector_width := minf(338, view.x)
	inspector.position = Vector2(view.x - inspector_width, 0)
	inspector.size = Vector2(inspector_width, view.y)
	status_panel.position = Vector2(maxf(16, view.x * 0.5 - 210), view.y - 80)
	status_panel.size = Vector2(420, 58)
	if is_instance_valid(settings_panel):
		settings_panel.size = view
		settings_panel.position = Vector2.ZERO
	if is_instance_valid(agent_panel):
		agent_panel.size = Vector2(minf(530, view.x - 32), minf(330, view.y - 32))
		agent_panel.position = Vector2(view.x - agent_panel.size.x - 24, 24)
