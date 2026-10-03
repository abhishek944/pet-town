extends RefCounted
var host: Node
var prepare_id := ""
var frozen := false

func apply(data: Dictionary) -> void:
	var state: Dictionary=data.get("appUpdate",{})
	host.town.hud.set_app_update(state)
	for message in data.get("nativeMessages",[]): host.town.hud.show_toast(str(message))
	var installing: bool=state.get("phase","") in ["preparing","installing"]
	if installing:
		frozen=true
		host.town.builder.active=false
		host.town.actor.enabled=false
		host.town.rig.set_enabled(false)
	elif frozen:
		frozen=false
		host.town.builder.active=not host.is_following()
		host.town.rig.set_enabled(not host.town.hud.is_menu_open)
		host._menu(host.town.hud.is_menu_open)
	var id: String=str(data.get("updatePrepare","")) if data.get("updatePrepare")!=null else ""
	if not id.is_empty() and id!=prepare_id:
		prepare_id=id
		_prepare(id)

func _prepare(id: String) -> void:
	host.actions.close_terminal()
	var deadline:=Time.get_ticks_msec()+15000
	while host.town.builder.is_edit_pending() and Time.get_ticks_msec()<deadline:
		await host.get_tree().process_frame
	var error: String=""
	if host.town.builder.is_edit_pending(): error="Wait for the current world edit before updating."
	elif host.town.preferences.save("user://preferences.cfg")!=OK: error="Town settings could not be saved. Update cancelled."
	if error.is_empty() and host.town.ocean and host.town.ocean.boat:
		var boat: Node=host.town.ocean.boat
		boat.release_controls()
		boat.save()
		if boat.dirty: error="The boat mooring could not be saved. Update cancelled."
	host.transport.request({"type":"update.prepare","id":id,"ready":error.is_empty(),"error":error})
