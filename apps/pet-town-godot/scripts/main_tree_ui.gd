extends "res://scripts/main_tree_catalog_ui.gd"
const TOWN_CATALOG_SCRIPT := preload("res://scripts/town_catalog.gd")
const TOWN_PREVIEW_SCRIPT := preload("res://scripts/town_preview.gd")

func initialize(root_control: Control) -> void:
	ui_root = root_control
	_wrap_reference_trees()
	_register_authored_trees()
	catalog_items = TOWN_CATALOG_SCRIPT.available(authored_trees)
	catalog_items.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return String(a["category"]) + String(a["name"]) < String(b["category"]) + String(b["name"]))
	build_wallet.load_wallet()
	_build_tree_customization()
	_load_tree_layout()
	_load_build_layout()

func _build_tree_customization() -> void:
	tree_panel = PanelContainer.new()
	tree_panel.name = "TreeCustomization"
	tree_panel.visible = false
	tree_panel.position = Vector2(18.0, 18.0)
	tree_panel.custom_minimum_size = Vector2(320.0, 0.0)
	tree_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	tree_panel.add_theme_stylebox_override("panel", _tree_style(Color("14231ef5"), 16, Color("f8d47c99"), 2))
	ui_root.add_child(tree_panel)

	var content := VBoxContainer.new()
	content.add_theme_constant_override("separation", 8)
	tree_panel.add_child(content)

	var title := Label.new()
	title.text = "Town customization"
	title.add_theme_font_size_override("font_size", 23)
	title.add_theme_color_override("font_color", Color("f8f5ed"))
	content.add_child(title)

	var add_button := Button.new()
	add_button.text = "Browse objects"
	add_button.tooltip_text = "Choose trees, homes, shops, lights, and more"
	add_button.pressed.connect(Callable(self, "_toggle_catalog"))
	catalog_button = add_button
	_style_tree_button(add_button, true)
	content.add_child(add_button)

	tree_status = Label.new()
	tree_status.text = ""
	tree_status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tree_status.visible = false
	tree_status.add_theme_font_size_override("font_size", 13)
	tree_status.add_theme_color_override("font_color", Color("c8d0c6"))
	content.add_child(tree_status)

	tree_selection_label = Label.new()
	tree_selection_label.text = "No object selected"
	tree_selection_label.add_theme_font_size_override("font_size", 14)
	tree_selection_label.add_theme_color_override("font_color", Color("f0e4c8"))
	content.add_child(tree_selection_label)
	tree_preview_holder = PanelContainer.new()
	tree_preview_holder.visible = false
	tree_preview_holder.add_theme_stylebox_override("panel", _tree_style(Color("26392f"), 10, Color("94ae9266"), 1))
	content.add_child(tree_preview_holder)

	var action_row := HBoxContainer.new()
	action_row.add_theme_constant_override("separation", 6)
	content.add_child(action_row)
	tree_move_button = _tree_action_button(action_row, "Move", Callable(self, "_start_moving_selected_tree"))
	tree_rotate_left_button = _tree_action_button(action_row, "Left 15°", Callable(self, "_rotate_selected_tree").bind(-TREE_ROTATION_STEP))
	tree_rotate_right_button = _tree_action_button(action_row, "Right 15°", Callable(self, "_rotate_selected_tree").bind(TREE_ROTATION_STEP))

	var scale_row := HBoxContainer.new()
	scale_row.add_theme_constant_override("separation", 8)
	content.add_child(scale_row)
	var scale_title := Label.new()
	scale_title.text = "Size"
	scale_title.custom_minimum_size.x = 36.0
	scale_row.add_child(scale_title)
	tree_scale_slider = HSlider.new()
	tree_scale_slider.min_value = MIN_TREE_SCALE
	tree_scale_slider.max_value = MAX_TREE_SCALE
	tree_scale_slider.step = 0.05
	tree_scale_slider.value = 1.0
	tree_scale_slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tree_scale_slider.value_changed.connect(Callable(self, "_set_selected_tree_scale"))
	tree_scale_slider.drag_started.connect(func() -> void: scale_drag_before = _selected_undo_state())
	tree_scale_slider.drag_ended.connect(func(_changed: bool) -> void:
		if not scale_drag_before.is_empty():
			_push_undo_state(scale_drag_before)
			scale_drag_before = {}
	)
	scale_row.add_child(tree_scale_slider)
	tree_scale_label = Label.new()
	tree_scale_label.text = "100%"
	tree_scale_label.custom_minimum_size.x = 48.0
	tree_scale_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	scale_row.add_child(tree_scale_label)

	var finish_row := HBoxContainer.new()
	finish_row.add_theme_constant_override("separation", 6)
	content.add_child(finish_row)
	tree_delete_button = _tree_action_button(finish_row, "Delete", Callable(self, "_delete_selected_tree"))
	tree_done_button = _tree_action_button(finish_row, "Close", Callable(self, "_close_tree_editor"))

	var note := Label.new()
	note.text = "Move: click a new spot · Right-click cancels · ⌘Z undoes"
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note.add_theme_font_size_override("font_size", 12)
	note.add_theme_color_override("font_color", Color("9da79b"))
	content.add_child(note)
	_refresh_tree_controls()
	_build_catalog_ui()

