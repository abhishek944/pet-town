extends RefCounted
## Reversible local presentation. The desktop bridge is suspended, never stopped.
var town: Node3D
var actor: RigidBody3D
var camera := {}
var nodes: Array = []
var bodies: Array = []
var captured := false
var wildlife_enabled := true
var snapshot := {}
var disconnected := false
var transport_mode := Node.PROCESS_MODE_INHERIT
var minimum_size := Vector2i.ZERO

func capture(host: Node3D, participants: Array) -> void:
	town = host
	minimum_size = town.get_window().min_size
	var battle_min := Vector2i(Vector2(480, 520) * town.get_window().content_scale_factor)
	town.get_window().min_size = Vector2i(maxi(battle_min.x, minimum_size.x), maxi(battle_min.y, minimum_size.y))
	actor = town.actor
	town.hud.close_panel()
	camera = {"pitch": town.rig.pitch, "distance": town.rig.distance, "rotation": town.rig.rotation,
		"first": town.rig.first_person, "dock": town.rig.dock_width, "mouse": Input.mouse_mode}
	wildlife_enabled = town.wildlife.enabled
	town.hud.set_meta("battle_active", true)
	town.hud.is_menu_open = true
	town.hud.root.hide()
	for node in [town.desktop, town.builder, town.region_actions, town.ocean, town.hud]: suspend(node)
	# Keep the authenticated socket alive while buffering presentation updates.
	var transport: Node = town.desktop.transport
	transport_mode = transport.process_mode
	transport.process_mode = Node.PROCESS_MODE_ALWAYS
	transport.snapshot_received.disconnect(town.desktop._snapshot)
	transport.disconnected.disconnect(town.desktop._disconnected)
	transport.snapshot_received.connect(receive)
	transport.disconnected.connect(lost)
	for child in town.get_children():
		if child.get_script() and child.get_script().resource_path.ends_with("/care_runtime.gd"):
			child._pause()
			suspend(child)
	for body in town.desktop.actors.values(): hold(body)
	if not town.desktop.actors.values().has(town.desktop.explorer): hold(town.desktop.explorer)
	for body in participants: hold(body)
	town.wildlife.enabled = false
	town.rig.first_person = false
	town.rig.dock_width = 0
	town.rig.pitch = 0.68
	town.rig.distance = 10
	town.rig.set_enabled(false)
	preload("res://scripts/town_input.gd").clear_gameplay()
	captured = true

func suspend(node: Node) -> void:
	nodes.append({"node": node, "mode": node.process_mode})
	node.process_mode = Node.PROCESS_MODE_DISABLED

func hold(body: RigidBody3D) -> void:
	bodies.append({"node": body, "mode": body.process_mode, "freeze": body.freeze, "visible": body.visible,
		"layer": body.collision_layer, "mask": body.collision_mask, "velocity": body.linear_velocity, "contact": body.contact_enabled})
	body.process_mode = Node.PROCESS_MODE_DISABLED
	body.freeze = true
	body.visible = false
	body.collision_layer = 0
	body.collision_mask = 0
	body.contact_enabled = false
	preload("res://scripts/physics/neighbors.gd").frame = -1

func receive(data: Dictionary) -> void:
	snapshot = data.duplicate(true)
	disconnected = false

func lost() -> void:
	disconnected = true

func target(body: RigidBody3D) -> void:
	town.actor = body
	town.rig.actor = body
	town.wildlife.player = body
	town.world.vegetation.player = body
	town.actor_audio.actor = body
	town.actor_audio.initialized = false
	town.actor_audio.step_distance = 0

func restore() -> void:
	if not captured: return
	for record in bodies:
		if not is_instance_valid(record.node): continue
		record.node.process_mode = record.mode
		record.node.freeze = record.freeze
		record.node.visible = record.visible
		record.node.collision_layer = record.layer
		record.node.collision_mask = record.mask
		record.node.linear_velocity = record.velocity
		record.node.contact_enabled = record.contact
	preload("res://scripts/physics/neighbors.gd").frame = -1
	if not is_instance_valid(actor): actor = town.desktop.explorer
	target(actor)
	town.rig.pitch = camera.pitch
	town.rig.distance = camera.distance
	town.rig.rotation = camera.rotation
	town.rig.first_person = camera.first
	town.rig.dock_width = camera.dock
	town.wildlife.enabled = wildlife_enabled
	for record in nodes:
		if is_instance_valid(record.node): record.node.process_mode = record.mode
	town.hud.set_meta("battle_active", false)
	town.hud.is_menu_open = false
	town.hud.root.show()
	town.menu_changed(false)
	town.desktop._menu(false)
	var transport: Node = town.desktop.transport
	transport.snapshot_received.disconnect(receive)
	transport.disconnected.disconnect(lost)
	transport.snapshot_received.connect(town.desktop._snapshot)
	transport.disconnected.connect(town.desktop._disconnected)
	transport.process_mode = transport_mode
	if disconnected: town.desktop._disconnected()
	elif not snapshot.is_empty():
		# A Mayor focus request during battle must not override the restored camera.
		town.desktop.focus_serial = int(snapshot.get("mayor", {}).get("focusSerial", 0))
		town.desktop._snapshot(snapshot)
	Input.mouse_mode = camera.mouse
	town.get_window().min_size = minimum_size
	preload("res://scripts/town_input.gd").clear_gameplay()
	nodes.clear()
	bodies.clear()
	captured = false
	snapshot = {}
	disconnected = false
