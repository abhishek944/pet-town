extends RefCounted
const DEFAULT := Color("e4ebdc")
const ANSI := ["000000","cd0000","bdebb1","eddaa0","0000ee","d6c6ed","00cdcd","e5e5e5","7f7f7f","ff0000","00ff00","ffff00","5c5cff","ff00ff","00ffff","ffffff"]

static func apply(parameters: String, current: Color) -> Color:
	var values:=parameters.split(";")
	var index:=0
	while index<values.size():
		var code:=int(values[index])
		if code in [0,39]: current=DEFAULT
		elif code>=30 and code<=37: current=Color(ANSI[code-30])
		elif code>=90 and code<=97: current=Color(ANSI[code-90+8])
		elif code==38 and index+2<values.size():
			var mode:=int(values[index+1])
			if mode==2 and index+4<values.size():
				current=Color8(clampi(int(values[index+2]),0,255),clampi(int(values[index+3]),0,255),clampi(int(values[index+4]),0,255))
				index+=4
			elif mode==5:
				current=_indexed(clampi(int(values[index+2]),0,255))
				index+=2
		index+=1
	return current

static func _indexed(index: int) -> Color:
	if index<16: return Color(ANSI[index])
	if index>=232:
		var gray:=8+(index-232)*10
		return Color8(gray,gray,gray)
	var cube:=index-16
	var components: Array[int]=[0,95,135,175,215,255]
	return Color8(components[cube/36],components[(cube/6)%6],components[cube%6])
