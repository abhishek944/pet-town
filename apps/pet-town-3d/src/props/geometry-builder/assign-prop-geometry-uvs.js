/** UV generation, transform composition, vertex color baking and material-batched geometry builder. */
import * as THREE from "three";
import { getDominantNormalAxis } from "./get-dominant-normal-axis.js";
import { propsState } from "../state.js";
export function assignPropGeometryUvs(attributesValue, modeValue, value, nextValue) {
  let position2 = attributesValue.attributes.position;
  let normal2 = attributesValue.attributes.normal;
  let floatBuffer = new Float32Array(position2.count * 2);
  modeValue ||= {};
  let result = modeValue.mode || `box`;
  if (result === `native` && attributesValue.attributes.uv) {
    let uv2 = attributesValue.attributes.uv;
    let result2 = modeValue.su ?? 1;
    let result3 = modeValue.sv ?? 1;
    for (let index = 0; index < position2.count; index++) {
      let result4 = uv2.getX(index) * result2;
      let result5 = uv2.getY(index) * result3;
      if (modeValue.swap) {
        [result4, result5] = [result5, result4];
      }
      floatBuffer[index * 2] = result4 + (modeValue.ou ?? 0);
      floatBuffer[index * 2 + 1] = result5 + (modeValue.ov ?? 0);
    }
  } else if (result === `unit`) {
    attributesValue.computeBoundingBox();
    let boundingBox2 = attributesValue.boundingBox;
    let vector = new THREE.Vector3();
    boundingBox2.getSize(vector);
    for (let index2 = 0; index2 < position2.count; index2++) {
      let dominantNormalAxisResult = getDominantNormalAxis(normal2, index2);
      let [result6, result7] =
        dominantNormalAxisResult === 0 ? [2, 1] : dominantNormalAxisResult === 1 ? [0, 2] : [0, 1];
      let values = [position2.getX(index2), position2.getY(index2), position2.getZ(index2)];
      let values2 = [boundingBox2.min.x, boundingBox2.min.y, boundingBox2.min.z];
      let values3 = [vector.x || 1, vector.y || 1, vector.z || 1];
      let result8 = (values[result6] - values2[result6]) / values3[result6];
      let result9 = (values[result7] - values2[result7]) / values3[result7];
      if (dominantNormalAxisResult === 0 && normal2.getX(index2) < 0) {
        result8 = 1 - result8;
      }
      if (dominantNormalAxisResult === 2 && normal2.getZ(index2) < 0) {
        result8 = 1 - result8;
      }
      floatBuffer[index2 * 2] = result8;
      floatBuffer[index2 * 2 + 1] = result9;
    }
  } else if (result !== `none`) {
    let result10 = modeValue.scale ?? 1 / (propsState.propTextureWorldSizes[value] ?? 2);
    let grain2 = modeValue.grain;
    if (grain2 === undefined) {
      attributesValue.computeBoundingBox();
      let vector2 = new THREE.Vector3();
      attributesValue.boundingBox.getSize(vector2);
      grain2 =
        vector2.x >= vector2.y && vector2.x >= vector2.z ? 0 : vector2.y >= vector2.z ? 1 : 2;
    }
    let result11 = modeValue.ou ?? (nextValue ? nextValue.next() * 7 : 0);
    let result12 = modeValue.ov ?? (nextValue ? (Math.floor(nextValue.next() * 8) / 8) * 2 : 0);
    for (let index3 = 0; index3 < position2.count; index3++) {
      let dominantNormalAxisResult2 = getDominantNormalAxis(normal2, index3);
      let [result13, result14] =
        dominantNormalAxisResult2 === 0
          ? [2, 1]
          : dominantNormalAxisResult2 === 1
            ? [0, 2]
            : [0, 1];
      let values4 = [position2.getX(index3), position2.getY(index3), position2.getZ(index3)];
      let result15;
      let result16;
      if (grain2 === result13) {
        result15 = values4[result13];
        result16 = values4[result14];
      } else {
        if (grain2 === result14) {
          result15 = values4[result14];
          result16 = values4[result13];
        } else {
          result15 = values4[result13];
          result16 = values4[result14];
        }
      }
      if (modeValue.flipV) {
        result16 = -result16;
      }
      floatBuffer[index3 * 2] = result15 * result10 + result11;
      floatBuffer[index3 * 2 + 1] = result16 * result10 + result12;
    }
  }
  attributesValue.setAttribute(`uv`, new THREE.BufferAttribute(floatBuffer, 2));
}
