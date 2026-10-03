import * as THREE from "../../pet-town-3d/node_modules/three/build/three.module.js";
import { createAgentVisual } from "../../pet-town-3d/src/pet-town/agents/character-visual.js";
import { createPetCharacter } from "../../pet-town-3d/src/pet-town/pets/character.js";
import { cloneExportTree } from "./export-materials.js";

const clips = [
  ["idle", 0, 0, 2],
  ["walk", 2.2, 0, 0.92 / 2.2],
  ["run", 5.2, 1, 1.56 / 5.2],
  ["jump", 2.2, 0, 0.8],
  ["glide", 4, 0, 2],
  ["swim", 2.2, 0, (Math.PI * 2) / (3.2 + 2.2 * 1.6)],
];

function createRig(id) {
  const mayor = id === "mayor";
  const character = mayor ? null : createPetCharacter(id);
  const visual = mayor
    ? createAgentVisual({ id: "pet-town-mayor", label: "Mayor", isMayor: true }, null)
    : { character, root: character.root, _dispose: () => character.dispose() };
  let index = 0;
  visual.root.traverse((node) => {
    node.name = `${node.name || (node.isMesh ? "mesh" : "joint")}_${index++}`;
  });
  return { character: visual.character, dispose: visual._dispose };
}

function frame(name, speed, run) {
  const airborne = ["jump", "glide", "swim"].includes(name);
  return {
    speed,
    runAmt: run,
    onGround: !airborne,
    vy: airborne ? 3 : 0,
    swimming: name === "swim",
    gliding: name === "glide",
    facing: 0,
    pos: new THREE.Vector3(),
    look: null,
    camPos: new THREE.Vector3(0, 2, 5),
    turnAhead: 0,
  };
}

function facialMetadata(character) {
  const node = (value) =>
    value?.isObject3D
      ? {
          name: value.name,
          scale: value.scale.toArray(),
          position: value.position.toArray(),
          quaternion: value.quaternion.toArray(),
        }
      : null;
  const facial = {};
  for (const key of ["head", "neck", "hips", "smile", "mouthO"]) facial[key] = node(character[key]);
  for (const key of ["eyes", "brows"])
    facial[key] = (character[key] ?? []).map((parts) =>
      Object.fromEntries(
        Object.entries(parts)
          .map(([name, value]) => [name, name === "side" ? value : node(value)])
          .filter(([, value]) => value),
      ),
    );
  return facial;
}

export function companionFacialMetadata(id) {
  const rig = createRig(id);
  try {
    return facialMetadata(rig.character);
  } finally {
    rig.dispose();
  }
}

function bake(id, [name, speed, run, duration], available) {
  const { character, dispose } = createRig(id);
  try {
    const pose = frame(name, speed, run);
    if (name === "glide") {
      character.onGlide();
      pose.vy = -1.5;
    }
    if (name === "swim") pose.vy = 0;
    for (let i = 0; i < 90; i++) character.update(1 / 60, pose);
    if (name === "jump") character.onJump();
    const samples = [];
    character.root.traverse((node) => {
      if (available.has(node.name)) samples.push({ node, position: [], quaternion: [], scale: [] });
    });
    const count = Math.max(12, Math.ceil(duration * 30)),
      times = [];
    for (let i = 0; i <= count; i++) {
      times.push((i * duration) / count);
      if (name === "jump") pose.vy = 7 - (14 * i) / count;
      character.update(duration / count, pose);
      character.root.position.y = character.root.userData.swimLift ?? 0;
      for (const sample of samples)
        for (const key of ["position", "quaternion", "scale"])
          sample[key].push(
            ...(key === "scale" && !sample.node.visible
              ? [0.00001, 0.00001, 0.00001]
              : sample.node[key].toArray()),
          );
    }
    const tracks = [];
    for (const sample of samples)
      for (const key of ["position", "quaternion", "scale"]) {
        const values = sample[key],
          size = key === "quaternion" ? 4 : 3;
        // Constant tracks restore face and glider visibility when a clip changes.
        if (name !== "jump") values.splice(values.length - size, size, ...values.slice(0, size));
        const Track =
          key === "quaternion" ? THREE.QuaternionKeyframeTrack : THREE.VectorKeyframeTrack;
        tracks.push(new Track(`${sample.node.name}.${key}`, times, values));
      }
    return new THREE.AnimationClip(name, duration, tracks);
  } finally {
    dispose();
  }
}

export function companionAsset(id) {
  const { character, dispose } = createRig(id);
  const facial = facialMetadata(character);
  character.update(1 / 60, frame("idle", 0, 0));
  const hidden = new Set();
  character.root.traverse((node) => {
    if (!node.visible) hidden.add(node.name);
    node.visible = true;
  });
  const model = cloneExportTree(character.root);
  model.traverse((node) => {
    if (hidden.has(node.name)) node.scale.setScalar(0.00001);
  });
  const root = new THREE.Group();
  root.name = `OriginalCompanion_${id}`;
  root.add(model);
  const available = new Set();
  model.traverse((node) => available.add(node.name));
  try {
    const animations = clips.map((clip) => bake(id, clip, available));
    return {
      root,
      animations,
      facial,
      dispose() {
        model.traverse((node) => {
          for (const material of [node.material].flat()) material?.dispose();
        });
        dispose();
      },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
