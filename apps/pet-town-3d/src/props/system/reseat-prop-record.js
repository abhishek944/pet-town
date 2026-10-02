/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { samplePropFoundationHeight } from "./sample-prop-foundation-height.js";
import { propsState } from "../state.js";
export function reseatPropRecord(position2, hValue) {
  let result =
    position2.kind === `stone` || position2.kind === `campfire`
      ? hValue.h(position2.x, position2.z)
      : samplePropFoundationHeight(
          hValue,
          position2.x,
          position2.z,
          position2.foot,
          position2.mode,
        );
  position2.h0 = hValue.h(position2.x, position2.z);
  let result2 = result - position2.y;
  if (Math.abs(result2) < 1e-4) {
    return false;
  }
  position2.y = result;
  if (position2.it) {
    position2.it.y = result;
  }
  for (let result3 of propsState.propsRuntime.ranges?.get(position2.tag) ?? []) {
    let position3 = result3.mesh.geometry.attributes.position;
    let array2 = position3.array;
    for (
      let start2 = result3.start, result4 = result3.start + result3.count;
      start2 < result4;
      start2++
    ) {
      array2[start2 * 3 + 1] += result2;
    }
    position3.addUpdateRange(result3.start * 3, result3.count * 3);
    position3.needsUpdate = true;
  }
  if (position2.entry) {
    position2.entry.y += result2;
    position2.entry.pos.y += result2;
  }
  for (let result5 of position2.cols) {
    result5.y0 += result2;
  }
  for (let result6 of position2.walk) {
    result6.y += result2;
  }
  for (let result7 of position2.lights) {
    result7.y += result2;
  }
  for (let result8 of position2.pools) {
    result8[1] += result2;
  }
  for (let result9 of position2.shade) {
    result9[1] += result2;
  }
  if (position2.fire) {
    position2.fire.pos.y += result2;
    if (position2.fire.mesh) {
      position2.fire.mesh.position.y += result2;
    }
    if (position2.fire.light) {
      position2.fire.light.position.y += result2;
    }
  }
  return true;
}