func _show_selected_preview(tree: UserTree) -> void:
	for child in tree_preview_holder.get_children():
		tree_preview_holder.remove_child(child)
		child.queue_free()
	tree_preview_holder.visible = is_instance_valid(tree)
	if not is_instance_valid(tree):
		return
	var model := tree.get_node_or_null("AuthoredModel") as Node3D
	if model == null:
		model = tree
	TOWN_PREVIEW_SCRIPT.discard_snapshot("selected-object")
	var preview := TOWN_PREVIEW_SCRIPT.create_model(model, "selected-object", Vector2(280, 142))
	tree_preview_holder.add_child(preview)

func _update_tree_customization() -> void:
	if not is_instance_valid(tree_panel):
		return
	var controls_available := not bool(host.call("_help_is_open")) and not bool(host.call("_details_are_open")) and not bool(host.call("_settings_are_open"))
	tree_panel.visible = tree_editor_open and controls_available
	if placement_active and is_instance_valid(placement_tree):
		placement_tree.visible = controls_available
		if controls_available:
			call("_update_tree_placement_preview", get_viewport().get_mouse_position())

func _tree_action_button(parent: Container, label: String, callback: Callable) -> Button:
	var button := Button.new()
	button.text = label
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.custom_minimum_size.y = 42.0
	_style_tree_button(button, false)
	button.pressed.connect(callback)
	parent.add_child(button)
	return button

func _style_tree_button(button: Button, primary: bool) -> void:
	var base := Color("bd842e") if primary else Color("335c46")
	button.add_theme_stylebox_override("normal", _tree_style(base, 9, Color("e4c57a"), 1))
	button.add_theme_stylebox_override("hover", _tree_style(base.lightened(0.17), 9, Color("ffe5a2"), 2))
	button.add_theme_stylebox_override("pressed", _tree_style(base.darkened(0.2), 9, Color("ffe5a2"), 2))
	button.add_theme_stylebox_override("disabled", _tree_style(Color("334039"), 9, Color("6a746c"), 1))
	button.add_theme_color_override("font_color", Color("fff9e8"))
	button.add_theme_color_override("font_hover_color", Color.WHITE)
	button.add_theme_color_override("font_pressed_color", Color.WHITE)
	button.add_theme_color_override("font_disabled_color", Color("a6b0a6"))
	button.add_theme_font_size_override("font_size", 15)

func _tree_style(background: Color, radius: float, border: Color, border_width: int) -> StyleBoxFlat:
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

func _refresh_tree_controls() -> void:
	var has_selection := is_instance_valid(selected_user_tree) and not placement_active
	for button in [tree_move_button, tree_rotate_left_button, tree_rotate_right_button, tree_delete_button]:
		if is_instance_valid(button):
			button.disabled = not has_selection
	if is_instance_valid(tree_done_button):
		tree_done_button.disabled = not tree_editor_open
	if is_instance_valid(tree_scale_slider):
		tree_scale_slider.editable = has_selection
	if is_instance_valid(tree_selection_label):
		tree_selection_label.modulate = Color("f8d47c") if has_selection else Color("a6b0a6")
