import * as THREE from "../../pet-town-3d/node_modules/three/build/three.module.js";
import { playerCharacter } from "../../pet-town-3d/src/player/character/player-character.js";
import { cloneExportTree } from "./export-materials.js";

function createRig() {
  const character = new playerCharacter();
  let index = 0;
  character.root.traverse((node) => {
    node.name = `${node.name || (node.isMesh ? "mesh" : "joint")}_${index++}`;
  });
  return character;
}

function frame(speed, run, airborne = false) {
  return { speed, runAmt: run, onGround: !airborne, vy: airborne ? 3 : 0,
    swimming: false, gliding: false, facing: 0, pos: new THREE.Vector3(),
    look: null, camPos: new THREE.Vector3(0, 2, 5), turnAhead: 0 };
}

export function exportCharacter() {
  const base = createRig();
  base.update(1 / 60, frame(0, 0));
  // Include hidden original leaf/face parts; glTF animates visibility via scale.
  const hidden = new Set();
  base.root.traverse(node => { if (!node.visible) hidden.add(node.name); node.visible = true; });
  const characterRoot = cloneExportTree(base.root);
  characterRoot.traverse(node => { if (hidden.has(node.name)) node.scale.setScalar(0.00001); });
  const root = new THREE.Group();
  root.name = "OriginalPip";
  root.add(characterRoot);
  root.position.set(0, 0, 0);
  root.quaternion.identity();
  const available = new Set();
  root.traverse((node) => available.add(node.name));
  const animations = [];
  for (const [name, speed, run, duration] of [
    ["idle", 0, 0, 2], ["walk", 2.2, 0, 0.92 / 2.2],
    ["run", 5.2, 1, 1.56 / 5.2], ["jump", 2.2, 0, 0.8],
    ["glide", 4, 0, 2], ["swim", 2.2, 0, Math.PI * 2 / (3.2 + 2.2 * 1.6)],
  ]) {
    const rig = createRig();
    const pose = frame(speed, run, ["jump", "glide", "swim"].includes(name));
    pose.gliding = name === "glide";
    pose.swimming = name === "swim";
    if (name === "glide") { rig.onGlide(); pose.vy = -1.5; }
    if (name === "swim") pose.vy = 0;
    for (let i = 0; i < 90; i++) rig.update(1 / 60, pose);
    if (name === "jump") rig.onJump();
    const nodes = [];
    rig.root.traverse((node) => {
      if (available.has(node.name))
        nodes.push({ node, position: [], quaternion: [], scale: [] });
    });
    const count = Math.max(12, Math.ceil(duration * 30));
    const times = [];
    for (let i = 0; i <= count; i++) {
      times.push(i * duration / count);
      if (name === "jump") pose.vy = 7 - 14 * i / count;
      rig.update(duration / count, pose);
      rig.root.position.y = rig.root.userData.swimLift ?? 0;
      for (const sample of nodes)
        for (const key of ["position", "quaternion", "scale"])
          sample[key].push(...(key === "scale" && !sample.node.visible
            ? [0.00001, 0.00001, 0.00001] : sample.node[key].toArray()));
    }
    const tracks = [];
    for (const sample of nodes) {
      for (const key of ["position", "quaternion", "scale"]) {
        const values = sample[key];
        const size = key === "quaternion" ? 4 : 3;
        // Constant tracks reset leaf/face visibility when leaving another pose.
        if (name !== "jump") values.splice(values.length - size, size, ...values.slice(0, size));
        const Track = key === "quaternion" ? THREE.QuaternionKeyframeTrack : THREE.VectorKeyframeTrack;
        tracks.push(new Track(`${sample.node.name}.${key}`, times, values));
      }
    }
    animations.push(new THREE.AnimationClip(name, duration, tracks));
  }
  return { root, animations, metadata: { source: "Original Pip playerCharacter constructor",
    animations: animations.map(({ name, duration }) => ({ name, duration })) } };
}
