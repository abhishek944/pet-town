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
var frame_style: StyleBoxFlat
var footer_style: StyleBoxFlat
var tabs: Array[Button] = []
var selected_page := "Experiences"

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	color = Color("263f3263")
	Style.scrim(self, color, 2.2)
	card = PanelContainer.new()
	frame_style = Style.panel("faf7ec", 24, "fffcf0")
	card.add_theme_stylebox_override("panel", frame_style)
	add_child(card)
	content = VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 8)
	card.add_child(content)
	var head := HBoxContainer.new()
	content.add_child(head)
	var text := VBoxContainer.new()
	text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text.add_theme_constant_override("separation", 4)
	text.add_child(Style.text("SMALL ADVENTURES, LASTING MEMORIES", 10, "7d8859"))
	var title_label := Style.title("Your island journal", 29, "3e5d4d")
	title_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text.add_child(title_label)
	head.add_child(text)
	var close := Style.button("×", Vector2(44, 44))
	close.size_flags_vertical = SIZE_SHRINK_BEGIN
	close.size_flags_horizontal = SIZE_SHRINK_BEGIN
	close.accessibility_name = "Close Journal"
	close.add_theme_font_size_override("font_size", 21)
	for state in ["normal", "hover", "pressed", "disabled"]:
		var circle := Style.panel("faf7ec00", 22, "d5ddc4", false)
		circle.set_content_margin_all(0)
		close.add_theme_stylebox_override(state, circle)
	close.pressed.connect(func() -> void: closed.emit())
	head.add_child(close)
	var subtitle := Style.text("A flower to grow. A reef to find. A little farther to wander.", 11, "777b64")
	subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(subtitle)
	var summary_panel := PanelContainer.new()
	var summary_style := Style.panel("eef2e2", 12, "dce4d1", false)
	summary_style.content_margin_left = 14
	summary_style.content_margin_right = 14
	summary_style.content_margin_top = 8
	summary_style.content_margin_bottom = 8
	summary_panel.add_theme_stylebox_override("panel", summary_style)
	content.add_child(summary_panel)
	summary = Style.text("", 11, "547052")
	summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	summary_panel.add_child(summary)
	var nav := HBoxContainer.new()
	nav.add_theme_constant_override("separation", 6)
	content.add_child(nav)
	for page in ["Experiences", "Places", "Collection"]:
		var tab := Style.flat_button(page, "f1eedf", "e3e0d0")
		tab.custom_minimum_size.y = 44
		tab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		tab.set_meta("journal_page", page)
		tab.accessibility_name = page
		tab.pressed.connect(func() -> void: select_page(page))
		tab.gui_input.connect(func(event: InputEvent) -> void: tab_key(event, tab))
		nav.add_child(tab)
		tabs.append(tab)
	var body_scroll := ScrollContainer.new()
	body_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	body_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	body_scroll.follow_focus = true
	content.add_child(body_scroll)
	var scroll_content := VBoxContainer.new()
	scroll_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll_content.add_theme_constant_override("separation", 14)
	body_scroll.add_child(scroll_content)
	reminder_body = VBoxContainer.new()
	scroll_content.add_child(reminder_body)
	body = VBoxContainer.new()
	body.add_theme_constant_override("separation", 14)
	scroll_content.add_child(body)
	var footer := PanelContainer.new()
	footer_style = Style.panel("f1eedf", 0, "e3e0d0", false)
	footer_style.content_margin_left = 0
	footer_style.content_margin_right = 0
	footer_style.content_margin_top = 12
	footer_style.content_margin_bottom = 12
	footer_style.corner_radius_bottom_left = 24
	footer_style.corner_radius_bottom_right = 24
	footer.add_theme_stylebox_override("panel", footer_style)
	content.add_child(footer)
	var footer_text := Style.text("J or Escape closes your journal. Keep exploring; there is no hurry.", 11, "777b64")
	footer_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	footer.add_child(footer_text)
	resized.connect(layout)
	card.minimum_size_changed.connect(func() -> void: call_deferred("fit_card"))
	layout()
	hide()

func layout() -> void:
	var horizontal_margin := 26.0 if size.x >= 800 else 16.0 if size.x >= 420 else 10.0
	var vertical_margin := 22.0 if size.y >= 520 else 10.0
	frame_style.content_margin_left = horizontal_margin
	frame_style.content_margin_right = horizontal_margin
	frame_style.content_margin_top = vertical_margin
	frame_style.content_margin_bottom = 0
	# The footer background reaches the card edges; copy aligns with the body.
	footer_style.expand_margin_left = horizontal_margin
	footer_style.expand_margin_right = horizontal_margin
	fit_card()
	if visible: select_page(selected_page)

func fit_card() -> void:
	card.size = Vector2(minf(900, maxf(160, size.x - 32)), minf(560, maxf(160, size.y - 32)))
	card.position = (size - card.size) * 0.5

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
	summary.text = "%d / %d places discovered · %d trail stamps" % [visited, places.size(), visited]
	for tab in tabs:
		var tab_page: String = str(tab.get_meta("journal_page", tab.text))
		var selected := tab_page == page
		tab.accessibility_name = tab_page + (" (selected)" if selected else "")
		var tab_style := Style.panel("fffef6" if selected else "f1eedf", 12, "cbd8c1" if selected else "e3e0d0", false)
		tab_style.border_width_bottom = 3 if selected else 1
		for state in ["normal", "hover", "pressed"]:
			tab.add_theme_stylebox_override(state, tab_style)
	if page == "Experiences":
		Entries.experiences(body, experiences, self, card.size.x - 52)
	elif page == "Places":
		body.add_child(Style.text("Visit travels to clear, dry ground with your explorer.", 11, "777b64"))
		body.add_child(Style.title("Along the island trails", 19, "4e6554"))
		Entries.places(body, places, self)
	else:
		body.add_child(Style.text("Your discoveries and little keepsakes, saved on this device.", 11, "777b64"))
		Entries.experiences(body, collection, self, card.size.x - 52)
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
	if selected_page != "Experiences" and not reminder.is_empty(): Entries.experiences(reminder_body, [reminder], self, card.size.x - 52)
	if not action.is_empty(): restore_action_focus(reminder_body, action)

func tab_key(event: InputEvent, tab: Button) -> void:
	Entries.tab_key(event, tab, self)

func restore_action_focus(node: Node, action: String) -> void:
	for child in node.get_children():
		if child is Button and child.get_meta("journal_action", "") == action and not child.disabled: child.call_deferred("grab_focus")
		restore_action_focus(child, action)
