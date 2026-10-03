/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { vegetationState } from "../state.js";
export function vegetationClearVegetationAroundProps(propsValue) {
  let colliders2 = propsValue.props?.colliders;
  if (!colliders2) {
    return;
  }
  let colliders2Value = colliders2;
  if (!Array.isArray(colliders2Value)) {
    try {
      colliders2Value = Array.from(colliders2.values ? colliders2.values() : colliders2);
    } catch {
      return;
    }
  }
  if (
    colliders2Value === vegetationState.vegetationRuntimeState.propsSeen &&
    colliders2Value.length === vegetationState.vegetationRuntimeState.propsSeenLen
  ) {
    return;
  }
  let result =
    colliders2Value === vegetationState.vegetationRuntimeState.propsSeen
      ? vegetationState.vegetationRuntimeState.propsSeenLen
      : 0;
  vegetationState.vegetationRuntimeState.propsSeen = colliders2Value;
  vegetationState.vegetationRuntimeState.propsSeenLen = colliders2Value.length;
  let vegetation2 = propsValue.vegetation;
  for (let resultValue = result; resultValue < colliders2Value.length; resultValue++) {
    let result2 = colliders2Value[resultValue];
    if (result2 && typeof result2 == `object`) {
      try {
        let result3 = result2.isBox3
          ? result2
          : result2.box && result2.box.min
            ? result2.box
            : result2.min && result2.max && Number.isFinite(result2.min.x)
              ? result2
              : null;
        if (result3) {
          vegetation2.clearBox(result3.min.x, result3.min.z, result3.max.x, result3.max.z, 0.35, {
            transient: true,
          });
          continue;
        }
        if (result2.center && (result2.size || result2.half || result2.halfSize)) {
          let position3 = result2.half ??
            result2.halfSize ?? {
              x: result2.size.x / 2,
              z: result2.size.z / 2,
            };
          vegetation2.clearBox(
            result2.center.x - position3.x,
            result2.center.z - position3.z,
            result2.center.x + position3.x,
            result2.center.z + position3.z,
            0.35,
            { transient: true },
          );
          continue;
        }
        let position2 = result2.isObject3D ? result2.position : (result2.position ?? result2);
        let result4 = result2.r ?? result2.radius ?? result2.userData?.radius;
        if (
          position2 &&
          Number.isFinite(position2.x) &&
          Number.isFinite(position2.z) &&
          Number.isFinite(result4)
        ) {
          vegetation2.clearArea(position2, result4 + 0.3, { transient: true });
        }
      } catch {}
    }
  }
}
