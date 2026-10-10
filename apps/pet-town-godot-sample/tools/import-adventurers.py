"""Run with Blender --background --python this_file -- /path/to/selected-adventurers.

Bake the five CC0 KayKit rigs for native companions. Keep author locomotion;
add gentle glide/swim loops for Pet Town's existing movement states.
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[sys.argv.index("--") + 1]).resolve()
OUTPUT = ROOT / "assets"
NAMES = ["Knight", "Mage", "Barbarian", "Rogue", "Ranger"]
CLIPS = {"idle": "Idle_A", "walk": "Walking_A", "run": "Running_A", "jump": "Jump_Full_Long"}
SCALE = 0.72


def set_action(rig, action):
    rig.animation_data_create()
    rig.animation_data.action = action
    rig.animation_data.action_slot = action.slots[0]


def fcurves(action):
    return action.layers[0].strips[0].channelbags[0].fcurves


def water_air_loop(rig, idle, name):
    """Key every bone from an idle pose; keep root travel in the physics owner."""
    set_action(rig, idle)
    bpy.context.scene.frame_set(0)
    rest = {bone.name: (bone.location.copy(), bone.rotation_quaternion.copy(), bone.scale.copy()) for bone in rig.pose.bones}
    action = bpy.data.actions.new(name)
    action.slots.new(id_type="OBJECT", name=rig.name)
    set_action(rig, action)
    for frame in range(49):
        phase = math.tau * frame / 48
        for bone in rig.pose.bones:
            location, rotation, scale = rest[bone.name]
            bone.location, bone.rotation_quaternion, bone.scale = location, rotation, scale
            bone.rotation_mode = "QUATERNION"
            turn = Vector()
            side = 1 if bone.name.endswith(".l") else -1
            if bone.name == "root" and name == "swim":
                turn.x = math.radians(65)
            elif bone.name.startswith("upperarm"):
                # Local Z opens the shoulder; local X supplies a soft paddle.
                turn.z = side * (0.85 if name == "glide" else 0.45)
                turn.x = math.sin(phase + (0 if side == 1 else math.pi)) * (0.06 if name == "glide" else 0.5)
            elif bone.name.startswith("upperleg"):
                turn.x = math.sin(phase + (0 if side == 1 else math.pi)) * (0.08 if name == "glide" else 0.22)
            elif bone.name.startswith("lowerleg"):
                turn.x = 0.12 + (math.sin(phase) * 0.06 if name == "swim" else 0)
            bone.rotation_quaternion = rotation @ Euler(turn, "XYZ").to_quaternion()
            for prop in ["location", "rotation_quaternion", "scale"]:
                bone.keyframe_insert(prop, frame=frame, group=bone.name)
    for curve in fcurves(action):
        for key in curve.keyframe_points:
            key.interpolation = "LINEAR"
    return action


def prepare_actions():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 30
    for path in sorted((SOURCE / "animations").glob("*.glb")):
        bpy.ops.import_scene.gltf(filepath=str(path))
    rig = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
    actions = {}
    for name, source in CLIPS.items():
        original = bpy.data.actions.get(source)
        if original is None:
            raise ValueError(f"Missing author clip: {source}")
        action = original.copy()
        action.name = name
        action.use_fake_user = True
        actions[name] = action
    for name in ["glide", "swim"]:
        actions[name] = water_air_loop(rig, actions["idle"], name)
        actions[name].use_fake_user = True
    for action in list(bpy.data.actions):
        if action not in actions.values():
            bpy.data.actions.remove(action)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    return actions


def export_character(name, actions):
    bpy.ops.import_scene.gltf(filepath=str(SOURCE / "characters" / f"{name}.glb"))
    objects = list(bpy.context.scene.objects)
    rig = next(obj for obj in objects if obj.type == "ARMATURE")
    original_roots = [obj for obj in objects if obj.parent is None]
    root = bpy.data.objects.new(f"Companion_{name}", None)
    bpy.context.collection.objects.link(root)
    root.scale = (SCALE,) * 3
    for obj in original_roots:
        obj.parent = root
    rig.animation_data_clear()
    rig.animation_data_create()
    for clip, action in actions.items():
        track = rig.animation_data.nla_tracks.new()
        track.name = clip
        strip = track.strips.new(clip, 0, action)
        strip.action_slot = action.slots[0]
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT / f"companion-{name.lower()}.glb"),
        export_format="GLB", use_selection=True, export_animations=True,
        export_animation_mode="NLA_TRACKS", export_anim_slide_to_zero=True,
        export_force_sampling=True, export_frame_step=1,
    )
    # Studio portrait uses the same normalized rig in the actual idle pose.
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    set_action(rig, actions["idle"])
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()
    points = [obj.matrix_world @ Vector(v) for obj in objects if obj.type == "MESH" and obj.visible_get() for v in obj.bound_box]
    low = Vector([min(v[i] for v in points) for i in range(3)])
    high = Vector([max(v[i] for v in points) for i in range(3)])
    center = (low + high) / 2
    span = max(high - low)
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new("Portrait studio")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.78, 0.84, 0.72, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.7
    for position, power in [((3, -4, 6), 450), ((-3, -1, 3), 200)]:
        bpy.ops.object.light_add(type="AREA", location=center + Vector(position))
        light = bpy.context.object
        light.data.energy, light.data.size = power, 4
        light.rotation_euler = (center - light.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.camera_add(location=center + Vector((1.7, -4, 1.3)))
    camera = bpy.context.object
    camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type, camera.data.ortho_scale = "ORTHO", span * 1.35
    scene.camera, scene.render.engine = camera, "CYCLES"
    scene.cycles.samples, scene.cycles.use_denoising = 16, True
    scene.render.resolution_x, scene.render.resolution_y = 256, 256
    scene.render.resolution_percentage, scene.render.film_transparent = 100, True
    scene.view_settings.view_transform = "Standard"
    scene.render.filepath = str(OUTPUT / f"companion-{name.lower()}.png")
    bpy.ops.render.render(write_still=True)
    print(json.dumps({"name": name, "idleBounds": [list(low), list(high)]}), flush=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


if __name__ == "__main__":
    clips = prepare_actions()
    for character in NAMES:
        export_character(character, clips)
