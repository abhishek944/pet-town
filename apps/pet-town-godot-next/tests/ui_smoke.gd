extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var test_dir := OS.get_cache_dir().path_join("pet-town-ui-smoke-%d" % OS.get_process_id())
	DirAccess.make_dir_recursive_absolute(test_dir)
	OS.set_environment("PET_TOWN_TEST_DATA_DIR", test_dir)
	var catalog := WorkshopCatalog.new()
	var errors: Array[String] = []
	if not catalog.load_all():
		errors.append("catalog did not load")
	var wallet := BuildWallet.new()
	wallet.load_wallet()
	var editor := WorkshopEditor.new()
	root.add_child(editor)
	var ui := WorkshopUI.new()
	root.add_child(ui)
	var palette := TownCommandPalette.new()
	root.add_child(palette)
	var received := []
	palette.command_requested.connect(func(command: String) -> void: received.append(command))
	palette.call("_submit", "//build")
	if received != ["build"]:
		errors.append("repeated slash command did not resolve")
	ui.configure(catalog, wallet, editor)
	await process_frame
	if ui != null:
		ui.set_mode("chill")
		if ui.library != null or ui.inspector.visible or ui.status_panel.visible:
			errors.append("Idle Chill view has an obstructing panel")
		if ui.companion_scenes.size() != 3:
			errors.append("3D companion previews are missing")
		ui.open_settings(3)
		if ui.settings_content.get_child_count() <= 2:
			errors.append("3D object gallery is empty")
		if not (ui.settings_tabs is VBoxContainer) or ui.settings_tabs.get_child_count() != 4:
			errors.append("Town Studio is missing its left navigation")
		ui.open_settings(0)
		await process_frame
		if ui.settings_panel.size.y > 750 or ui.settings_panel.position.y < 0:
			errors.append("Town Studio does not fit in the window")
		var commands := ""
		for node in ui.settings_content.find_children("*", "Label", true, false):
			commands += (node as Label).text + "\n"
		if not commands.contains("/chill") or not commands.contains("/build"):
			errors.append("mode slash commands are missing")
		for node in ui.settings_content.find_children("*", "Button", true, false):
			if (node as Button).text.contains("Chill") or (node as Button).text.contains("Build"):
				errors.append("Town settings has a mode toggle button")
		ui.set_mode("build")
		ui.open_settings(3)
		var buy_buttons := ui.settings_content.find_children("*", "Button", true, false)
		if buy_buttons.is_empty():
			errors.append("Build object purchases are missing")
		editor.catalog = catalog
		var selected := editor.create_object(String(catalog.items[0]["id"]), "selected")
		editor.selected = selected
		editor.state_changed.emit()
		if not ui.inspector.visible or ui.inspector_size_slider.step != 0.05:
			errors.append("object inspector is missing selection or size control")
		if ui.inspector.size.x > 360 or ui.inspector.size.y > 500:
			errors.append("Selected object panel is too large")
		ui.call("_close_inspector")
		if ui.inspector.visible:
			errors.append("inspector Close did not clear selection")
		ui.set_agents([{"id": "agent-test", "label": "Test companion", "status": "Exploring"}])
		ui.open_settings(1)
		if ui.settings_content.get_child_count() <= 2:
			errors.append("companion gallery is empty")
		ui.show_agent_details({"id": "agent-test", "label": "Test companion"})
		if not ui.agent_panel.visible:
			errors.append("agent details did not open")
		ui.open_settings(2)
		ui.close_settings()
		if ui.settings_overlay.visible:
			errors.append("settings did not close")
	print("UI_SMOKE errors=", errors)
	ui.free()
	palette.free()
	editor.free()
	quit(0 if errors.is_empty() else 1)
