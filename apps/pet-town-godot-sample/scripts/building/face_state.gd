extends RefCounted
var store: RefCounted
var flat_below:=6
var water:=7.62
var half:=208
var fringe:=0
var tops: Dictionary={}
var wall_cache: Dictionary={}
var shore_cache: Dictionary={}
var solid_cache: Dictionary={}
static var ao_offsets: Array=[]
static var ao_weights:=PackedFloat64Array()
static var ao_total:=0.0
var tint:=preload("terrain_tint.gd").new()

func _init() -> void:
	if not ao_offsets.is_empty(): return
	for depth in 3:
		for x in range(-2,2):
			for y in range(-2,2):
				var weight:=1.0/(0.35+pow(x+0.5,2)+pow(y+0.5,2)+pow(depth+0.5,2)*1.4)
				ao_offsets.append(Vector3i(x,y,depth+1))
				ao_weights.append(weight)
				ao_total+=weight

func solid(cell: Vector3i) -> bool:
	if not solid_cache.has(cell): solid_cache[cell]=cell.y<0 or store.get_id(cell)>0
	return solid_cache[cell]

func top(x: int,z: int) -> int:
	var key:=Vector2i(x,z)
	if not tops.has(key): tops[key]=store.top_y(x,z)
	return tops[key]

func dropped(cell: Vector3i) -> bool:
	if store.get_id(cell)!=7: return false
	for z in range(-1,2):
		for x in range(-1,2):
			if ((x!=0 or z!=0) and not solid(cell+Vector3i(x,0,z))) or solid(cell+Vector3i(x,1,z)): return false
	return true

func ao(cell: Vector3i,n: Vector3i,u: Vector3i,v: Vector3i,a: int,b: int) -> float:
	var p:=cell+n
	var su:=u*(1 if a else -1)
	var sv:=v*(1 if b else -1)
	var side1:=int(solid(p+su))
	var side2:=int(solid(p+sv))
	var corner:=int(solid(p+su+sv))
	var level:=0 if side1>0 and side2>0 else 3-side1-side2-corner
	var blocked:=0.0
	var origin:=cell+u*a+v*b
	for i in ao_offsets.size():
		var offset: Vector3i=ao_offsets[i]
		if solid(origin+n*offset.z+u*offset.x+v*offset.y): blocked+=ao_weights[i]
	return [0.5,0.66,0.83,1.0][level]*(1.0-0.75*minf(1.0,blocked/ao_total*1.25))

func edge_mask(cell: Vector3i) -> int:
	var result:=0
	var offsets:=[Vector3i(-1,0,0),Vector3i(1,0,0),Vector3i(0,0,-1),Vector3i(0,0,1),Vector3i(-1,0,-1),Vector3i(1,0,-1),Vector3i(-1,0,1),Vector3i(1,0,1)]
	for i in offsets.size():
		var p: Vector3i=cell+offsets[i]
		if store.get_id(p)==1 and not solid(p+Vector3i.UP): result|=1<<i
	return result

func low_shore(x: int,z: int) -> bool:
	for dz in range(-1,2):
		for dx in range(-1,2):
			if top(x+dx,z+dz)>8: return false
	return true

func shore(x: float,z: float) -> float:
	var key:=Vector2(x,z)
	if shore_cache.has(key): return shore_cache[key]
	var distance:=9.0
	var p:=Vector2(x,z)
	for dz in range(-1,2):
		for dx in range(-1,2):
			var cx:=floori(x)+dx
			var cz:=floori(z)+dz
			if top(cx,cz)!=8 or not low_shore(cx,cz): continue
			for edge in [[1,0,1,0,1,1],[-1,0,0,0,0,1],[0,1,0,1,1,1],[0,-1,0,0,1,0]]:
				if top(cx+edge[0],cz+edge[1])>=8: continue
				var start:=Vector2(cx+edge[2],cz+edge[3])
				var end:=Vector2(cx+edge[4],cz+edge[5])
				var t:=clampf((p-start).dot(end-start)/(end-start).length_squared(),0,1)
				distance=minf(distance,p.distance_to(start+(end-start)*t))
	var result:=smoothstep(0.0,1.0,1.0-distance/0.6) if distance<0.6 else 0.0
	shore_cache[key]=result
	return result

func shore_edge(cell: Vector3i,origin: Vector3,u: Vector3,v: Vector3,fixed: float) -> bool:
	if u.y!=0 or cell.y+origin.y+v.y*fixed!=8: return false
	for i in 5:
		var p:=Vector3(cell)+origin+u*(i/4.0)+v*fixed
		if shore(p.x,p.z)>0: return true
	return false

func wall_column(x: int,z: int) -> Vector2:
	var key:=Vector2i(x,z)
	if wall_cache.has(key): return wall_cache[key]
	var total:=Vector2.ZERO
	for dz in range(-1,2):
		for dx in range(-1,2):
			var low:=1000.0
			var high:=0.0
			for az in range(-1,2):
				for ax in range(-1,2):
					var height:=float(top(x+dx+ax,z+dz+az))
					low=minf(low,height)
					high=maxf(high,height)
			total+=Vector2(low,high)
	wall_cache[key]=total/9.0
	return wall_cache[key]

func wall(x: float,z: float) -> Vector2:
	var ix:=floori(x-0.5)
	var iz:=floori(z-0.5)
	var a:=wall_column(ix,iz).lerp(wall_column(ix+1,iz),x-0.5-ix)
	var b:=wall_column(ix,iz+1).lerp(wall_column(ix+1,iz+1),x-0.5-ix)
	return a.lerp(b,z-0.5-iz)
