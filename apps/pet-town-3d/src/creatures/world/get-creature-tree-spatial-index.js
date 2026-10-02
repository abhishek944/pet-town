/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { creaturesState } from "../state.js";
export function getCreatureTreeSpatialIndex() {
  let trees2 = creaturesState.creaturesRuntime.ctx.vegetation?.trees;
  if (!Array.isArray(trees2)) {
    return null;
  }
  if (
    !creaturesState.creatureTreeSpatialIndex ||
    creaturesState.creaturesRuntime.time - creaturesState.creatureTreeSpatialIndexTime > 3
  ) {
    creaturesState.creatureTreeSpatialIndex = new Map();
    creaturesState.creatureTreeSpatialIndexTime = creaturesState.creaturesRuntime.time;
    for (let result of trees2) {
      let position2 = result?.position;
      if (!position2) {
        continue;
      }
      let result2 = Math.floor(position2.x / 4) + `,` + Math.floor(position2.z / 4);
      let values = creaturesState.creatureTreeSpatialIndex.get(result2);
      if (!values) {
        creaturesState.creatureTreeSpatialIndex.set(result2, (values = []));
      }
      values.push(result);
    }
  }
  return creaturesState.creatureTreeSpatialIndex;
}
