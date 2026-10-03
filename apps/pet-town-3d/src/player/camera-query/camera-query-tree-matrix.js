import * as THREE from "three";

const keys = ["x", "y", "z", "rx", "ry", "rz", "sx", "sy", "sz", "hidden"];

export function cameraTreeMatrix(state, tree, part, mesh) {
  let cached = state.treeMatrices.get(tree);
  if (
    cached?.part === part &&
    cached?.mesh === mesh &&
    cached.world.equals(mesh.matrixWorld) &&
    keys.every((key, index) => part[key] === cached.pose[index])
  )
    return cached;
  const pose = keys.map((key) => part[key]);
  const matrix = new THREE.Matrix4()
    .compose(
      new THREE.Vector3(part.x, part.y, part.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(part.rx, part.ry, part.rz)),
      new THREE.Vector3(part.sx, part.sy, part.sz),
    )
    .premultiply(mesh.matrixWorld);
  cached = {
    part,
    mesh,
    matrix,
    world: mesh.matrixWorld.clone(),
    pose,
    current: () => keys.every((key, index) => tree.parts?.[0]?.[key] === pose[index]),
  };
  state.treeMatrices.set(tree, cached);
  return cached;
}
