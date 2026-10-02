/** Cached baked species rigs and independent skeleton cloning. */
import { traverseCreatureRigPair } from "./traverse-creature-rig-pair.js";
export function cloneCreatureSkinnedRig(cloneValue) {
  let lookup = new Map();
  let lookup2 = new Map();
  let copy2 = cloneValue.clone();
  traverseCreatureRigPair(cloneValue, copy2, function (value, value2) {
    lookup.set(value2, value);
    lookup2.set(value, value2);
  });
  copy2.traverse(function (isSkinnedMeshValue) {
    if (!isSkinnedMeshValue.isSkinnedMesh) {
      return;
    }
    let isSkinnedMeshValueValue = isSkinnedMeshValue;
    let result = lookup.get(isSkinnedMeshValue);
    let bones2 = result.skeleton.bones;
    isSkinnedMeshValueValue.skeleton = result.skeleton.clone();
    isSkinnedMeshValueValue.bindMatrix.copy(result.bindMatrix);
    isSkinnedMeshValueValue.skeleton.bones = bones2.map(function (value3) {
      return lookup2.get(value3);
    });
    isSkinnedMeshValueValue.bind(
      isSkinnedMeshValueValue.skeleton,
      isSkinnedMeshValueValue.bindMatrix,
    );
  });
  return copy2;
}
