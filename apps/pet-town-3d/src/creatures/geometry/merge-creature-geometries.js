/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import { fillCreatureGeometryColor } from "./fill-creature-geometry-color.js";
import { normalizeCreatureGeometryAttributes } from "./normalize-creature-geometry-attributes.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function mergeCreatureGeometries(filterValue) {
  let values = filterValue.filter(Boolean).map((attributesValue) => {
    if (
      !attributesValue.attributes.color &&
      filterValue.some((attributesValue2) => attributesValue2.attributes.color)
    ) {
      fillCreatureGeometryColor(attributesValue, 16777215);
    }
    return normalizeCreatureGeometryAttributes(attributesValue);
  });
  if (values.length === 1) {
    return values[0];
  }
  if (values.some((attributesValue3) => attributesValue3.attributes.color)) {
    for (let result of values) {
      if (!result.attributes.color) {
        fillCreatureGeometryColor(result, 16777215);
      }
    }
  }
  let mergeGeometriesResult = mergeGeometries(values, false);
  mergeGeometriesResult.computeBoundingSphere();
  return mergeGeometriesResult;
}
