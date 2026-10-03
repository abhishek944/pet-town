extends "res://scripts/actor.gd"
var entry: Dictionary = {}
var controlled := false
var pet_id := "maple"
var destination := Vector3.ZERO
var roam_time := 0.0
var random := RandomNumberGenerator.new()
var paused := false
var presentation: Node
var elapsed:=0.0

func _ready() -> void:
	super._ready()
	collision_layer=4
	collision_mask=5
	random.seed = hash(str(entry.get("id","")))
	set_entry(entry)
	set_pet(pet_id)

func set_entry(data: Dictionary) -> void:
	entry = data

func set_pet(id: String) -> void:
	var path := "res://assets/companion-%s.glb" % id
	if not ResourceLoader.exists(path): return
	pet_id = id
	if is_instance_valid(presentation):
		remove_child(presentation)
		presentation.queue_free()
	var previous: Dictionary={}
	var previous_clip:=""
	var previous_time:=0.0
	if is_instance_valid(animator):
		for property in ["phase","amount","speed","grounded","vertical","gliding","swimming","diving"]: previous[property]=animator.get(property)
		if animator.player:
			previous_clip=animator.player.current_animation
			if not previous_clip.is_empty(): previous_time=animator.player.current_animation_position
	for child in visual.get_children():
		visual.remove_child(child)
		child.queue_free()
	var model = load(path).instantiate()
	visual.add_child(model)
	preload("res://scripts/asset_style.gd").apply(model)
	animator = preload("res://scripts/actor_animation.gd").new()
	visual.add_child(animator)
	animator.configure(model)
	for property in previous: animator.set(property,previous[property])
	if animator.player and animator.player.has_animation(previous_clip):
		animator.player.play(previous_clip)
		animator.player.seek(previous_time,true)
	var metadata_path:="res://assets/companion-manifest.json"
	if FileAccess.file_exists(metadata_path):
		var manifest=JSON.parse_string(FileAccess.get_file_as_string(metadata_path))
		if manifest is Dictionary:
			var definitions: Array=manifest.get("catalog",[]).duplicate()
			definitions.append(manifest.get("mayor",{}))
			for definition in definitions:
				if definition.get("id","")==id:
					presentation=preload("presentation.gd").new()
					add_child(presentation)
					presentation.setup(self,model,definition.get("facial",{}))
					break

func _physics_process(delta: float) -> void:
	elapsed+=delta
	if controlled:
		super._physics_process(delta)
	else:
		enabled = false
		if ocean and ocean.before_body_step(self,delta):
			if animator: animator.set_motion(0,is_on_floor(),0)
			return
		if spawn_pending:
			respawn()
			spawn_pending = false
		motion.step(self,delta)
		var conversation: bool=entry.get("source","")=="mayor" and entry.get("conversationActive",false)
		roam_time -= delta
		if not paused and not conversation and (roam_time <= 0 or position.distance_to(destination)<0.8): _choose_target()
		var direction := destination-position
		direction.y = 0
		if paused or conversation or direction.length()<0.7: direction = Vector3.ZERO
		else: direction = direction.normalized()
		if conversation:
			velocity.x=0
			velocity.z=0
			var toward_camera: Vector3=view.camera.global_position-global_position if view else Vector3.ZERO
			visual.rotation.y=lerp_angle(visual.rotation.y,atan2(toward_camera.x,toward_camera.z),1-exp(-12*delta))
		velocity.x = move_toward(velocity.x,direction.x*1.672,delta*8)
		velocity.z = move_toward(velocity.z,direction.z*1.672,delta*8)
		if test_move(global_transform,Vector3(velocity.x,0,velocity.z)*delta): roam_time=0
		move_and_slide()
		if ocean: ocean.after_body_step(self)
		if direction.length_squared()>0:
			visual.rotation.y=lerp_angle(visual.rotation.y,atan2(direction.x,direction.z),1-exp(-8*delta))
		if animator:
			animator.set_state(motion.gliding,motion.swimming,motion.diving)
			animator.set_motion(Vector2(velocity.x,velocity.z).length(),is_on_floor(),velocity.y)
		if position.y < -10 or not world.contains(position): respawn()

func _choose_target() -> void:
	roam_time=random.randf_range(3,7)
	destination=position
	for attempt in range(24):
		var candidate := position+Vector3(random.randf_range(-5,5),0,random.randf_range(-5,5))
		if not world.contains(candidate): continue
		var height: float=world.ground_at(candidate)
		if absf(height-position.y)>1.02 or world.water_at(candidate)>height+0.1: continue
		candidate.y=height+0.05
		var sweep := candidate-position
		sweep.y=0
		if test_move(global_transform,sweep): continue
		destination=candidate
		break
