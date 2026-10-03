extends RefCounted
# Port of create-vertex-bevel-resolver.js: connected solid octants share a bevel.
const WIDTH := 0.22
const INSET := WIDTH*0.586
var state: RefCounted
var cell: Vector3i

func corner_axes(local: Vector3i) -> int:
	if cell.y+local.y<=state.flat_below: return 0
	var occupancy: Array[bool]=[]
	for i in 8: occupancy.append(state.solid(cell+local-Vector3i.ONE+Vector3i(i&1,(i>>1)&1,(i>>2)&1)))
	var needs:=false
	for i in 8:
		if occupancy[i] and int(not occupancy[i^1])+int(not occupancy[i^2])+int(not occupancy[i^4])>=2: needs=true
	if not needs: return 0
	var axes:=0
	for axis in 3:
		for i in 8:
			if not (i&(1<<axis)) and occupancy[i]!=occupancy[i|(1<<axis)]: axes|=1<<axis
	return axes

func resolve(local: Vector3) -> Array:
	var axes: Array[int]=[]
	var offsets: Array[int]=[]
	var directions:=Vector3i.ZERO
	var distances:=Vector3.ZERO
	var start:=0
	var interior:=0
	for axis in 3:
		var value:=local[axis]
		if value==0 or value==1:
			if value==0: start|=1<<axes.size()
			axes.append(axis)
			offsets.append(-1 if value==0 else 0)
		elif value<WIDTH or value>1.0-WIDTH:
			directions[axis]=-1 if value<WIDTH else 1
			distances[axis]=WIDTH-value if value<WIDTH else value-(1.0-WIDTH)
			interior+=1
	var none:=[Vector3.ZERO,Vector3.ZERO,0.0]
	if axes.size()+interior<2 or cell.y+local.y<=state.flat_below: return none
	var occupancy: Array[bool]=[]
	var visited: Dictionary={start:true}
	var queue: Array[int]=[start]
	for i in 1<<axes.size(): occupancy.append(state.solid(cell+neighbor(i,axes,offsets)))
	var cursor:=0
	while cursor<queue.size():
		var current:=queue[cursor]
		cursor+=1
		for axis in axes.size():
			var adjacent:=current^(1<<axis)
			if occupancy[adjacent] and not visited.has(adjacent):
				visited[adjacent]=true
				queue.append(adjacent)
	var shortest:=1e9
	var chosen:=Vector3.ZERO
	for i in 1<<axes.size():
		if not visited.has(i): continue
		var candidate:=Vector3.ZERO
		var offset:=neighbor(i,axes,offsets)
		for j in axes.size():
			if not occupancy[i^(1<<j)]: candidate[axes[j]]=-WIDTH if i&(1<<j) else WIDTH
		if candidate==Vector3.ZERO: return none
		for axis in 3:
			if directions[axis]==0: continue
			var delta:=Vector3i.ZERO
			delta[axis]=directions[axis]
			if not state.solid(cell+offset+delta): candidate[axis]=directions[axis]*distances[axis]
		var distance:=candidate.length()-WIDTH
		if distance<shortest:
			shortest=distance
			chosen=candidate
		if shortest<=1e-7: break
	if shortest<=1e-6: return none
	return [chosen*(WIDTH/chosen.length()-1.0),chosen.normalized(),shortest]

func neighbor(index: int,axes: Array[int],offsets: Array[int]) -> Vector3i:
	var offset:=Vector3i.ZERO
	for i in axes.size(): offset[axes[i]]=offsets[i]+((index>>i)&1)
	return offset
