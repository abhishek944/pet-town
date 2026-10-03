extends RefCounted
# Worker-owned voxel snapshot and packed arrays only: never Nodes, rendering or physics.
const FaceMesh=preload("face_mesh.gd")
const FaceState=preload("face_state.gd")
var snapshot: RefCounted
var changed: Array=[]
var state: RefCounted
var result: Dictionary={}

func configure(source: RefCounted,cells: Array,manifest: Dictionary) -> void:
	snapshot=source
	changed=cells.duplicate()
	state=FaceState.new()
	state.store=snapshot
	state.water=float(manifest.waterLevel)
	state.flat_below=floori(state.water-1.2)
	state.half=int(manifest.sourceBounds.maxX)
	state.fringe=int(manifest.terrain.layerIds.FRINGE)

func run() -> void:
	var started:=Time.get_ticks_usec()
	var dirty: Dictionary={}
	var replaced: Dictionary={}
	for cell in changed:
		for z in range(-3,4):
			for x in range(-3,4): dirty[Vector2i(floori((cell.x+x)/16.0),floori((cell.z+z)/16.0))]=true
	for cell in snapshot.edits:
		for z in range(-3,4):
			for y in range(-3,4):
				for x in range(-3,4):
					var target: Vector3i=cell+Vector3i(x,y,z)
					if snapshot.contains(target): replaced[target]=true
	var groups: Dictionary={}
	for key in dirty: groups[key]=build_chunk(key,replaced)
	result={"groups":groups,"replaced":replaced,"geometry_us":Time.get_ticks_usec()-started}

func build_chunk(key: Vector2i,replaced: Dictionary) -> Array:
	var solid:=FaceMesh.new()
	var glass:=FaceMesh.new()
	var lip:=FaceMesh.new()
	for builder in [solid,glass,lip]: builder.state=state
	for cell in replaced:
		if Vector2i(floori(cell.x/16.0),floori(cell.z/16.0))!=key: continue
		var id: int=snapshot.get_id(cell)
		if id==0: continue
		var builder: RefCounted=glass if id==snapshot.GLASS else solid
		var exposed: bool=not state.solid(cell+Vector3i.UP)
		var definition: Dictionary=snapshot.definitions[id]
		for face in 6:
			var neighbor: Vector3i=cell+FaceMesh.NORMALS[face]
			if state.solid(neighbor):
				if face not in [2,3] and exposed and not state.dropped(cell) and state.dropped(neighbor): builder.add_riser(cell,face,definition)
				continue
			builder.add_face(cell,face,definition,Color.WHITE,exposed)
			if face not in [2,3] and exposed and int(definition.get("exposedSideOver",-1))==state.fringe and cell.y+1>state.water+0.3:
				preload("grass_lip.gd").write(lip,cell,face)
	return [solid.packed_arrays(),glass.packed_arrays(),lip.packed_arrays()]

static func copy_store(source: RefCounted) -> RefCounted:
	var copy:=preload("voxel_store.gd").new()
	copy.bounds=source.bounds.duplicate()
	copy.width=source.width
	copy.depth=source.depth
	copy.height=source.height
	copy.original=source.original
	copy.cells=source.cells.duplicate()
	copy.edits=source.edits.duplicate()
	copy.definitions=source.definitions
	copy.signature=source.signature
	copy.spawn=source.spawn.duplicate()
	copy.migrated=source.migrated
	copy.palette=source.palette.duplicate()
	copy.save_path=source.save_path
	return copy
