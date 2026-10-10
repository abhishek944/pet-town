extends ColorRect

signal closed
signal action_requested(id: String)

const Style = preload("res://ui/hud_style.gd")
const Entries = preload("res://ui/journal_entries.gd")
const Chrome = preload("res://ui/journal_chrome.gd")
const Look = preload("res://ui/journal_style.gd")

var places: Array = []
var experiences: Array = []
var collection: Array = []
var reminder: Dictionary = {}
var card: PanelContainer
var middle: BoxContainer
var nav_panel: Control
var nav_buttons: BoxContainer
var progress: Control
var progress_label: Label
var title_label: Label
var footer_label: Label
var body_scroll: ScrollContainer
var body_margin: MarginContainer
var reminder_body: VBoxContainer
var body: VBoxContainer
var frame_style: StyleBoxFlat
var header_style: StyleBoxFlat
var nav_style: StyleBoxFlat
var progress_style: StyleBoxFlat
var footer_style: StyleBoxFlat
var tabs: Array[Button] = []
var selected_page := "Experiences"
var tight := false
var compact := false

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	color = Color("17271d33")
	Style.scrim(self, color, 1.5)
	card = PanelContainer.new()
	frame_style = Look.frame()
	card.add_theme_stylebox_override("panel", frame_style)
	add_child(card)
	var content := VBoxContainer.new()
	content.add_theme_constant_override("separation", 0)
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	card.add_child(content)
	content.add_child(Chrome.header(self))
	middle = BoxContainer.new()
	middle.name = "layout"
	middle.add_theme_constant_override("separation", 0)
	middle.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	middle.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content.add_child(middle)
	nav_panel = Chrome.sidebar(self)
	middle.add_child(nav_panel)
	body_scroll = ScrollContainer.new()
	body_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	body_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	body_scroll.follow_focus = true
	middle.add_child(body_scroll)
	body_margin = MarginContainer.new()
	body_margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body_margin.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body_scroll.add_child(body_margin)
	var stack := VBoxContainer.new()
	stack.add_theme_constant_override("separation", 0)
	stack.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body_margin.add_child(stack)
	reminder_body = VBoxContainer.new()
	reminder_body.add_theme_constant_override("separation", 0)
	reminder_body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	stack.add_child(reminder_body)
	body = VBoxContainer.new()
	body.add_theme_constant_override("separation", 0)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	stack.add_child(body)
	content.add_child(Chrome.footer(self))
	resized.connect(layout)
	card.minimum_size_changed.connect(func() -> void: fit_card.call_deferred())
	layout()
	hide()

func layout() -> void:
	tight = size.x <= 1000.0 or size.y <= 650.0
	compact = size.x <= 700.0
	var side := 20.0 if compact else 30.0
	var head := 20.0 if tight else 30.0
	var head_y := 15.0 if tight else 25.0
	Look.pad(header_style, head, head_y, head, head_y + 1.0)
	title_label.add_theme_font_size_override("font_size", 24 if compact else 28)
	Look.pad(footer_style, 20.0 if compact else 24.0, 10.0 if compact else 16.0, 20.0 if compact else 24.0, 10.0 if compact else 16.0)
	footer_label.add_theme_font_size_override("font_size", 11 if compact else 12)
	Look.margins(body_margin, side, 16.0 if compact else 24.0, side, 16.0 if compact else 24.0)
	middle.vertical = compact
	nav_buttons.vertical = not compact
	nav_style.border_width_right = 0 if compact else 1
	nav_style.border_width_bottom = 1 if compact else 0
	Look.pad(nav_style, 8.0 if compact else 16.0, 6.0 if compact else 22.0, 8.0 if compact else 16.0, 6.0 if compact else 22.0)
	nav_panel.custom_minimum_size.x = 0 if compact else 200
	nav_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL if compact else Control.SIZE_FILL
	progress.visible = not compact
	for tab in tabs:
		tab.alignment = HORIZONTAL_ALIGNMENT_CENTER if compact else HORIZONTAL_ALIGNMENT_LEFT
		tab.size_flags_horizontal = Control.SIZE_EXPAND_FILL if compact else Control.SIZE_FILL
	fit_card()
	if visible: select_page(selected_page)

