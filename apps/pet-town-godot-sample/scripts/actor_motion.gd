extends RefCounted
## Source Pet Town movement constants, requested through the shared force-driven body contract.
const SwimInput = preload("res://scripts/water/swim_input.gd")
const STEP_HEIGHT := 0.3
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

func step(actor: RigidBody3D, delta: float) -> void:
	time += delta
	var focused: Control = actor.get_viewport().gui_get_focus_owner()
	var input_enabled: bool = actor.enabled and not (focused is LineEdit or focused is TextEdit)
	var held: bool = SwimInput.rising() and input_enabled
	var dive: bool = SwimInput.descending() and input_enabled
	var water: float = actor.world.water_at(actor.position) if actor.world else -1000
	var depth := water-actor.position.y
	if is_inf(depth): depth=0
	if not swimming and depth>0.95:
		swimming=true
		actor.velocity.y*=0.3
	elif swimming and (depth<0.6 or (actor.is_grounded() and depth<0.77)):
		swimming=false
		diving=false
		dive_target=null
	if actor.is_grounded() or step_time>0:
		coyote=0.12
		air_time=0
		flutter_used=false
	else:
		coyote=maxf(0,coyote-delta)
		air_time+=delta
	if held and Input.is_action_just_pressed("jump"): jump_buffer=0.16
	else: jump_buffer=maxf(0,jump_buffer-delta)
	var surface_jump := swimming and depth<1.17 and not diving and not dive
	if jump_buffer>0 and ((not swimming and coyote>0) or surface_jump):
		actor.queue_jump(10.5 if swimming else 11.6)
		swimming=false
		coyote=0
		jump_buffer=0
	if swimming:
		gliding=false
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
		if not actor.get_meta("battle_avatar", false) and not gliding and held and actor.velocity.y<0.8 and air_time>0.16 and actor.position.y-ground>1.25:
			gliding=true
			if not flutter_used:
				actor.queue_jump(maxf(actor.velocity.y,3.2))
				flutter_used=true
		if not held or actor.is_grounded(): gliding=false
		if gliding:
			actor.velocity.y=lerpf(actor.velocity.y,-1.7,1-exp(-9*delta))
		else:
			var gravity := 34.0*(3.0 if actor.velocity.y>0 and not held else (1.65 if actor.velocity.y<=0 else 1.0))
			actor.velocity.y=maxf(-30,actor.velocity.y-gravity*delta)
	var motion := Input.get_vector("move_left","move_right","move_forward","move_back") if input_enabled else Vector2.ZERO
	var direction := Vector3(motion.x,0,motion.y).rotated(Vector3.UP,actor.view.rotation.y if actor.view else 0)
	var run := Input.is_action_pressed("run") and input_enabled
	var speed := (4.4 if run else 3.0) if swimming else (5.6 if gliding else (7.6 if run else 4.4))
	if not swimming and actor.is_grounded() and depth>0.25: speed*=0.78
	var acceleration := 5.0 if swimming else (18.0 if motion.length()>0.05 else 22.0)
	if not actor.is_grounded() and not swimming:
		acceleration=3.2 if gliding else 5.0
		if motion.length()<0.05: acceleration*=0.25
	var preferred: Vector3 = actor.steer(direction * speed, swimming or gliding)
	actor.medium = "water" if swimming else ("air" if gliding else "land")
	actor.velocity.x=lerpf(actor.velocity.x,preferred.x,1-exp(-acceleration*delta))
	actor.velocity.z=lerpf(actor.velocity.z,preferred.z,1-exp(-acceleration*delta))
	if direction.length_squared()>0.01:
		actor.visual.rotation.y=lerp_angle(actor.visual.rotation.y,atan2(direction.x,direction.z),1-exp(-14*delta))
	try_step(actor,delta)

func try_step(actor: RigidBody3D, delta: float) -> void:
	if continue_step(actor, delta): return
	if (not actor.is_grounded() and coyote<=0) or swimming or actor.velocity.y>0: return
	var motion := Vector3(actor.velocity.x,0,actor.velocity.z)*delta
	if motion.length_squared()<0.00001: return
	var obstacle: PhysicsTestMotionResult3D = actor.sweep(actor.global_transform,motion,true)
	if not obstacle: return
	# Slopes belong to physical support; only static ledges need the step lift.
	if obstacle.get_collision_normal().y>cos(actor.floor_max_angle): return
	var high := actor.global_transform
	var lift := STEP_HEIGHT + 0.02
	if actor.sweep(high,Vector3.UP*lift,true): return
	high.origin.y+=lift
	# The capsule must probe beyond its rounded toe before testing the landing.
	# A single frame's travel hits the ledge corner with a wall-like normal.
	var support_motion := motion.normalized()*maxf(motion.length(),0.34)
	if actor.sweep(high,support_motion,true): return
	high.origin+=support_motion
	var contact: PhysicsTestMotionResult3D = actor.sweep(high,Vector3.DOWN*(lift+0.02),true)
	if contact and contact.get_collision_normal().y>cos(actor.floor_max_angle):
		var rise := lift+contact.get_travel().y
		# Authored shallow stairs get assistance; full blocks require a jump.
		# Allow the sweep's collision clearance at the step-height boundary.
		if rise>0.03 and rise<=STEP_HEIGHT+0.002:
			var landing := actor.position + Vector3.UP * rise
			if not actor.clear_at(landing): return
			actor.relocate(landing, Vector3(actor.velocity.x, 0, actor.velocity.z) + actor.support_velocity)
			step_direction=motion.normalized()
			step_floor=landing.y
			step_time=clampf(support_motion.length()/Vector2(actor.velocity.x,actor.velocity.z).length()+0.05,0.08,0.3)
			step_snap=actor.floor_snap_length
			actor.floor_snap_length=0
			actor.velocity.y=0

func continue_step(actor: RigidBody3D, delta: float) -> bool:
	if step_time<=0: return false
	step_time=maxf(0,step_time-delta)
	var horizontal:=Vector3(actor.velocity.x,0,actor.velocity.z)
	var settled: bool=actor.is_grounded() and absf(actor.position.y-step_floor)<0.03
	var forward:=horizontal.length()>0.1 and horizontal.normalized().dot(step_direction)>0.5
	if step_time<=0 or settled or not forward or swimming or actor.velocity.y>0:
		actor.floor_snap_length=step_snap
		step_time=0
		return false
	# The landing probe is ahead of the capsule. Keep its feet at that height
	# until normal horizontal movement reaches support, without a forward teleport.
	actor.velocity.y=0
	return true
