/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import * as THREE from "three";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { clampPropValue } from "../math/clamp-prop-value.js";
export function buildSackProp(addValue, nextValue, value = {}) {
  let noisyPropRockResult = createNoisyPropRock(0.3, 2, 0.1, 2, nextValue.next() * 9, 1);
  let position2 = noisyPropRockResult.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let yResult = position2.getY(index);
    let result =
      yResult > 0.05 ? mixPropScalar(1, 0.55, clampPropValue((yResult - 0.05) / 0.3)) : 1;
    position2.setXYZ(
      index,
      position2.getX(index) * result,
      (yResult + 0.3) * 0.95,
      position2.getZ(index) * result,
    );
  }
  noisyPropRockResult.computeVertexNormals();
  addValue.add(`sail`, noisyPropRockResult, {
    tint: 15324848,
  });
  addValue.add(`plain`, new THREE.TorusGeometry(0.11, 0.025, 6, 12), {
    y: 0.47,
    rx: Math.PI / 2,
    tint: 10122832,
  });
  addValue.add(`sail`, createNoisyPropRock(0.1, 1, 0.3, 3, 2, 0.8), {
    y: 0.56,
    tint: 15324848,
  });
  return {
    radius: 0.3,
    colliders: [
      {
        x: 0,
        z: 0,
        radius: 0.3,
        h: 0.62,
        noTop: true,
      },
    ],
  };
}
