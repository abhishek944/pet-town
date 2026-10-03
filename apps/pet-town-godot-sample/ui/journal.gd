extends ColorRect

signal closed
signal action_requested(id: String)
const Style = preload("res://ui/hud_style.gd")
const Entries = preload("res://ui/journal_entries.gd")
var places: Array = []
var experiences: Array = []
var collection: Array = []
var reminder: Dictionary = {}
var reminder_body: VBoxContainer
var card: PanelContainer
var content: VBoxContainer
var body: VBoxContainer
var summary: Label
var progress: ProgressBar
var tabs: Array[Button] = []
var selected_page := "Experiences"

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	color = Color("263f3263")
	Style.scrim(self, color, 2.2)
	card = PanelContainer.new()
	var box := Style.panel("faf7ec", 23, "fffcf0")
	box.content_margin_left = 30
	box.content_margin_right = 30
	box.content_margin_top = 28
	box.content_margin_bottom = 22
	card.add_theme_stylebox_override("panel", box)
	add_child(card)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	card.add_child(scroll)
	content = VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 15)
	scroll.add_child(content)
	var head := HBoxContainer.new()
	content.add_child(head)
	var text := VBoxContainer.new()
	text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text.add_theme_constant_override("separation", 4)
	text.add_child(Style.text("SMALL ADVENTURES, LASTING MEMORIES", 10, "7d8859"))
	var title_label := Style.title("Your island journal", 31, "3e5d4d")
	title_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text.add_child(title_label)
	head.add_child(text)
	var close := Style.button("×", Vector2(42, 42))
	close.size_flags_vertical = SIZE_SHRINK_BEGIN
	close.size_flags_horizontal = SIZE_SHRINK_BEGIN
	close.add_theme_font_size_override("font_size", 21)
	for state in ["normal", "hover", "pressed", "disabled"]:
		var circle := Style.panel("faf7ec00", 21, "d5ddc4", false)
		circle.set_content_margin_all(0)
		close.add_theme_stylebox_override(state, circle)
	close.pressed.connect(func() -> void: closed.emit())
	head.add_child(close)
	content.add_child(Style.text("A flower to grow. A reef to find. A little farther to wander.", 11, "777b64"))
	var summary_panel := PanelContainer.new()
	summary_panel.add_theme_stylebox_override("panel", Style.panel("eef2e2", 14, "dce4d1", false))
	content.add_child(summary_panel)
	var stats := VBoxContainer.new()
	stats.add_theme_constant_override("separation", 5)
	summary_panel.add_child(stats)
	summary = Style.text("", 12, "547052")
	stats.add_child(summary)
	progress = ProgressBar.new()
	progress.show_percentage = false
	progress.custom_minimum_size.y = 5
	for role in ["background", "fill"]:
		var track_color := "dfe6d3" if role == "background" else "799c69"
		var track := Style.panel(track_color, 3, track_color, false)
		track.set_content_margin_all(0)
		progress.add_theme_stylebox_override(role, track)
	stats.add_child(progress)
	var nav := HBoxContainer.new()
	nav.add_theme_constant_override("separation", 5)
	content.add_child(nav)
	for page in ["Experiences", "Places", "Collection"]:
		var tab := Style.flat_button(page)
		tab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		tab.pressed.connect(func() -> void: select_page(page))
		tab.gui_input.connect(func(event: InputEvent) -> void: tab_key(event, tab))
		nav.add_child(tab)
		tabs.append(tab)
	reminder_body = VBoxContainer.new()
	content.add_child(reminder_body)
	body = VBoxContainer.new()
	body.add_theme_constant_override("separation", 16)
	content.add_child(body)
	content.add_child(Style.text("J or Escape closes your journal. Keep exploring; there is no hurry.", 11, "777b64"))
	resized.connect(layout)
	layout()
	hide()

func layout() -> void:
	card.position = Vector2(maxf(16, (size.x - 860) / 2), 30)
	card.size = Vector2(minf(860, size.x - 32), maxf(160, size.y - 60))
	if visible: select_page(selected_page)

func open_panel() -> void:
	select_page(selected_page)
	show()

func set_data(new_places: Array, new_experiences: Array, new_collection: Array = []) -> void:
	var changed := places != new_places or experiences != new_experiences or collection != new_collection
	places = new_places.duplicate(true)
	experiences = new_experiences.duplicate(true)
	collection = new_collection.duplicate(true)
	if visible and changed: select_page(selected_page)

func select_page(page: String) -> void:
	var focused := get_viewport().gui_get_focus_owner()
	var focus_action: String = str(focused.get_meta("journal_action", "")) if focused else ""
	selected_page = page
	Style.clear(body)
	refresh_reminder()
	var visited := 0
	for place in places:
		visited += int(place.get("visited", false))
	summary.text = "%d / %d places discovered · %d trail" % [visited, places.size(), visited]
	progress.max_value = maxi(1, places.size())
	progress.value = visited
	for tab in tabs:
		var box := Style.panel("fffef6" if tab.text == page else "f1eedf", 12, "cbd8c1" if tab.text == page else "e3e0d0", false)
		tab.add_theme_stylebox_override("normal", box)
	if page == "Experiences":
		body.add_child(Style.text("Choose a little adventure. Nearby hints help you find what to try next.", 11, "777b64"))
		Entries.experiences(body, experiences, self)
	elif page == "Places":
		body.add_child(Style.text("Visit travels to clear, dry ground with your explorer.", 11, "777b64"))
		body.add_child(Style.title("Along the island trails", 19, "4e6554"))
		Entries.places(body, places, self)
	else:
		body.add_child(Style.text("Your discoveries and little keepsakes, saved on this device.", 11, "777b64"))
		Entries.experiences(body, collection, self)
		body.add_child(Style.title("Places you have found", 19, "4e6554"))
		Entries.places(body, places.filter(func(place: Dictionary) -> bool: return place.get("visited", false)), self)
	if not focus_action.is_empty(): restore_action_focus(body, focus_action)

func set_reminder(entry: Dictionary) -> void:
	if reminder == entry: return
	reminder = entry.duplicate(true)
	refresh_reminder()

func refresh_reminder() -> void:
	var focused := get_viewport().gui_get_focus_owner()
	var action: String = str(focused.get_meta("journal_action", "")) if focused and reminder_body.is_ancestor_of(focused) else ""
	Style.clear(reminder_body)
	if selected_page != "Experiences" and not reminder.is_empty(): Entries.experiences(reminder_body, [reminder], self)
	if not action.is_empty(): restore_action_focus(reminder_body, action)

func tab_key(event: InputEvent, tab: Button) -> void:
	if not event is InputEventKey or not event.pressed: return
	var index := tabs.find(tab)
	match event.keycode:
		KEY_LEFT, KEY_UP: index = posmod(index - 1, tabs.size())
		KEY_RIGHT, KEY_DOWN: index = posmod(index + 1, tabs.size())
		KEY_HOME: index = 0
		KEY_END: index = tabs.size() - 1
		_: return
	select_page(tabs[index].text)
	tabs[index].grab_focus()
	accept_event()

func restore_action_focus(node: Node, action: String) -> void:
	for child in node.get_children():
		if child is Button and child.get_meta("journal_action", "") == action and not child.disabled: child.call_deferred("grab_focus")
		restore_action_focus(child, action)