func fit_card() -> void:
	var margin := 14.0 if tight else 32.0
	var bounded := Vector2(minf(size.x - margin * 2.0, 1216.0), minf(size.y - margin * 2.0, 656.0)).maxf(160.0)
	card.size = bounded
	card.position = ((size - bounded) * 0.5).floor()

func open_panel() -> void:
	select_page(selected_page)
	show()
	body_scroll.set_deferred("scroll_vertical", 0)

func set_data(new_places: Array, new_experiences: Array, new_collection: Array = []) -> void:
	var changed := places != new_places or experiences != new_experiences or collection != new_collection
	places = new_places.duplicate(true)
	experiences = new_experiences.duplicate(true)
	collection = new_collection.duplicate(true)
	if visible and changed: select_page(selected_page)

func columns() -> int:
	return 1 if compact else 2 if tight else 3

func places_hint() -> String:
	var blocked := 0
	var headings := 0
	for place in places:
		var action := str(place.get("action", ""))
		if action.begins_with("visit:") and not place.get("enabled", true): blocked += 1
		elif action.begins_with("ocean-heading:") and place.get("enabled", true): headings += 1
	if blocked > 0 and headings > 0:
		return "Leave your companion to Visit land destinations. You can still follow ocean headings."
	return "Visit travels to clear, dry ground with your explorer."

func select_page(page: String) -> void:
	var focused := get_viewport().gui_get_focus_owner()
	var focus_action: String = str(focused.get_meta("journal_action", "")) if focused else ""
	var switched := selected_page != page
	selected_page = page
	Style.clear(body)
	refresh_reminder()
	var visited := 0
	for place in places:
		visited += int(place.get("visited", false))
	progress_label.text = "%d / %d places discovered\n%d trail stamps" % [visited, places.size(), visited]
	for tab in tabs:
		var tab_page: String = str(tab.get_meta("journal_page", tab.text))
		var selected := tab_page == page
		tab.accessibility_name = tab_page + (" (selected)" if selected else "")
		Look.ink(tab, Look.GREEN if selected else Look.INK)
		for state in ["normal", "hover", "pressed"]:
			tab.add_theme_stylebox_override(state, Look.nav_box(selected))
	if page == "Experiences":
		Entries.summary(body, "A flower to grow. A reef to find. A little farther to wander.")
		Entries.cards(body, experiences, self, columns())
	elif page == "Places":
		Entries.summary(body, places_hint())
		Entries.places(body, places, self)
	else:
		Entries.summary(body, "Your discoveries and little keepsakes, saved on this device.")
		Entries.cards(body, collection, self, columns())
		Entries.heading(body, "Places you have found")
		Entries.places(body, places.filter(func(place: Dictionary) -> bool: return place.get("visited", false)), self)
	if switched: body_scroll.set_deferred("scroll_vertical", 0)
	if not focus_action.is_empty(): restore_action_focus(body, focus_action)
	fit_card.call_deferred()

func set_reminder(entry: Dictionary) -> void:
	if reminder == entry: return
	reminder = entry.duplicate(true)
	refresh_reminder()

func refresh_reminder() -> void:
	var focused := get_viewport().gui_get_focus_owner()
	var action: String = str(focused.get_meta("journal_action", "")) if focused and reminder_body.is_ancestor_of(focused) else ""
	Style.clear(reminder_body)
	if selected_page != "Experiences" and not reminder.is_empty(): Entries.reminder(reminder_body, reminder, self)
	if not action.is_empty(): restore_action_focus(reminder_body, action)

func tab_key(event: InputEvent, tab: Button) -> void:
	Entries.tab_key(event, tab, self)

func restore_action_focus(node: Node, action: String) -> void:
	for child in node.get_children():
		if child is Button and child.get_meta("journal_action", "") == action and not child.disabled: child.call_deferred("grab_focus")
		restore_action_focus(child, action)
