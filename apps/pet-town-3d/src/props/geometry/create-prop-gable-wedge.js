/** Beveled primitives, gables, lathes, extruded arches and noisy rocks. */
import { createSubdividedPropBox } from "./create-subdivided-prop-box.js";
export function createPropGableWedge(value, value2, value3, value4 = 0.35) {
  let subdividedPropBoxResult = createSubdividedPropBox(value, value2, value3, value4);
  let position2 = subdividedPropBoxResult.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let result = position2.getY(index) + value2 / 2;
    position2.setXYZ(
      index,
      position2.getX(index),
      result,
      position2.getZ(index) * (1 - result / value2),
    );
  }
  subdividedPropBoxResult.deleteAttribute(`normal`);
  subdividedPropBoxResult.computeVertexNormals();
  return subdividedPropBoxResult;
}
