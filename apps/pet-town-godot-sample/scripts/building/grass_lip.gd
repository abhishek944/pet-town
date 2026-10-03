extends RefCounted
const Bevel=preload("bevel_resolver.gd")
const PROFILE=[Vector3(-Bevel.WIDTH*(1.0-0.7071067811865476),-Bevel.WIDTH*(1.0-0.7071067811865476),1),Vector3(0.06,-0.14,0.86),Vector3(0.06,-0.46,0.54)]
const NORMALS=[Vector2(0.55,0.83),Vector2(0.8,0.6),Vector2(0.93,0.36)]

static func write(mesh: RefCounted,cell: Vector3i,direction: int) -> void:
	var n:=Vector3(mesh.NORMALS[direction])
	var axis:=2 if direction<2 else 0
	var along:=Vector3i.ZERO
	along[axis]=1
	var low: bool=not mesh.state.solid(cell-along)
	var high: bool=not mesh.state.solid(cell+along)
	var start:=Bevel.WIDTH if low else 0.0
	var end:=1.0-Bevel.WIDTH if high else 1.0
	var origin:=Vector3(cell.x+int(n.x>0),cell.y+1,cell.z+int(n.z>0))
	origin[axis]=cell[axis]
	var variation:=preload("terrain_noise.gd").variation(cell,mesh.state.half)
	var tint: Vector3=mesh.state.tint.sample("grass",Vector3(cell)+Vector3(0.5,1,0.5),2,variation,mesh.state.water)
	var first:=column(mesh,cell,direction,origin+Vector3(along)*start,n,start,tint)
	var last:=column(mesh,cell,direction,origin+Vector3(along)*end,n,end,tint)
	var forward:=n.x*along.z-n.z*along.x>0
	join(mesh,first,last) if forward else join(mesh,last,first)
	for item in [[low,start,-1],[high,end,1]]:
		if not item[0]: continue
		var center: Vector3=origin+Vector3(along)*item[1]-n*Bevel.WIDTH
		var previous: Array=last if item[2]>0 else first
		for step in range(1,3):
			var angle:=step/2.0*PI/4.0
			var outward: Vector3=n*cos(angle)+Vector3(along)*item[2]*sin(angle)
			var next:=column(mesh,cell,direction,center+outward*Bevel.WIDTH,outward,item[1]+item[2]*Bevel.WIDTH*angle,tint)
			join(mesh,previous,next) if forward==(item[2]>0) else join(mesh,next,previous)
			previous=next

static func column(mesh: RefCounted,cell: Vector3i,direction: int,origin: Vector3,outward: Vector3,u: float,tint: Vector3) -> Array:
	var indices:=[]
	var axis:=2 if direction<2 else 0
	for i in 3:
		var shape: Vector3=PROFILE[i]
		indices.append(mesh.points.size())
		mesh.points.append(origin+outward*shape.x+Vector3.UP*(shape.y-0.004))
		var n: Vector3=outward*NORMALS[i].x+Vector3.UP*NORMALS[i].y
		mesh.normals.append((n*127).round()/127)
		mesh.uv.append((Vector2(clampf(u,0,1),shape.z)*65535).round()/65535)
		mesh.colors.append(Color(minf(255,roundf(tint.x*127.5))/255,minf(255,roundf(tint.y*127.5))/255,minf(255,roundf(tint.z*127.5))/255,0))
		mesh.data.append_array(PackedFloat32Array([mesh.state.fringe,255,255 if i==0 else roundf(0.93*255),direction+posmod(cell[axis],2)*8+posmod(cell.y,2)*16]))
		mesh.grass.append_array(PackedFloat32Array([0,0,0,0]))
	return indices

static func join(mesh: RefCounted,a: Array,b: Array) -> void:
	for i in 2:
		mesh.triangle(a[i],b[i],b[i+1])
		mesh.triangle(a[i],b[i+1],a[i+1])
