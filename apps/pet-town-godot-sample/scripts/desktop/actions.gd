extends RefCounted
var host: Node
var terminal_token := ""
var generation := 0
var terminal := preload("terminal.gd").new()

func dispatch(id: String, action: String, payload: Dictionary) -> void:
	match action:
		"follow": host.follow(id,bool(payload.get("keep_panel",false)))
		"leave": host.leave()
		"control": host.set_control(bool(payload.get("active",not host.controlled)))
		"camera":
			host.town.rig.first_person=bool(payload.get("first",payload.get("first_person",not host.town.rig.first_person)))
			host._refresh_selection()
		"pet": host.change_pet(id,str(payload.get("petId",payload.get("pet",payload.get("id","")))))
		"focus": _action("focusAgent",{"id":id})
		"observe","terminal_watch","interact","terminal_takeover":
			generation+=1
			terminal=preload("terminal.gd").new()
			terminal.state={"state":"connecting","control":false,"viewGeneration":generation,"message":"Connecting terminal…"}
			host.town.hud.set_terminal(terminal.state)
			terminal_token=""
			host.transport.request({"type":"terminal.open","id":id,"control":action not in ["observe","terminal_watch"],"takeover":action=="terminal_takeover","cols":80,"rows":24,"viewGeneration":generation})
		"terminal_release": close_terminal()
		"terminal_input": _terminal({"type":"terminal.input","text":_input(payload)})
		"terminal_live": _terminal({"type":"terminal.live"})
		"terminal_resize","terminal_scroll","terminal_mouse":
			var command:=payload.duplicate()
			command.type=action.replace("_",".")
			_terminal(command)
		"mayor_invoke","mayor_call": _action("invokeMayor")
		"mayor_start_talking": _action("mayorTalk",{"active":true})
		"mayor_stop_talking": _action("mayorTalk",{"active":false})
		"mayor_live_start": _action("invokeMayor")
		"mayor_live_stop": _action("stopMayor")
		"mayor_talk": _action("mayorTalk",{"active":bool(payload.get("active",false))})
		"mayor_stop": _action("stopMayor")
		"mayor_retry": _action("mayorRetryVoice")
		"mayor_settings": _action("openMayorSettings")
		"update_check","update_download","update_install": host.transport.request({"type":"update.action","action":action})
		"mayor_mode": _action("setMayorMode",{"mode":str(payload.get("mode","firstmate"))})

func _action(name: String, payload: Dictionary={}) -> void:
	var request:=payload.duplicate()
	request.type="action"
	request.action=name
	host.transport.request(request)

func _terminal(command: Dictionary) -> void:
	if terminal_token.is_empty() or (command.get("type","")=="terminal.input" and str(command.get("text","")).is_empty()): return
	host.transport.request({"type":"terminal.send","session":terminal_token,"command":command})

func close_terminal() -> void:
	generation+=1
	host.transport.cancel_terminal_pending()
	if host.transport.connected: host.transport.request({"type":"terminal.close"})
	terminal_token=""
	terminal=preload("terminal.gd").new()
	terminal.state.viewGeneration=generation
	host.town.hud.set_terminal(terminal.state)

func response(request: Dictionary, data: Dictionary) -> void:
	if request.get("type","")=="terminal.open" and (int(request.get("viewGeneration",-1))!=generation or request.get("id","")!=host.selected_id): return
	if not data.get("ok",false):
		var message:=str(data.get("error","Desktop action could not complete."))
		host.town.hud.show_toast(message)
		if str(request.get("type","")).begins_with("terminal"):
			host.town.hud.set_terminal({"state":"error","control":false,"message":message,"viewGeneration":generation})
		return
	if request.get("type","")=="terminal.open":
		if int(request.get("viewGeneration",-1))!=generation or request.get("id","")!=host.selected_id: return
		terminal_token=str(data.get("result",{}).get("token",""))

func events(data: Array) -> void:
	for event_data in data:
		if event_data is Dictionary and int(event_data.get("viewGeneration",-1))==generation and event_data.get("id","")==host.selected_id:
			host.town.hud.set_terminal(terminal.event(event_data))

func _input(payload: Dictionary) -> String:
	if payload.has("text"):
		var text:=str(payload.text)
		if payload.get("paste",false):
			if text.contains("\u001b[200~") or text.contains("\u001b[201~"):
				host.town.hud.show_toast("Clipboard text contains paste controls. Nothing was pasted.")
				return ""
			text="\u001b[200~"+text+"\u001b[201~"
			if text.to_utf8_buffer().size()>48000:
				host.town.hud.show_toast("This paste exceeds 48 KB. Use a smaller selection or Herdr.")
				return ""
		return text
	var key:=int(payload.get("keycode",0))
	var unicode:=int(payload.get("unicode",0))
	var special:={KEY_ENTER:"\r",KEY_KP_ENTER:"\r",KEY_BACKSPACE:"\u007f",KEY_TAB:"\t",KEY_ESCAPE:"\u001b",KEY_UP:"\u001b[A",KEY_DOWN:"\u001b[B",KEY_RIGHT:"\u001b[C",KEY_LEFT:"\u001b[D",KEY_HOME:"\u001b[H",KEY_END:"\u001b[F",KEY_DELETE:"\u001b[3~",KEY_PAGEUP:"\u001b[5~",KEY_PAGEDOWN:"\u001b[6~"}
	var text: String=special.get(key,String.chr(unicode) if unicode>0 else "")
	if payload.get("ctrl",false) and key>=KEY_A and key<=KEY_Z: text=String.chr(key-KEY_A+1)
	if payload.get("alt",false) and not text.is_empty(): text="\u001b"+text
	return text
