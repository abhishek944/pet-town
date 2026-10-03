extends RefCounted
var noise:=preload("terrain_noise.gd").new()

func sample(kind: String,p: Vector3,face: int,variation: float,water: float,wall_fraction:=1.0,wall_height:=0.0) -> Vector3:
	var fbm: float=noise.fbm(p.x*0.03,p.z*0.03,2)
	var fine: float=noise.noise(p.x*0.11+p.y*0.17,p.z*0.11-p.y*0.13)
	var color:=Vector3.ONE
	if kind=="grass":
		var broad:=clampf(noise.fbm(p.x*0.015+31,p.z*0.015-12,2)*1.8,-1,1)
		color+=Vector3(0.08,0.02,-0.07)*broad if broad>0 else Vector3(0.08,-0.01,-0.09)*broad
		var warm:=clampf(fbm*1.9,0,1)
		var cool:=clampf(-fbm*1.9,0,1)
		color*=Vector3(1+0.07*warm-0.04*cool,1+0.02*warm,1-0.1*warm+0.06*cool)
		var patch:=clampf((noise.fbm(p.x*0.045-8,p.z*0.045+2,3)-0.02)*4,0,1)
		color*=Vector3(1-0.12*patch,1-0.05*patch,1+0.02*patch)
		var height:=clampf((p.y-12)/14,0,1)
		color*=Vector3(1+0.03*height,1,1+0.06*height)
		color*=1+0.07*fine+0.035*noise.noise(p.x*0.23+3.1,p.z*0.23-1.7)
	else:
		color=Vector3(1+0.03*fbm,1,1-0.03*fbm)*(1+0.08*fine+0.05*fbm)
		if kind=="sand" and p.y>=6.92:
			var wet:=1.0-clampf((p.y-water-0.05)/0.3,0,1)
			color*=Vector3(1-0.14*wet,1-0.15*wet,1-0.17*wet)
	if face not in [2,3] and wall_height>0.5:
		var amount:=minf(1.0,wall_height/3)
		color*=Vector3.ONE+(Vector3(0.8+0.25*wall_fraction,0.84+0.19*wall_fraction,0.93+0.06*wall_fraction)-Vector3.ONE)*amount
	if face==2: color*=1+(variation-0.5)*0.06
	if water>p.y:
		var depth:=clampf(0.3+(water-p.y)/2.6,0,1)
		color*=Vector3(1-0.42*depth,1-0.16*depth,1-0.06*depth)
	return color

func moss(p: Vector3,wall: Vector2) -> float:
	var height:=wall.y-wall.x
	if height<2.5: return 0
	var edge:=clampf((p.y-(wall.y-3.2))/2.2,0,1)
	var patch:=clampf((noise.fbm(p.x*0.085+13,p.z*0.085-4,2)+0.08)*2.6,0,1)
	return edge*patch*(0.75+0.25*noise.noise((p.x+p.z)*0.6,p.y*0.25))*clampf((height-2.5)/2,0,1)
