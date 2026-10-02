/** Vegetation state, fixed and level-of-detail instance fields, and water-pass suppression. */

import { vegetationState } from "../state.js";
import { vegetationSmoothstep } from "../random/vegetation-smoothstep.js";
export function rebucketVegetationLodField(itemsValue, value, value2, value3, distValue) {
  let o2 = this.o;
  let [lodD2, lodD3] = o2.lodD;
  let result = o2.maxDist * distValue.dist;
  let [thin2, thin3, thin4] = o2.thin;
  let length2 = this.variants.length;
  let length3 = this.variants[0].length;
  let values = [];
  for (let index = 0; index < length2; index++) {
    values.push(Array(length3).fill(0));
  }
  let result2 = lodD2 * distValue.dist;
  let result3 = lodD3 * distValue.dist;
  for (let position of itemsValue.items) {
    if (position.hidden) {
      continue;
    }
    let result4 = position.x - value;
    let result5 = (position.y - value2) * 0.6;
    let result6 = position.z - value3;
    let result7 = Math.sqrt(result4 * result4 + result5 * result5 + result6 * result6);
    if (result7 > result) {
      continue;
    }
    let result8 = distValue.dens * (1 - (1 - thin4) * vegetationSmoothstep(thin2, thin3, result7));
    if (position.rank > result8) {
      continue;
    }
    let result9 = result7 < result2 ? 0 : result7 < result3 ? 1 : length3 - 1;
    let result10 = itemsValue.meshes[position.v][result9];
    if (!result10) {
      continue;
    }
    let result11 = values[position.v][result9]++;
    result10.instanceMatrix.array.set(position.m, result11 * 16);
    result10.instanceColor.array[result11 * 3] = position.c[0];
    result10.instanceColor.array[result11 * 3 + 1] = position.c[1];
    result10.instanceColor.array[result11 * 3 + 2] = position.c[2];
  }
  for (let index2 = 0; index2 < length2; index2++) {
    for (let index3 = 0; index3 < length3; index3++) {
      let result12 = itemsValue.meshes[index2][index3];
      if (!result12) {
        continue;
      }
      let result13 = values[index2][index3];
      result12.count = result13;
      result12.visible = result13 > 0;
      if (result13) {
        result12.instanceMatrix.clearUpdateRanges();
        result12.instanceMatrix.addUpdateRange(0, result13 * 16);
        result12.instanceMatrix.needsUpdate = true;
        result12.instanceColor.clearUpdateRanges();
        result12.instanceColor.addUpdateRange(0, result13 * 3);
        result12.instanceColor.needsUpdate = true;
      }
    }
  }
  itemsValue.camX = value;
  itemsValue.camY = value2;
  itemsValue.camZ = value3;
  itemsValue.dirty = false;
  itemsValue.tier = vegetationState.vegetationRuntimeState.tierName;
}
