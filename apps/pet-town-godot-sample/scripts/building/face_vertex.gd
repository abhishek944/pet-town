extends RefCounted

static func emit(mesh: RefCounted,face: Dictionary,u: float,v: float) -> int:
	var state: RefCounted=mesh.state
	var local: Vector3=face.frame[0]+face.frame[1]*u+face.frame[2]*v
	var bevel: Array=mesh.bevel.resolve(local)
	var original:=Vector3(face.cell)+local
	var point: Vector3=original+bevel[0]
	var normal: Vector3=bevel[1] if bevel[2]>0 else Vector3(mesh.NORMALS[face.direction])
	var highlight:=minf(1.0,(1.0-normal.dot(Vector3(mesh.NORMALS[face.direction])))*3.4) if bevel[2]>0 else 0.0
	normal=(normal*127.0).round()/127.0
	if face.dropped: point.y-=0.085
	if original.y>7.000001 and original.y<=8.000001:
		var drop: float=state.shore(original.x,original.z)
		if drop>0:
			point.y=7+(point.y-7)*(1-0.55*drop)
			if normal.y>0.2:
				var dx: float=(state.shore(original.x+0.05,original.z)-state.shore(original.x-0.05,original.z))/0.1
				var dz: float=(state.shore(original.x,original.z+0.05)-state.shore(original.x,original.z-0.05))/0.1
				normal=Vector3(normal.x+0.55*dx*normal.y*(original.y-7),normal.y,normal.z+0.55*dz*normal.y*(original.y-7)).normalized()
	var axes: Array=mesh.UV_AXES[face.direction]
	var tex:=Vector2(local[axes[0]],local[axes[1]])
	var ao: float=lerpf(lerpf(face.ao[0],face.ao[1],u),lerpf(face.ao[2],face.ao[3],u),v)*(0.55 if face.direction==3 else 1.0)
	var wall: Vector2=Vector2.ZERO if face.direction in [2,3] else state.wall(original.x,original.z)
	var height: float=wall.y-wall.x
	var fraction:=clampf((original.y-wall.x)/height,0,1) if height>0 else 1.0
	var color: Vector3=state.tint.sample(face.definition.get("tint","custom"),Vector3(original.x,point.y,original.z),face.direction,face.variation,state.water,fraction,height)
	var grass:=Vector3.ZERO
	if face.edge>0:
		grass=state.tint.sample("grass",original,face.direction,face.variation,state.water)*127.5
	elif face.moss and height>0:
		grass.x=clampf(state.tint.moss(original,wall),0,1)*255
	var index: int=mesh.points.size()
	mesh.points.append(point)
	mesh.normals.append((normal*127.0).round()/127.0)
	mesh.uv.append((tex*65535.0).round()/65535.0)
	mesh.colors.append(Color(minf(255,roundf(color.x*127.5))/255.0,minf(255,roundf(color.y*127.5))/255.0,minf(255,roundf(color.z*127.5))/255.0,roundf(highlight*255)/255.0))
	mesh.data.append_array(PackedFloat32Array([face.layer,face.overlay,roundf(minf(1,ao)*255),face.direction+posmod(face.cell[axes[0]],2)*8+posmod(face.cell[axes[1]],2)*16]))
	mesh.grass.append_array(PackedFloat32Array([minf(255,roundf(grass.x)),minf(255,roundf(grass.y)),minf(255,roundf(grass.z)),face.edge]))
	return index
