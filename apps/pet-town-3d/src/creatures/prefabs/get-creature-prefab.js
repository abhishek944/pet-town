/** Cached baked species rigs and independent skeleton cloning. */
import { creaturesState } from "../state.js";
import { bakeCreatureRigMeshes } from "../baking/bake-creature-rig-meshes.js";
export function getCreaturePrefab(idValue, value) {
  let result = idValue.id + `:` + value;
  let result2 = creaturesState.creaturePrefabCache.get(result);
  if (!result2) {
    result2 = idValue.build(idValue.variants[value]);
    result2.baked = bakeCreatureRigMeshes(result2.root);
    creaturesState.creaturePrefabCache.set(result, result2);
  }
  return result2;
}
