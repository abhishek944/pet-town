extends ColorRect
const Style = preload("res://ui/hud_style.gd")
const Layout = preload("layout.gd")
var session: Node3D
var automatic := false
var confirmation := false
var center: CenterContainer

func _ready() -> void:
	Style.scrim(self, Color("24392566"), 1.5)
	mouse_filter = Control.MOUSE_FILTER_STOP
	center = CenterContainer.new()
	add_child(center)
	Layout.full(center)
	resized.connect(rebuild)
	rebuild()

func rebuild() -> void:
	if not center: return
	Style.clear(center)
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(minf(600, maxf(280, size.x - 48)), 0)
	panel.add_theme_stylebox_override("panel", Style.panel("fff8e9", 24, "dec49a"))
	center.add_child(panel)
	var margin := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]: margin.add_theme_constant_override("margin_" + side, 26)
	panel.add_child(margin)
	var body := VBoxContainer.new()
	body.add_theme_constant_override("separation", 20)
	margin.add_child(body)
	body.add_child(Style.title("Leave this battle?" if confirmation else "Battle paused", 32))
	var text := "Leaving ends this match without saving a score. Your town and wildlife will be restored." if confirmation else "Take a breath. The timer, enemies, shots and wildlife are frozen."
	if automatic and not confirmation: text = "Paused because Pet Town lost focus. Choose Resume when you are ready."
	Layout.text(body, text, 17)
	var stats := HBoxContainer.new()
	stats.add_theme_constant_override("separation", 20)
	body.add_child(stats)
	var time_left := ceili(300 - session.elapsed)
	for value in [["Time left", "%02d:%02d" % [time_left / 60, time_left % 60]], ["Maple health", "%d%%" % session.avatar.health.value], ["Kills", str(session.kills)]]:
		var column := VBoxContainer.new()
		column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		stats.add_child(column)
		Layout.text(column, value[0], 12)
		column.add_child(Style.title(value[1], 24))
	var actions := HFlowContainer.new()
	actions.add_theme_constant_override("h_separation", 12)
	actions.add_theme_constant_override("v_separation", 12)
	body.add_child(actions)
	var primary := Layout.button(actions, "Keep playing" if confirmation else "Resume battle", "resume", session.command, true)
	Layout.button(actions, "Leave without saving" if confirmation else "Leave battle", "abandon" if confirmation else "leave", session.command)
	call_deferred("focus_primary", primary)

func focus_primary(button: Button) -> void:
	if is_inside_tree() and is_instance_valid(button) and button.is_inside_tree(): button.grab_focus()
