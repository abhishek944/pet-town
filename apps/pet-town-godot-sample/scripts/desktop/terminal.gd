extends RefCounted
## Interpret the existing ANSI grid without executing links or terminal escapes.
var width := 80
var height := 24
var rows: Array[String] = []
var cursor := Vector2i.ZERO
var saved := Vector2i.ZERO
var sequence := -1
var escape := ""
var foreground := preload("terminal_colors.gd").DEFAULT
var color_rows: Array[PackedColorArray] = []
var state := {"state":"closed","control":false,"message":"Choose Observe or Interact"}

func reset() -> void:
	rows.clear()
	color_rows.clear()
	foreground=preload("terminal_colors.gd").DEFAULT
	for row in range(height):
		rows.append(" ".repeat(width))
		var colors:=PackedColorArray()
		colors.resize(width)
		colors.fill(foreground)
		color_rows.append(colors)
	cursor = Vector2i.ZERO
	escape = ""

func event(data: Dictionary) -> Dictionary:
	state.viewGeneration=int(data.get("viewGeneration",state.get("viewGeneration",0)))
	if data.get("type","") == "status":
		state.merge(data,true)
	elif data.get("type","") == "frame":
		var seq := int(data.get("seq",-1))
		if seq <= sequence: return state
		if sequence < 0 and not data.get("full",false):
			state={"state":"disconnected","control":false,"viewGeneration":state.viewGeneration,"message":"Terminal needs a fresh frame. Reconnect."}
			return state
		sequence = seq
		state.rawFrame={"seq":seq,"full":data.get("full",false),"width":data.get("width",80),"height":data.get("height",24),"bytes":data.get("bytes","")}
		var previous_width:=width
		width = clampi(int(data.get("width",80)),2,512)
		height = clampi(int(data.get("height",24)),1,256)
		if data.get("full",false) or rows.size()!=height: reset()
		elif previous_width!=width:
			for line in range(height):
				rows[line]=(rows[line]+" ".repeat(width)).substr(0,width)
				color_rows[line].resize(width)
				for column in range(previous_width,width): color_rows[line][column]=foreground
			cursor.x=mini(width-1,cursor.x)
		var text := Marshalls.base64_to_raw(str(data.get("bytes",""))).get_string_from_utf8()
		for character in text: _character(character)
		state.text = "\n".join(rows)
		state.width=width
		state.height=height
		state.colors=_colors()
	return state.duplicate(true)

func _character(character: String) -> void:
	if not escape.is_empty():
		escape += character
		if escape.begins_with("\u001b["):
			if escape.length()>2 and character.unicode_at(0)>=64 and character.unicode_at(0)<=126:
				_command(escape.substr(2,escape.length()-3),character)
				escape=""
		elif escape.begins_with("\u001b]"):
			if character=="\u0007" or escape.ends_with("\u001b\\"): escape=""
		elif escape.length()==2 and character not in ["[","]","(",")","#","%"]: escape=""
		elif escape.length()==3 and escape[1] in ["(",")","#","%"]: escape=""
		if escape.length()>4096: escape=""
		return
	if character=="\u001b":
		escape=character
		return
	match character:
		"\r": cursor.x=0
		"\n": cursor.y=mini(height-1,cursor.y+1)
		"\b": cursor.x=maxi(0,cursor.x-1)
		"\t": cursor.x=mini(width-1,(cursor.x/8+1)*8)
		_:
			if character.unicode_at(0)<32: return
			if cursor.x>=width:
				cursor.x=0
				cursor.y=mini(height-1,cursor.y+1)
			var row: String=rows[cursor.y]
			rows[cursor.y]=row.substr(0,cursor.x)+character+row.substr(cursor.x+1)
			color_rows[cursor.y][cursor.x]=foreground
			cursor.x+=1

func _command(parameters: String, command: String) -> void:
	var parts:=parameters.split(";")
	var value:=int(parts[0]) if not parts.is_empty() else 0
	var amount:=maxi(1,value)
	match command:
		"m": foreground=preload("terminal_colors.gd").apply(parameters,foreground)
		"H","f":
			cursor.y=clampi(amount-1,0,height-1)
			cursor.x=clampi(maxi(1,int(parts[1]))-1,0,width-1) if parts.size()>1 else 0
		"A": cursor.y=maxi(0,cursor.y-amount)
		"B": cursor.y=mini(height-1,cursor.y+amount)
		"C": cursor.x=mini(width-1,cursor.x+amount)
		"D": cursor.x=maxi(0,cursor.x-amount)
		"G": cursor.x=clampi(amount-1,0,width-1)
		"d": cursor.y=clampi(amount-1,0,height-1)
		"s": saved=cursor
		"u": cursor=saved
		"J":
			if value in [2,3]:
				var previous:=cursor
				var previous_color:=foreground
				reset()
				cursor=previous
				foreground=previous_color
			elif value==0:
				_erase_line(0)
				for row in range(cursor.y+1,height): rows[row]=" ".repeat(width)
			elif value==1:
				_erase_line(1)
				for row in range(cursor.y): rows[row]=" ".repeat(width)
		"K": _erase_line(value)

func _erase_line(mode: int) -> void:
	var row: String=rows[cursor.y]
	if mode==2: rows[cursor.y]=" ".repeat(width)
	elif mode==1: rows[cursor.y]=" ".repeat(mini(width,cursor.x+1))+row.substr(cursor.x+1)
	else: rows[cursor.y]=row.substr(0,cursor.x)+" ".repeat(maxi(0,width-cursor.x))

func _colors() -> Dictionary:
	var result: Dictionary={}
	for line in range(color_rows.size()):
		var changes: Dictionary={}
		var previous:=Color.TRANSPARENT
		for column in range(color_rows[line].size()):
			var color:=color_rows[line][column]
			if color!=previous:
				changes[column]=color
				previous=color
		result[line]=changes
	return result
