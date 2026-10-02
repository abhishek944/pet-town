/** Pebbug beetle geometry, stone shell cells, moss, crystals, legs and flower. */
import { sampleCreatureValueNoise } from "../../math/sample-creature-value-noise.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { creaturesState } from "../../state.js";
import { hashCreatureCoordinates } from "../../math/hash-creature-coordinates.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
export function createPebbugShellColoring(stoneLoValue) {
  return (multiplyScalarValue, position, yValue) => {
    let creatureValueNoiseResult = sampleCreatureValueNoise(
      position.x * 12,
      position.y * 12,
      position.z * 12,
    );
    lerpCreatureRigColor(
      multiplyScalarValue,
      stoneLoValue.stoneLo,
      stoneLoValue.stone,
      smoothstepCreatureValue(-0.4, 0.6, yValue.y),
    );
    multiplyScalarValue.multiplyScalar(0.88 + 0.24 * creatureValueNoiseResult);
    let result = 9;
    let result2 = 9;
    let index = 0;
    for (let index2 = 0; index2 < creaturesState.pebbugShellCellCenters.length; index2++) {
      let result4 = creaturesState.pebbugShellCellCenters[index2];
      let hypotResult = Math.hypot(
        position.x - result4[0],
        position.y - result4[1],
        position.z - result4[2],
      );
      if (hypotResult < result) {
        result2 = result;
        result = hypotResult;
        index = index2;
      } else {
        if (hypotResult < result2) {
          result2 = hypotResult;
        }
      }
    }
    multiplyScalarValue.multiplyScalar(0.95 + 0.08 * hashCreatureCoordinates(index, 3, 7));
    multiplyScalarValue.lerp(
      getCreatureColor(stoneLoValue.seam),
      (1 - smoothstepCreatureValue(0.008, 0.04, result2 - result)) *
        0.55 *
        smoothstepCreatureValue(-0.25, 0.1, position.y),
    );
    let smoothstepCreatureValueResult = smoothstepCreatureValue(
      0.66,
      0.74,
      sampleCreatureValueNoise(position.x * 6 + 9, position.y * 6, position.z * 6) * 0.45 +
        yValue.y * 0.55 +
        (position.z < 0 ? 0.03 : -0.03),
    );
    multiplyScalarValue.lerp(
      getCreatureColor(stoneLoValue.moss),
      smoothstepCreatureValueResult * 0.95,
    );
    multiplyScalarValue.lerp(
      getCreatureColor(stoneLoValue.mossHi),
      smoothstepCreatureValueResult *
        smoothstepCreatureValue(0.55, 0.8, creatureValueNoiseResult) *
        0.5,
    );
    let result3 =
      (1 - smoothstepCreatureValue(0.006, 0.02, Math.abs(position.x))) *
      smoothstepCreatureValue(-0.1, 0.2, position.y) *
      (1 - smoothstepCreatureValue(0.1, 0.25, position.z));
    multiplyScalarValue.lerp(getCreatureColor(stoneLoValue.seam), result3 * 0.8);
    multiplyScalarValue.lerp(
      getCreatureColor(stoneLoValue.stoneLo),
      smoothstepCreatureValue(-0.05, -0.18, position.y) * 0.6,
    );
  };
}
