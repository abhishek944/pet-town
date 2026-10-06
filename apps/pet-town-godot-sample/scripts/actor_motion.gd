extends RefCounted
## Source Pet Town movement constants, integrated by native CharacterBody3D.
var coyote := 0.0
var jump_buffer := 0.0
var air_time := 0.0
var gliding := false
var swimming := false
var flutter_used := false
var diving := false
var dive_target = null
var time := 0.0
var step_time := 0.0
var step_direction := Vector3.ZERO
var step_floor := 0.0
var step_snap := 0.0

func step(actor: CharacterBody3D, delta: float) -> void:
	time += delta
	var focused: Control = actor.get_viewport().gui_get_focus_owner()
	var input_enabled: bool = actor.enabled and not (focused is LineEdit or focused is TextEdit)
	var held: bool = Input.is_action_pressed("jump") and input_enabled
	var water: float = actor.world.water_at(actor.position) if actor.world else -1000
	var depth := water-actor.position.y
	if is_inf(depth): depth=0
	if not swimming and depth>0.95:
		swimming=true
		actor.velocity.y*=0.3
	elif swimming and (depth<0.6 or (actor.is_on_floor() and depth<0.77)):
		swimming=false
		diving=false
		dive_target=null
	if actor.is_on_floor() or step_time>0:
		coyote=0.12
		air_time=0
		flutter_used=false
	else:
		coyote=maxf(0,coyote-delta)
		air_time+=delta
	if input_enabled and Input.is_action_just_pressed("jump"): jump_buffer=0.16
	else: jump_buffer=maxf(0,jump_buffer-delta)
	var surface_jump := swimming and depth<1.17 and not diving and not Input.is_action_pressed("dive")
	if jump_buffer>0 and ((not swimming and coyote>0) or surface_jump):
		actor.velocity.y=10.5 if swimming else 11.6
		swimming=false
		coyote=0
		jump_buffer=0
	if swimming:
		gliding=false
		var dive: bool = Input.is_action_pressed("dive") and input_enabled and not Input.is_physical_key_pressed(KEY_ALT) and not Input.is_physical_key_pressed(KEY_META)
		var surface_target := water - 0.82
		var ascending := held and not dive
		if dive and dive_target == null: dive_target = actor.position.y
		if dive_target != null:
			dive_target = clampf(float(dive_target), actor.position.y - 0.35, actor.position.y + 0.35)
			var direction := -1.0 if dive else (1.0 if ascending else 0.0)
			dive_target = minf(surface_target, float(dive_target) + direction * (4.0 if Input.is_action_pressed("run") and input_enabled else 2.8) * delta)
			jump_buffer = 0
			if ascending and actor.position.y >= surface_target - 0.08: dive_target = null
		diving = dive_target != null or actor.position.y < surface_target - 0.4
		var target: float = float(dive_target) if dive_target != null else surface_target + sin(time * 2.2) * 0.035
		actor.velocity.y += ((target - actor.position.y) * 55 - actor.velocity.y * 9) * delta
	else:
		var ground: float = actor.world.ground_at(actor.position) if actor.world else 0.0
		if not gliding and held and actor.velocity.y<0.8 and air_time>0.16 and actor.position.y-ground>1.25:
			gliding=true
			if not flutter_used:
				actor.velocity.y=maxf(actor.velocity.y,3.2)
				flutter_used=true
		if not held or actor.is_on_floor(): gliding=false
		if gliding:
			actor.velocity.y=lerpf(actor.velocity.y,-1.7,1-exp(-9*delta))
		else:
			var gravity := 34.0*(3.0 if actor.velocity.y>0 and not held else (1.65 if actor.velocity.y<=0 else 1.0))
			actor.velocity.y=maxf(-30,actor.velocity.y-gravity*delta)
	var motion := Input.get_vector("move_left","move_right","move_forward","move_back") if input_enabled else Vector2.ZERO
	var direction := Vector3(motion.x,0,motion.y).rotated(Vector3.UP,actor.view.rotation.y if actor.view else 0)
	var run := Input.is_action_pressed("run") and input_enabled
	var speed := (4.4 if run else 3.0) if swimming else (5.6 if gliding else (7.6 if run else 4.4))
	if not swimming and actor.is_on_floor() and depth>0.25: speed*=0.78
	var acceleration := 5.0 if swimming else (18.0 if motion.length()>0.05 else 22.0)
	if not actor.is_on_floor() and not swimming:
		acceleration=3.2 if gliding else 5.0
		if motion.length()<0.05: acceleration*=0.25
	actor.velocity.x=lerpf(actor.velocity.x,direction.x*speed,1-exp(-acceleration*delta))
	actor.velocity.z=lerpf(actor.velocity.z,direction.z*speed,1-exp(-acceleration*delta))
	if direction.length_squared()>0.01:
		actor.visual.rotation.y=lerp_angle(actor.visual.rotation.y,atan2(direction.x,direction.z),1-exp(-14*delta))
	try_step(actor,delta)

func try_step(actor: CharacterBody3D, delta: float) -> void:
	if continue_step(actor, delta): return
	if (not actor.is_on_floor() and coyote<=0) or swimming or actor.velocity.y>0: return
	var motion := Vector3(actor.velocity.x,0,actor.velocity.z)*delta
	if motion.length_squared()<0.00001: return
	var obstacle := KinematicCollision3D.new()
	if not actor.test_move(actor.global_transform,motion,obstacle): return
	# Walkable slopes belong to move_and_slide, not the ahead-of-body ledge lift.
	if obstacle.get_normal().y>cos(actor.floor_max_angle): return
	var high := actor.global_transform
	if actor.test_move(high,Vector3.UP*1.02): return
	high.origin.y+=1.02
	# The capsule must probe beyond its rounded toe before testing the landing.
	# A single frame's travel hits the ledge corner with a wall-like normal.
	var support_motion := motion.normalized()*maxf(motion.length(),0.34)
	if actor.test_move(high,support_motion): return
	high.origin+=support_motion
	var contact := KinematicCollision3D.new()
	if actor.test_move(high,Vector3.DOWN*1.04,contact) and contact.get_normal().y>cos(actor.floor_max_angle):
		var rise := 1.02+contact.get_travel().y
		if rise>0.03 and rise<=1.01:
			actor.position.y+=rise
			step_direction=motion.normalized()
			step_floor=actor.position.y
			step_time=clampf(support_motion.length()/Vector2(actor.velocity.x,actor.velocity.z).length()+0.05,0.08,0.3)
			step_snap=actor.floor_snap_length
			actor.floor_snap_length=0
			actor.velocity.y=0

func continue_step(actor: CharacterBody3D, delta: float) -> bool:
	if step_time<=0: return false
	step_time=maxf(0,step_time-delta)
	var horizontal:=Vector3(actor.velocity.x,0,actor.velocity.z)
	var settled:=actor.is_on_floor() and absf(actor.position.y-step_floor)<0.03
	var forward:=horizontal.length()>0.1 and horizontal.normalized().dot(step_direction)>0.5
	if step_time<=0 or settled or not forward or swimming or actor.velocity.y>0:
		actor.floor_snap_length=step_snap
		step_time=0
		return false
	# The landing probe is ahead of the capsule. Keep its feet at that height
	# until normal horizontal movement reaches support, without a forward teleport.
	actor.velocity.y=0
	return true
