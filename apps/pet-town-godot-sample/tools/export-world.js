import * as THREE from "../../pet-town-3d/node_modules/three/build/three.module.js";
import { propsState } from "../../pet-town-3d/src/props/state.js";
import { exportMaterial, rangeGeometry } from "./export-materials.js";

export function exportTree(ctx, type) {
  const player = ctx.player.position ?? ctx.player.mesh.position;
  const trees = ctx.vegetation.trees.filter((tree) => tree.type === type);
  trees.sort(
    (a, b) =>
      Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z),
  );
  const tree = trees[0];
  if (!tree) throw new Error(`No existing ${type} tree`);
  const root = new THREE.Group();
  root.name = `Original_${type}`;
  for (const part of tree.parts) {
    if (part.field.name === "blob") continue;
    const mesh = new THREE.Mesh(part.field.geo, exportMaterial(part.field.mat, part.color));
    mesh.name = part.field.name;
    const matrix = part.field.matrixOf(part, new THREE.Matrix4());
    matrix.elements[12] -= tree.x;
    matrix.elements[13] -= tree.y;
    matrix.elements[14] -= tree.z;
    matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
    root.add(mesh);
  }
  return {
    root,
    metadata: {
      source: "Original vegetation instance",
      type,
      sourcePosition: [tree.x, tree.y, tree.z],
      trunkRadius: tree.radius,
      height: tree.height,
    },
  };
}

export function exportProp(ctx, assetId) {
  const record = [...propsState.propsRuntime.recs.values()].find(
    (item) => item.entry?.assetId === assetId,
  );
  if (!record) throw new Error(`No existing prop ${assetId}`);
  const root = new THREE.Group();
  root.name = assetId;
  ctx.props.group.updateWorldMatrix(true, true);
  ctx.props.group.traverse((group) => {
    for (const range of group.userData.ranges?.get(record.tag) ?? []) {
      const geometry = rangeGeometry(range.mesh.geometry, range.start, range.count);
      geometry.applyMatrix4(range.mesh.matrixWorld);
      geometry.translate(-record.x, -record.y, -record.z);
      const mesh = new THREE.Mesh(geometry, exportMaterial(range.mesh.material));
      mesh.name = `${range.mesh.name}_${root.children.length}`;
      root.add(mesh);
    }
  });
  if (!root.children.length) throw new Error(`No published mesh ranges for ${assetId}`);
  return {
    root,
    metadata: {
      source: "Original tagged prop geometry",
      assetId,
      sourcePosition: [record.x, record.y, record.z],
      sourceRotation: record.entry.rot,
    },
  };
}
