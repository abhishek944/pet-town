import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** One model owns its geometry and materials; static parts batch by colour. */
export function createSceneryModel(name) {
  const root = new THREE.Group();
  root.name = name;
  const batches = new Map();
  const resources = [];
  const up = new THREE.Vector3(0, 1, 0);
  function part(geometry, color, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
    const transform = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(...scale),
    );
    const baked = geometry.index ? geometry.toNonIndexed() : geometry;
    if (baked !== geometry) geometry.dispose();
    baked.deleteAttribute("uv");
    baked.applyMatrix4(transform);
    if (!batches.has(color)) batches.set(color, []);
    batches.get(color).push(baked);
  }
  function branch(a, b, radius, color, tip = radius * 0.65) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const geometry = new THREE.CylinderGeometry(tip, radius, start.distanceTo(end), 7);
    geometry.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(up, end.clone().sub(start).normalize()),
    );
    part(geometry, color, start.add(end).multiplyScalar(0.5).toArray());
  }
  function pebble(position, scale, color) {
    part(new THREE.IcosahedronGeometry(1, 0), color, position, scale);
  }
  function box(position, scale, color, rotation) {
    part(new THREE.BoxGeometry(1, 1, 1), color, position, scale, rotation);
  }
  function finish() {
    for (const [color, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false);
      for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.86 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = mesh.receiveShadow = true;
      root.add(mesh);
      resources.push(geometry, material);
    }
    batches.clear();
    return root;
  }
  return {
    root,
    part,
    branch,
    pebble,
    box,
    finish,
    dispose() {
      root.removeFromParent();
      for (const resource of resources) resource.dispose();
      for (const pieces of batches.values()) for (const piece of pieces) piece.dispose();
      resources.length = 0;
      batches.clear();
    },
  };
}
