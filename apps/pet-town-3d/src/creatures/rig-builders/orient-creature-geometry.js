/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
import * as THREE from "three";
export function orientCreatureGeometry(
  applyQuaternionValue,
  value,
  value2 = [0, 0, 0],
  value3 = 0,
) {
  let normalizeResult = new THREE.Vector3(...value).normalize();
  let setFromUnitVectorsResult = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    normalizeResult,
  );
  if (value3) {
    setFromUnitVectorsResult.multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), value3),
    );
  }
  applyQuaternionValue.applyQuaternion(setFromUnitVectorsResult);
  applyQuaternionValue.translate(...value2);
  return applyQuaternionValue;
}
