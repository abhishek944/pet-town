extends RefCounted
# Native port of the original rounded terrain mesher; face IDs are unchanged.
const NORMALS = [Vector3i.RIGHT,Vector3i.LEFT,Vector3i.UP,Vector3i.DOWN,Vector3i.BACK,Vector3i.FORWARD]
const FRAMES = [
	[Vector3(1,0,0),Vector3(0,1,0),Vector3(0,0,1)],
	[Vector3(0,0,0),Vector3(0,0,1),Vector3(0,1,0)],
	[Vector3(0,1,0),Vector3(0,0,1),Vector3(1,0,0)],
	[Vector3(0,0,0),Vector3(1,0,0),Vector3(0,0,1)],
	[Vector3(0,0,1),Vector3(1,0,0),Vector3(0,1,0)],
	[Vector3(0,0,0),Vector3(0,1,0),Vector3(1,0,0)]
]
const UV_AXES = [[2,1],[2,1],[0,2],[0,2],[0,1],[0,1]]
const Vertex=preload("face_vertex.gd")
var state: RefCounted
var bevel:=preload("bevel_resolver.gd").new()
var points:=PackedVector3Array()
var normals:=PackedVector3Array()
var uv:=PackedVector2Array()
var colors:=PackedColorArray()
var data:=PackedFloat32Array()
var grass:=PackedFloat32Array()
var indices:=PackedInt32Array()

func prepare(cell: Vector3i,direction: int,definition: Dictionary,exposed: bool) -> Dictionary:
	bevel.state=state
	bevel.cell=cell
	var frame: Array=FRAMES[direction]
	var layer:=int(definition.get("top" if direction==2 else ("bottom" if direction==3 else "side"),0))
	var overlay:=int(definition.get("topOver",255)) if direction==2 else 255
	if direction not in [2,3] and exposed: overlay=int(definition.get("exposedSideOver",255))
	var ao:=[]
	for i in 4: ao.append(state.ao(cell,NORMALS[direction],Vector3i(frame[1]),Vector3i(frame[2]),i&1,i>>1))
	return {"cell":cell,"direction":direction,"definition":definition,"frame":frame,"layer":layer,"overlay":overlay,"ao":ao,"variation":preload("terrain_noise.gd").variation(cell,state.half),"dropped":direction==2 and state.dropped(cell),"edge":state.edge_mask(cell) if direction==2 and definition.get("blendGrass",false) else 0,"moss":direction not in [2,3] and state.store.get_id(cell) in [3,6,5,2,1,10] and cell.y+1>state.water}

func add_face(cell: Vector3i,direction: int,definition: Dictionary,_tint: Color=Color.WHITE,exposed:=false) -> void:
	var face:=prepare(cell,direction,definition,exposed)
	preload("face_grid.gd").write(self,face)

func add_riser(cell: Vector3i,direction: int,definition: Dictionary) -> void:
	var face:=prepare(cell,direction,definition,true)
	face.dropped=false
	face.edge=0
	face.moss=false
	var upright: bool=FRAMES[direction][1].y==1
	face.ao=[0.8,0.97,0.8,0.97] if upright else [0.8,0.8,0.97,0.97]
	var bottom:=1.0-Vertex.PATH_SURFACE_DROP
	var corners:=[Vector2(bottom,0),Vector2(1,0),Vector2(1,1),Vector2(bottom,1)] if upright else [Vector2(0,bottom),Vector2(1,bottom),Vector2(1,1),Vector2(0,1)]
	var quad:=[]
	for corner in corners:
		var index:=Vertex.emit(self,face,corner.x,corner.y)
		normals[index]=((Vector3(NORMALS[direction])*0.75+Vector3.UP).normalized()*127).round()/127
		quad.append(index)
	triangle(quad[0],quad[1],quad[2])
	triangle(quad[0],quad[2],quad[3])

func triangle(a: int,b: int,c: int) -> void:
	if a!=b and b!=c and a!=c: indices.append_array(PackedInt32Array([a,c,b]))

func packed_arrays() -> Array:
	if points.is_empty(): return []
	var arrays:=[]
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX]=points
	arrays[Mesh.ARRAY_NORMAL]=normals
	arrays[Mesh.ARRAY_TEX_UV]=uv
	arrays[Mesh.ARRAY_COLOR]=colors
	arrays[Mesh.ARRAY_CUSTOM0]=data
	arrays[Mesh.ARRAY_CUSTOM1]=grass
	arrays[Mesh.ARRAY_INDEX]=indices
	return arrays

func build() -> ArrayMesh:
	var result:=ArrayMesh.new()
	var arrays:=packed_arrays()
	if arrays.is_empty(): return result
	var flags: int=(Mesh.ARRAY_CUSTOM_RGBA_FLOAT << Mesh.ARRAY_FORMAT_CUSTOM0_SHIFT)|(Mesh.ARRAY_CUSTOM_RGBA_FLOAT << Mesh.ARRAY_FORMAT_CUSTOM1_SHIFT)
	result.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays,[],{},flags)
	return result
