/** Folded grass blades, tuft levels of detail and dune grass geometry. */
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { createFoliageBufferGeometry } from "../geometry-helpers/create-foliage-buffer-geometry.js";
export function finalizeGrassBladeGeometry(PValue, value = 1) {
  return bakeFoliageVertexAttributes(
    createFoliageBufferGeometry(PValue.P, PValue.N, null, PValue.I),
    (value2, value3, value4) => ({
      c: PValue.COL.slice(value4 * 3, value4 * 3 + 3),
      s: PValue.SW[value4],
      t: value,
    }),
  );
}
