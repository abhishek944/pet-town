extends ColorRect
signal atmosphere_changed(field: String, value: Variant)
signal closed
signal reset_requested
signal sound_toggled(enabled: bool)
signal volume_changed(value: float)
signal usage_toggled(value: bool)
signal camera_requested(first_person: bool)
signal companion_action(id: String, action: String, payload: Dictionary)
signal wildlife_find_requested(id: String)
const Style = preload("res://ui/hud_style.gd")
const Pages = preload("res://ui/settings_pages.gd")
var card: Panel
var contents: VBoxContainer
var body_margin: MarginContainer
var title_label: Label
var subtitle_label: Label
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
var tabs_row: GridContainer
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
var usage_snapshot: Dictionary = {}
var atmosphere_snapshot := preload("res://scripts/atmosphere/state.gd").DEFAULTS.duplicate()
var atmosphere_page: Control
var atmosphere_saved := true
var coins_page: Control
var wildlife_data: Array = []
var wildlife_page: Control
var wildlife_detail: Control
func _ready() -> void:
	preload("res://ui/settings_chrome.gd").build(self)
	wildlife_detail = preload("res://ui/wildlife_detail.gd").new()
	add_child(wildlife_detail)
	wildlife_detail.find_requested.connect(func(id: String) -> void: wildlife_find_requested.emit(id))

func _panel_visibility_changed() -> void:
	if not visible and is_instance_valid(wildlife_detail): wildlife_detail.dismiss(false)
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
	preload("res://ui/settings_chrome.gd").layout(self)
func open_panel(kind: String) -> void:
	select_tab(kind if kind in ["How to play","Time & weather"] else "Companions")
	show()
func select_tab(tab_name: String) -> void:
	selected_tab = tab_name
	var chrome := preload("res://ui/settings_chrome.gd")
	chrome.apply_body_margin(self)
	chrome.layout(self)
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
	page.add_theme_constant_override("separation", 0)
	contents.add_child(page)
	page_cache[tab_name] = page
	match tab_name:
		"Wildlife":
			wildlife_page = preload("res://ui/wildlife_page.gd").new()
			wildlife_page.settings = self
			page.add_child(wildlife_page)
			wildlife_page.set_data(wildlife_data)
			wildlife_page.selected.connect(func(id: String, source: Control) -> void:
				for entry in wildlife_data:
					if entry.id == id: wildlife_detail.open_entry(entry, source))
		"Time & weather":
			atmosphere_page = preload("res://ui/atmosphere_page.gd").new()
			page.add_child(atmosphere_page)
			atmosphere_page.changed.connect(func(field: String,value: Variant): atmosphere_changed.emit(field,value))
			atmosphere_page.set_state(atmosphere_snapshot)
			atmosphere_page.set_saved(atmosphere_saved)
		"World": Pages.world(page, self)
		"Coins & usage":
			coins_page = preload("res://ui/coin_settings.gd").new()
			page.add_child(coins_page)
			coins_page.set_snapshot(usage_snapshot)
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

func set_usage_snapshot(snapshot: Dictionary) -> void:
	usage_snapshot = snapshot
	if is_instance_valid(coins_page): coins_page.set_snapshot(snapshot)

func set_wildlife_data(entries: Array) -> void:
	wildlife_data = entries
	if is_instance_valid(wildlife_page): wildlife_page.set_data(entries)
	if is_instance_valid(wildlife_detail) and wildlife_detail.visible:
		for entry in entries:
			if entry.id == wildlife_detail.selected_id: wildlife_detail.refresh(entry)

func confirm_reset() -> void:
	if not is_instance_valid(confirmation): return
	dismiss_confirmation()
	reset_requested.emit()
	closed.emit()
