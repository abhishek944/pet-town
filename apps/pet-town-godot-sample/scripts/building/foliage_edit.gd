extends RefCounted
# Index source instance origins once; edits touch only plants anchored in that column.
# Wind/card width may cross columns, but the original hiding rule uses the origin.
var columns: Dictionary={}
var store: RefCounted

func setup(vegetation: Node3D,voxel_store: RefCounted) -> void:
	store=voxel_store
	for node in vegetation.get_children():
		if not node is MultiMeshInstance3D: continue
		var name:=str(node.name)
		if not (name.begins_with("grass") or name.begins_with("tall") or name.begins_with("fl_") or name.begins_with("clover") or name.begins_with("fern")): continue
		var multi: MultiMesh=node.multimesh
		for i in multi.instance_count:
			var original:=multi.get_instance_transform(i)
			var point: Vector3=node.transform*original.origin
			var key:=Vector2i(floori(point.x),floori(point.z))
			if not columns.has(key): columns[key]=[]
			columns[key].append([multi,i,original,point.y])

func refresh(cell: Vector3i) -> void:
	var ranges: Dictionary={}
	for entry in columns.get(Vector2i(cell.x,cell.z),[]):
		var range_key:=Vector2i(maxi(0,floori(entry[3])-1),mini(store.height,ceili(entry[3])+2))
		if not ranges.has(range_key):
			var blocked:=false
			for y in range(range_key.x,range_key.y):
				var sample:=Vector3i(cell.x,y,cell.z)
				if store.get_id(sample)!=store.get_id(sample,true): blocked=true
			ranges[range_key]=blocked
		var transform: Transform3D=entry[2]
		if ranges[range_key]: transform.basis=Basis.from_scale(Vector3.ONE*0.00001)
		entry[0].set_instance_transform(entry[1],transform)
