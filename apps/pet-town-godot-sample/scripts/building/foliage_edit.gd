extends RefCounted
# Index source instance origins once; edits touch only plants anchored in that column.
# Wind/card width may cross columns, but the original hiding rule uses the origin.
var columns: Dictionary={}
var store: RefCounted

func setup(vegetation: Node3D,voxel_store: RefCounted,budget: RefCounted = null) -> void:
	store=voxel_store
	# One anchor per plant, shared by all LODs; field variants never depend on node names.
	for group in vegetation.editable_groups:
		for anchor in group.anchors:
			var key: Vector2i=anchor[0]
			if not columns.has(key): columns[key]=[]
			columns[key].append([group.meshes,anchor[1],anchor[2],anchor[3]])
			if budget and int(anchor[1]) % 256 == 0: await budget.checkpoint()

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
		for multi in entry[0]: multi.set_instance_transform(entry[1],transform)
