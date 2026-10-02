/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import { creaturesState } from "../state.js";
export function transformCreatureGeometry(
  applyMatrix4Value,
  value = [0, 0, 0],
  value2 = [0, 0, 0],
  value3 = [1, 1, 1],
) {
  creaturesState.creatureGeometryTransformScratch.compose(
    creaturesState.creatureGeometryPositionScratch.set(...value),
    creaturesState.creatureGeometryQuaternionScratch.setFromEuler(
      creaturesState.creatureGeometryEulerScratch.set(value2[0], value2[1], value2[2], `YXZ`),
    ),
    creaturesState.creatureGeometryScaleScratch.set(
      ...(Array.isArray(value3) ? value3 : [value3, value3, value3]),
    ),
  );
  applyMatrix4Value.applyMatrix4(creaturesState.creatureGeometryTransformScratch);
  return applyMatrix4Value;
}
