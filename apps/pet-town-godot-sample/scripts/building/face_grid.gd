extends RefCounted
const Vertex=preload("face_vertex.gd")
const Bevel=preload("bevel_resolver.gd")

static func write(mesh: RefCounted,face: Dictionary) -> void:
	var frame: Array=face.frame
	var ua: int=frame[1].max_axis_index()
	var va: int=frame[2].max_axis_index()
	var masks: Array[int]=[]
	for i in 4: masks.append(mesh.bevel.corner_axes(Vector3i(frame[0]+frame[1]*(i&1)+frame[2]*(i>>1))))
	var shore_u:=false
	var shore_v:=false
	var edges:=[false,false,false,false]
	if face.cell.y==7 and face.direction!=3:
		edges=[mesh.state.shore_edge(face.cell,frame[0],frame[1],frame[2],0),mesh.state.shore_edge(face.cell,frame[0],frame[1],frame[2],1),mesh.state.shore_edge(face.cell,frame[0],frame[2],frame[1],0),mesh.state.shore_edge(face.cell,frame[0],frame[2],frame[1],1)]
		var touches: bool=edges.any(func(value: bool)->bool:return value)
		if face.direction==2 and not touches:
			for j in 5:
				for i in 5:
					var point: Vector3=Vector3(face.cell)+frame[0]+frame[1]*(i/4.0)+frame[2]*(j/4.0)
					if mesh.state.shore(point.x,point.z)>0: touches=true
		shore_u=touches and ua!=1
		shore_v=touches and va!=1
	var us:=subdivisions((masks[0]|masks[2])&(1<<ua),(masks[1]|masks[3])&(1<<ua),shore_u)
	var vs:=subdivisions((masks[0]|masks[1])&(1<<va),(masks[2]|masks[3])&(1<<va),shore_v)
	var grid: Array[int]=[]
	var corners:=[-1,-1,-1,-1]
	for y in vs.size():
		for x in us.size():
			var ku: int=us[x][1]
			var kv: int=vs[y][1]
			var bound_u:=ku==0 or ku==3
			var bound_v:=kv==0 or kv==3
			var reuse:=-1
			if bound_v and not bound_u:
				var low:=0 if kv==0 else 2
				var high:=1 if kv==0 else 3
				if ku==1 and not (masks[low]&(1<<ua)): reuse=low
				elif ku==2 and not (masks[high]&(1<<ua)): reuse=high
				elif ku==4 and not edges[0 if kv==0 else 1]: reuse=100+grid.size()-1
			elif bound_u and not bound_v:
				var low:=0 if ku==0 else 1
				var high:=2 if ku==0 else 3
				if kv==1 and not (masks[low]&(1<<va)): reuse=low
				elif kv==2 and not (masks[high]&(1<<va)): reuse=high
				elif kv==4 and not edges[2 if ku==0 else 3]: reuse=100+grid.size()-us.size()
			if reuse>=0: grid.append(-1-reuse)
			else:
				var index:=Vertex.emit(mesh,face,us[x][0],vs[y][0])
				grid.append(index)
				if bound_u and bound_v: corners[int(ku==3)+int(kv==3)*2]=index
	for i in grid.size():
		if grid[i]<0:
			var target: int=-1-grid[i]
			grid[i]=grid[target-100] if target>=100 else corners[target]
	for y in vs.size()-1:
		for x in us.size()-1:
			var index:=y*us.size()+x
			var a:=grid[index]
			var b:=grid[index+1]
			var c:=grid[index+us.size()+1]
			var d:=grid[index+us.size()]
			if mesh.data[a*4+2]+mesh.data[c*4+2]>mesh.data[b*4+2]+mesh.data[d*4+2]:
				mesh.triangle(a,b,d)
				mesh.triangle(b,c,d)
			else:
				mesh.triangle(a,b,c)
				mesh.triangle(a,c,d)

static func subdivisions(low: int,high: int,shore: bool) -> Array:
	var result:=[[0.0,0]]
	if low: result.append_array([[Bevel.INSET,1],[Bevel.WIDTH,1]])
	if shore: result.append_array([[0.25,4],[0.5,4],[0.75,4]])
	if high: result.append_array([[1.0-Bevel.WIDTH,2],[1.0-Bevel.INSET,2]])
	result.append([1.0,3])
	return result
