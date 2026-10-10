extends ColorRect
const Style = preload("res://ui/hud_style.gd")
const Layout = preload("layout.gd")
var session: Node3D
var kind := "entry"
var margin: MarginContainer
var portrait: VBoxContainer
var body: VBoxContainer
var primary: Button

func _ready() -> void:
	color = Color("fff8e9f5")
	mouse_filter = Control.MOUSE_FILTER_STOP
	margin = MarginContainer.new()
	add_child(margin)
	Layout.full(margin)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	margin.add_child(scroll)
	var row := HBoxContainer.new()
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 70)
	scroll.add_child(row)
	portrait = VBoxContainer.new()
	portrait.alignment = BoxContainer.ALIGNMENT_CENTER
	portrait.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(portrait)
	portrait.add_child(Style.portrait({"petId": "maple"}, Vector2(280, 280)))
	var title := Style.title("Maple’s challenge", 28)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	portrait.add_child(title)
	body = VBoxContainer.new()
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.size_flags_stretch_ratio = 1.2
	body.alignment = BoxContainer.ALIGNMENT_CENTER
	body.add_theme_constant_override("separation", 18)
	row.add_child(body)
	if kind == "entry": entry()
	elif kind == "result": result()
	else: history()
	resized.connect(layout)
	layout()
	if primary: call_deferred("focus_primary")

func focus_primary() -> void:
	if is_inside_tree() and is_instance_valid(primary) and primary.is_inside_tree(): primary.grab_focus()

func layout() -> void:
	portrait.visible = size.x >= 1050 and kind != "history"
	for side in ["left", "right"]: margin.add_theme_constant_override("margin_" + side, int(clampf(size.x * 0.078, 24, 100)))
	for side in ["top", "bottom"]: margin.add_theme_constant_override("margin_" + side, int(clampf(size.y * 0.11, 24, 80)))

func heading(badge: String, title: String, description: String) -> void:
	Layout.text(body, badge, 14).add_theme_color_override("font_color", Color("426448"))
	body.add_child(Style.title(title, 42))
	Layout.text(body, description, 17)

func actions() -> HFlowContainer:
	var row := HFlowContainer.new()
	row.add_theme_constant_override("h_separation", 12)
	row.add_theme_constant_override("v_separation", 12)
	body.add_child(row)
	return row

func stat_row(values: Array) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 20)
	body.add_child(row)
	for value in values:
		var column := VBoxContainer.new()
		column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(column)
		Layout.text(column, value[0], 12)
		column.add_child(Style.title(str(value[1]), 26))

func entry() -> void:
	heading("Solo · Five minutes", "Battle Mode", "Help Maple protect the wildlife.\nKeep moving while Maple shoots automatically.")
	var best: int = session.store.best(session.arena.VERSION)
	stat_row([["Duration", "05:00"], ["Best score", str(best) if best >= 0 else "No best yet"], ["Starter pet", "Maple"]])
	Layout.text(body, "WASD move · Shift run · Space jump\nOne life. No healing. Pause anytime with Esc.\nScore from kills, health left and wildlife protected.", 15)
	Layout.text(body, "Wildlife recovers after the match. Your town is restored.", 14)
	if not session.arena_ready: Layout.text(body, session.arena.error, 14).add_theme_color_override("font_color", Color("9b542e"))
	var row := actions()
	primary = Layout.button(row, "Start five-minute battle", "start", session.command, true)
	primary.disabled = not session.arena_ready
	Layout.button(row, "Back to town", "return", session.command)
	Layout.button(row, "History", "history", session.command)
	if not session.arena_ready: primary = row.get_child(1)

func result() -> void:
	var data: Dictionary = session.result
	var complete: bool = data.outcome == "Completed"
	heading("Five minutes complete" if complete else "One life · Match ended", "Wildlife protected!" if complete else "Match ended", "Maple’s final score")
	var score := Style.title(str(int(data.score)), 68, "355b43")
	body.add_child(score)
	stat_row([["Skeletons defeated", str(int(data.kills))], ["Maple health", "%d%%" % ceili(data.pet)], ["Wildlife protected", "%d%%" % ceili(data.wildlife)]])
	Layout.text(body, "Kills  %d\nPet health  %d\nWildlife health  %d\nCompletion  %d" % [10 * int(data.kills), floori(3 * data.pet) if complete else 0, floori(2 * data.wildlife) if complete else 0, 500 if complete else 0], 15)
	var status := "Saved on this device" if session.saved else "Unsaved · Your score is kept here. Retry saving before leaving."
	if session.saved and complete and data.score == session.store.best(session.arena.VERSION): status += " · Personal best"
	Layout.text(body, status, 14).add_theme_color_override("font_color", Color("426448" if session.saved else "9b542e"))
	var row := actions()
	if not session.saved: primary = Layout.button(row, "Retry save", "save", session.command, true)
	var retry := Layout.button(row, "Play again", "retry", session.command, session.saved)
	if not primary: primary = retry
	Layout.button(row, "Return to town", "return", session.command)
	Layout.button(row, "History", "history", session.command)

func history() -> void:
	heading("Saved on this device · Latest 20", "Battle history", "Personal bests compare completed runs with the same arena and rules.")
	var best: int = session.store.best(session.arena.VERSION)
	Layout.text(body, "Best score: " + (str(best) if best >= 0 else "No best yet"), 22)
	if not session.store.notice.is_empty(): Layout.text(body, session.store.notice, 14)
	if session.store.history.is_empty(): Layout.text(body, "No matches saved yet. Your first result will appear here.")
	for data in session.store.history:
		var points := "No score" if data.outcome == "Abandoned" else "%d points" % int(data.score)
		Layout.text(body, "%s · %s\n%s · %d kills · Pet %d%% · Wildlife %d%%\n%s / %s" % [data.timestamp, data.outcome, points, data.kills, data.pet, data.wildlife, data.arena, data.rules], 15)
	primary = Layout.button(actions(), "Back", "back", session.command, true)
