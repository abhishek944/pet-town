extends RefCounted
# Source simplex2 permutation (seed 99), Mulberry32 and voxel hash, not Godot noise.
const GRAD = [Vector2(1,1),Vector2(-1,1),Vector2(1,-1),Vector2(-1,-1),Vector2(1,0),Vector2(-1,0),Vector2(1,0),Vector2(-1,0),Vector2(0,1),Vector2(0,-1),Vector2(0,1),Vector2(0,-1)]
var cache: Dictionary={}
var permutation:=PackedInt32Array()

func _init() -> void:
	var p:=range(256)
	var seed:=99
	for i in range(255,0,-1):
		seed=(seed+1831565813)&0xffffffff
		var value:=((seed^(seed>>15))*(seed|1))&0xffffffff
		value=(value^(value+(((value^(value>>7))*(value|61))&0xffffffff)))&0xffffffff
		var random:=float((value^(value>>14))&0xffffffff)/4294967296.0
		var j:=floori(random*(i+1))
		var swap: int=p[i]
		p[i]=p[j]
		p[j]=swap
	for i in 512: permutation.append(p[i&255])

func noise(x: float,z: float) -> float:
	# Float keys preserve exact inputs; adjoining face vertices reuse these samples.
	if not cache.has(x): cache[x]={}
	if not cache[x].has(z): cache[x][z]=evaluate(x,z)
	return cache[x][z]

func evaluate(x: float,z: float) -> float:
	var skew:=(sqrt(3.0)-1.0)*0.5
	var unskew:=(3.0-sqrt(3.0))/6.0
	var s:=(x+z)*skew
	var i:=floori(x+s)
	var j:=floori(z+s)
	var t:=(i+j)*unskew
	var a:=Vector2(x-(i-t),z-(j-t))
	var step:=Vector2i(1,0) if a.x>a.y else Vector2i(0,1)
	var b:=a-Vector2(step)+Vector2.ONE*unskew
	var c:=a-Vector2.ONE+Vector2.ONE*(2.0*unskew)
	i&=255
	j&=255
	return 70.0*(contribution(a,permutation[i+permutation[j]]%12)+contribution(b,permutation[i+step.x+permutation[j+step.y]]%12)+contribution(c,permutation[i+1+permutation[j+1]]%12))

func contribution(p: Vector2,index: int) -> float:
	var weight:=0.5-p.length_squared()
	return 0.0 if weight<0.0 else weight*weight*weight*weight*GRAD[index].dot(p)

func fbm(x: float,z: float,count: int) -> float:
	var total:=0.0
	var weight:=0.0
	var amplitude:=1.0
	var frequency:=1.0
	for i in count:
		total+=amplitude*noise(x*frequency+i*17.13,z*frequency-i*9.71)
		weight+=amplitude
		amplitude*=0.5
		frequency*=2.0
	return total/weight

static func variation(cell: Vector3i,half: int) -> float:
	var value:=(((cell.x+half)*73856093) ^ (cell.y*19349663) ^ ((cell.z+half)*83492791))&0xffffffff
	value=((value^(value>>13))*1274126177)&0xffffffff
	return float((value^(value>>16))&0xffffffff)/4294967296.0
