/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
export function shadeFlowerPetals(mapValue, value, value2, value3 = 1) {
  return mapValue.map((userDataValue) => {
    let s2 = userDataValue.userData.s;
    let u2 = userDataValue.userData.u;
    return bakeFoliageVertexAttributes(userDataValue, (value4, value5, value6) => {
      let result = s2[value6];
      let result2 = u2[value6];
      let result3 = value + (1 - value) * result ** 0.7;
      let result4 = 1 + 0.04 * result2 * result;
      return {
        c: [result3 * result4, result3 * result4, result3 * result4 * 1.01],
        s: value2,
        t: value3,
      };
    });
  });
}
