extends ColorRect
signal closed
signal reset_requested
signal sound_toggled(enabled: bool)
signal volume_changed(value: float)
signal usage_toggled(value: bool)
signal camera_requested(first_person: bool)
signal companion_action(id: String, action: String, payload: Dictionary)
const Style = preload("res://ui/hud_style.gd")
const Pages = preload("res://ui/settings_pages.gd")
var card: Panel
var contents: VBoxContainer
var tabs: Array[Button] = []
var sound_enabled := true
var usage_visible := false
var volume := 0.8
var selected_tab := "Companions"
var confirmation: ColorRect
var companions: Array = []
var selected_id := ""
var pet_catalog: Array = []
var gallery: Control
var close_button: Button
var scroll_body: ScrollContainer
var tabs_scroll: ScrollContainer
var tabs_row: VBoxContainer
var category_panel: Panel
var header_divider: ColorRect
var footer_bar: Panel
var footer_hint: Label
var reset_button: Button
var update_state: Dictionary = {}
var updates: VBoxContainer
var page_cache: Dictionary = {}
var page_scroll: Dictionary = {}
var visible_page: Control
var visible_page_key := ""
var gallery_open := false
func _ready() -> void:
	preload("res://ui/settings_chrome.gd").build(self)

func _panel_visibility_changed() -> void:
	if visible or not is_instance_valid(gallery): return
	if gallery.get_parent() == contents: contents.remove_child(gallery)
	gallery.queue_free()
	gallery = null
	gallery_open = false
	page_scroll.erase("Companions gallery")
	if visible_page_key == "Companions gallery":
		visible_page = null
		visible_page_key = ""

func layout() -> void:
	card.size = Vector2(minf(680, maxf(0, size.x - 24)), minf(470, maxf(0, size.y - 24)))
	card.position = (size - card.size) / 2
	var category_width := minf(172, card.size.x * 0.34)
	var footer_y := card.size.y - 54
	Style.position(header_divider, Rect2(2, 96, card.size.x - 4, 1))
	Style.position(category_panel, Rect2(2, 97, category_width, maxf(0, footer_y - 97)))
	Style.position(tabs_scroll, Rect2(10, 14, maxf(0, category_width - 20), maxf(0, footer_y - 125)))
	Style.position(scroll_body, Rect2(category_width + 2, 97, maxf(0, card.size.x - category_width - 4), maxf(0, footer_y - 97)))
	close_button.position = Vector2(card.size.x - 66, 24)
	footer_bar.position = Vector2(2, footer_y)
	footer_bar.size = Vector2(card.size.x - 4, 52)
	reset_button.position = Vector2(maxf(8, card.size.x - 124), 4)
	footer_hint.text = "H / Esc  Back to town" if card.size.x >= 320 else ("H / Esc  Back" if card.size.x >= 250 else "H / Esc")
	footer_hint.add_theme_font_size_override("font_size", 11 if card.size.x >= 320 else 10)
	var tab_font := 12 if category_width >= 145 else 10
	for tab in tabs: tab.add_theme_font_size_override("font_size", tab_font)
func open_panel(kind: String) -> void:
	select_tab("How to play" if kind == "How to play" else "Companions")
	show()
func select_tab(tab_name: String) -> void:
	selected_tab = tab_name
	for tab in tabs:
		var selected := tab.text == tab_name
		for state in ["normal", "hover", "pressed"]:
			var box := StyleBoxFlat.new()
			box.bg_color = Color("e4ebd4") if selected else Color.TRANSPARENT
			if state == "hover" and not selected: box.bg_color = Color("eee4d2")
			box.set_corner_radius_all(10)
			box.content_margin_left = 12
			box.content_margin_right = 8
			box.content_margin_top = 8
			box.content_margin_bottom = 8
			tab.add_theme_stylebox_override(state, box)
		tab.add_theme_color_override("font_color", Color("426448" if selected else "4c402f"))
	var page: Control
	var page_key := tab_name
	if tab_name == "Companions" and gallery_open and is_instance_valid(gallery):
		gallery.validate_target(selected_id, companions)
		page = gallery
		page_key = "Companions gallery"
	else:
		# Rebuild owner-fed controls after closed-HUD shortcuts changed sound/volume.
		if tab_name in ["Companions", "World"]: _drop_page(tab_name)
		page = _get_page(tab_name)
	_show_page(page, page_key)

func _get_page(tab_name: String) -> Control:
	if page_cache.has(tab_name) and is_instance_valid(page_cache[tab_name]): return page_cache[tab_name]
	var page := VBoxContainer.new()
	page.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	page.add_theme_constant_override("separation", 17)
	contents.add_child(page)
	page_cache[tab_name] = page
	match tab_name:
		"World": Pages.world(page, self)
		"How to play": Pages.help(page)
		"About":
			updates = preload("res://ui/app_updates.gd").new()
			page.add_child(updates)
			updates.action_requested.connect(func(action: String) -> void: companion_action.emit("", action, {}))
			updates.set_state(update_state)
		_: preload("res://ui/companion_pages.gd").profile(page, self)
	return page

func _drop_page(page_key: String) -> void:
	if not page_cache.has(page_key): return
	var page: Control = page_cache[page_key]
	if is_instance_valid(page):
		if page == visible_page:
			page_scroll[visible_page_key] = scroll_body.scroll_vertical
			visible_page = null
			visible_page_key = ""
		contents.remove_child(page)
		page.queue_free()
	page_cache.erase(page_key)

func _show_page(page: Control, page_key: String) -> void:
	if is_instance_valid(visible_page) and visible_page_key != page_key:
		page_scroll[visible_page_key] = scroll_body.scroll_vertical
	for child in contents.get_children(): child.visible = child == page
	visible_page = page
	visible_page_key = page_key
	scroll_body.set_deferred("scroll_vertical", int(page_scroll.get(page_key, 0)))
func show_reset() -> void:
	preload("res://ui/settings_confirmation.gd").show_reset(self)

func dismiss_confirmation() -> void:
	if is_instance_valid(confirmation):
		confirmation.queue_free()
	confirmation = null
func show_pet_gallery() -> void:
	if not page_cache.has("Companions"): _get_page("Companions")
	var needs_setup: bool = not is_instance_valid(gallery) or gallery.target_id != selected_id
	if not is_instance_valid(gallery):
		gallery = preload("res://ui/pet_gallery.gd").new()
		gallery.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		contents.add_child(gallery)
		gallery.back_requested.connect(func() -> void:
			gallery_open = false
			select_tab("Companions"))
		gallery.action_requested.connect(func(id: String, action: String, payload: Dictionary) -> void: companion_action.emit(id, action, payload))
	if needs_setup:
		var pet_id := ""
		for entry in companions:
			if str(entry.id) == selected_id: pet_id = str(entry.get("petId", ""))
		gallery.setup(pet_catalog, selected_id, pet_id)
		page_scroll.erase("Companions gallery")
	gallery.validate_target(selected_id, companions)
	gallery_open = true
	_show_page(gallery, "Companions gallery")

func refresh_companions() -> void:
	if is_instance_valid(gallery): gallery.validate_target(selected_id, companions)
	if not gallery_open and selected_tab == "Companions": select_tab("Companions")

func set_app_update(state: Dictionary) -> void:
	update_state = state
	if is_instance_valid(updates): updates.set_state(state)

func confirm_reset() -> void:
	if not is_instance_valid(confirmation): return
	dismiss_confirmation()
	reset_requested.emit()
	closed.emit()
