/** Stairs, moss shading, faceted rocks, path stones and campfire base geometry. */
import { propsState } from "../state.js";
export function flattenRockFacets(attributesValue, intValue, value) {
  let position2 = attributesValue.attributes.position;
  let result = intValue.int(2, 3);
  for (let index = 0; index < result; index++) {
    let result2 = intValue.next() * propsState.propFullTurn;
    let rangeResult = intValue.range(0.1, 0.9);
    let result3 = Math.cos(result2) * Math.cos(rangeResult);
    let result4 = Math.sin(rangeResult);
    let result5 = Math.sin(result2) * Math.cos(rangeResult);
    let result6 = value * intValue.range(0.62, 0.78);
    for (let index2 = 0; index2 < position2.count; index2++) {
      let xResult = position2.getX(index2);
      let yResult = position2.getY(index2);
      let zResult = position2.getZ(index2);
      let result7 = xResult * result3 + yResult * result4 + zResult * result5;
      if (result7 > result6) {
        position2.setXYZ(
          index2,
          xResult - result3 * (result7 - result6),
          yResult - result4 * (result7 - result6),
          zResult - result5 * (result7 - result6),
        );
      }
    }
  }
  attributesValue.computeVertexNormals();
  return attributesValue;
}
