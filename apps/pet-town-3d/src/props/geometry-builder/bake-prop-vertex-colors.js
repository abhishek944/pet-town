/** UV generation, transform composition, vertex color baking and material-batched geometry builder. */
import * as THREE from "three";
import { clonePropColor } from "./clone-prop-color.js";
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { propSmoothstep } from "../math/prop-smoothstep.js";
import { clampPropValue } from "../math/clamp-prop-value.js";
import { propsState } from "../state.js";
export function bakePropVertexColors(attributesValue, tintValue) {
  let position2 = attributesValue.attributes.position;
  let normal2 = attributesValue.attributes.normal;
  let clonePropColorResult = clonePropColor(tintValue.tint ?? 16777215);
  if (tintValue.jitter) {
    clonePropColorResult.multiplyScalar(1 + (this.rng.next() - 0.5) * 2 * tintValue.jitter);
  }
  let floatBuffer = new Float32Array(position2.count * 3);
  let result = tintValue.gy ?? 0;
  for (let index = 0; index < position2.count; index++) {
    let yResult = position2.getY(index);
    let yResult2 = normal2.getY(index);
    let result2 = tintValue.noAO
      ? 1
      : mixPropScalar(this.aoMin, 1, propSmoothstep(0, this.aoH, yResult - result));
    if (
      ((result2 *= mixPropScalar(1, tintValue.down ?? 0.68, propSmoothstep(-0.15, -0.9, yResult2))),
      tintValue.grad)
    ) {
      let [grad2, grad3, grad4, grad5] = tintValue.grad;
      result2 *= mixPropScalar(grad3, grad5, clampPropValue((yResult - grad2) / (grad4 - grad2)));
    }
    result2 *= tintValue.ao ?? 1;
    if (tintValue.colorFn) {
      propsState.propVertexColorScratch.copy(clonePropColorResult);
      tintValue.colorFn(
        propsState.propVertexColorScratch,
        position2.getX(index),
        yResult,
        position2.getZ(index),
        normal2.getX(index),
        yResult2,
        normal2.getZ(index),
      );
    } else {
      propsState.propVertexColorScratch.copy(clonePropColorResult);
    }
    let result3 = 1 - Math.min(1, result2);
    let result4 = +!!tintValue.coolAO;
    floatBuffer[index * 3] =
      propsState.propVertexColorScratch.r * Math.max(0, 1 - result3 * (0.78 + 0.22 * result4));
    floatBuffer[index * 3 + 1] =
      propsState.propVertexColorScratch.g * Math.max(0, 1 - result3 * (0.98 + 0.02 * result4));
    floatBuffer[index * 3 + 2] =
      propsState.propVertexColorScratch.b * Math.max(0, 1 - result3 * (1.22 - 0.22 * result4));
  }
  attributesValue.setAttribute(`color`, new THREE.BufferAttribute(floatBuffer, 3));
}
