extends RefCounted
const Style = preload("res://ui/hud_style.gd")

static func render(data: Dictionary) -> Dictionary:
	var standard: bool = data.get("mode", "firstmate") != "live"
	var active: bool = data.get("active", false)
	var listening: bool = active and data.get("listening", false)
	var live: bool = data.get("liveConnected", false)
	var connecting: bool = not live and (data.get("connecting", false) or data.get("wakeActivated", false))
	var phase := "Standard mode"
	var status := Style.text_or(data.get("voiceStatus"), "Ready · call Mayor to talk." if data.get("firstmateOwned", false) else "Open Settings to set up Mayor voice.")
	var error := Style.text_or(data.get("error"))
	var talk := "Stop and send" if listening else "Start talking"
	if standard:
		phase = "Listening" if listening else "Speaking" if data.get("speaking", false) else "Working" if data.get("working", false) else Style.text_or(data.get("voiceStatus"), "Standard mode")
	else:
		phase = "Live voice stopped"
		status = "Start Live voice to talk."
		talk = "Start Live voice"
		if connecting:
			phase = "Connecting Live voice"
			status = Style.text_or(data.get("wakeStatus"), "Connecting to Live voice…")
			talk = "Cancel connection"
		elif live:
			phase = "Speaking" if data.get("speaking", false) else "Working" if data.get("working", false) else "Listening" if listening else "Live voice connected"
			status = "Mayor is speaking." if data.get("speaking", false) else "Firstmate is working…" if data.get("working", false) else "Mayor is listening." if listening else "Connected to Live voice."
			talk = "Stop voice"
		if active:
			error = Style.text_or(data.get("error"), Style.text_or(data.get("degradedNote")))
			if not error.is_empty(): phase = "Live voice error"; status = error; talk = "Retry Live voice" if not connecting and not live else talk
	if not active: phase = "Stopped"; status = "Start Mayor in Settings."
	var pending := "" if not data.get("pending", false) else Style.text_or(data.get("pending"))
	if not pending.is_empty() and pending != "false": status = pending
	var speech := Style.text_or(data.get("speech"))
	return {"name":Style.text_or(data.get("name"),"Mayor"),"phase":phase,"status":status,"speech":speech,"error":error,"standard":standard,"listening":listening,"active":active,"talk":talk,"status_visible":not active or speech.is_empty() or not error.is_empty() or not pending.is_empty()}
