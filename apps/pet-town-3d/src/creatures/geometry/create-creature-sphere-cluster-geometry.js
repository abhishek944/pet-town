/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import { mergeCreatureGeometries } from "./merge-creature-geometries.js";
import { createCreatureEllipsoidGeometry } from "./create-creature-ellipsoid-geometry.js";
export function createCreatureSphereClusterGeometry(mapValue, value = 14, value2 = 10) {
  return mergeCreatureGeometries(
    mapValue.map(({ p: value3, r: value4, s: value5 }) => {
      let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(
        value4 * (value5?.[0] ?? 1),
        value4 * (value5?.[1] ?? 1),
        value4 * (value5?.[2] ?? 1),
        value,
        value2,
      );
      creatureEllipsoidGeometryResult.translate(value3[0], value3[1], value3[2]);
      return creatureEllipsoidGeometryResult;
    }),
  );
}
