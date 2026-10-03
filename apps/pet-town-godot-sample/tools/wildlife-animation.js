import * as THREE from '../../pet-town-3d/node_modules/three/build/three.module.js';
import { creatureActor } from '../../pet-town-3d/src/creatures/actor/creature-actor.js';
import { creaturesState } from '../../pet-town-3d/src/creatures/state.js';
import { createCreatureRandom } from '../../pet-town-3d/src/creatures/math/create-creature-random.js';
import { exportMaterial } from './export-materials.js';

function makeActor(def, variant) {
  const actor = new creatureActor(def, variant, 0, 0, createCreatureRandom(741));
  actor.mesh.scale.setScalar(1);
  actor.size = 1;
  actor.yaw = 0;
  actor.pose = 'export'; // Suppresses runtime particles while retaining original animation.
  const sprites = [];
  actor.mesh.traverse(node => { if (node.isSprite) sprites.push(node); });
  sprites.forEach(node => node.removeFromParent());
  let id = 0;
  actor.mesh.traverse(node => { node.name = `${node.name || 'part'}_${id++}`; });
  return actor;
}

function bake(actor, name) {
  const def = actor.def;
  actor.state = name === 'happy' ? 'happy' : name === 'sleep' ? 'sleep' : name;
  actor.inWater = name === 'swim';
  actor.flying = name === 'fly';
  actor.flyH = actor.flying ? 1 : 0;
  actor.speed = name === 'flee' ? def.run : ['walk', 'swim', 'fly'].includes(name) ? def.walk : 0;
  actor.moveAmt = actor.speed > 0 ? 1 : 0;
  actor.happyT = name === 'happy' ? 100 : 0;
  actor.idleHop = name === 'happy' ? 20 : 0;
  const duration = name === 'walk'
    ? (def.gait === 'trot' ? 2 * def.stride / def.walk : def.hopRate ? 1 / def.hopRate : 1)
    : name === 'swim' ? Math.PI / 4 : 2;
  const frame = { night: name === 'sleep' ? 1 : 0, camDist: 5, player: null };
  const step = dt => { creaturesState.creaturesRuntime.time += dt; actor.animate(dt, frame); actor.secondary(dt); };
  for (let i = 0; i < 60; i++) step(1 / 60);
  const samples = [];
  actor.mesh.traverse(node => { if (node !== actor.mesh) samples.push({ node, position: [], quaternion: [], scale: [] }); });
  const count = Math.max(18, Math.ceil(duration * 30));
  const times = [];
  for (let i = 0; i <= count; i++) {
    times.push(i * duration / count);
    step(duration / count);
    for (const sample of samples) for (const key of ['position', 'quaternion', 'scale'])
      sample[key].push(...sample.node[key].toArray());
  }
  const tracks = [];
  for (const sample of samples) for (const key of ['position', 'quaternion', 'scale']) {
    const values = sample[key], size = key === 'quaternion' ? 4 : 3;
    // Include constant facial pose tracks: happy/sleep visibility differs from idle.
    values.splice(values.length - size, size, ...values.slice(0, size));
    const Track = key === 'quaternion' ? THREE.QuaternionKeyframeTrack : THREE.VectorKeyframeTrack;
    tracks.push(new Track(`${sample.node.name}.${key}`, times, values));
  }
  return new THREE.AnimationClip(name, duration, tracks);
}

export function wildlifeAsset(def, variant) {
  const runtime = creaturesState.creaturesRuntime;
  const before = { time: runtime.time, count: runtime.shadowCount, next: creaturesState.nextCreatureId };
  try {
    const base = makeActor(def, variant);
    const clips = ['idle', 'walk', 'happy', 'sleep', 'rest', 'graze', 'flee'];
    if (def.traits.swimmer) clips.push('swim');
    if (def.flight || def.traits.canFly) clips.push('fly');
    const animations = clips.map(name => bake(makeActor(def, variant), name));
    base.mesh.traverse(node => {
      node.userData = {};
      if (node.isMesh) {
        node.material = exportMaterial(node.material);
        const properties = node.geometry.getAttribute('crp');
        if (properties) {
          node.geometry = node.geometry.clone();
          const packed = new Float32Array(properties.count * 2);
          for (let i = 0; i < properties.count; i++) {
            packed[i * 2] = properties.getX(i);
            packed[i * 2 + 1] = properties.getY(i);
          }
          node.geometry.setAttribute('uv1', new THREE.BufferAttribute(packed, 2));
        }
      }
    });
    base.mesh.updateMatrixWorld(true);
    return { root: base.mesh, animations };
  } finally {
    runtime.time = before.time;
    runtime.shadowCount = before.count;
    creaturesState.nextCreatureId = before.next;
  }
}
