/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function mergeFoliageGeometry(filterValue) {
  let mergeGeometriesResult = mergeGeometries(filterValue.filter(Boolean), false);
  mergeGeometriesResult.computeBoundingSphere();
  mergeGeometriesResult.computeBoundingBox();
  return mergeGeometriesResult;
}
