/** UV generation, transform composition, vertex color baking and material-batched geometry builder. */
import * as THREE from "three";
import { propsState } from "../state.js";
export function createPropTransformMatrix(
  value = 0,
  value2 = 0,
  value3 = 0,
  value4 = 0,
  value5 = 0,
  value6 = 0,
  value7 = 1,
  value8 = 1,
  value9 = 1,
) {
  return new THREE.Matrix4().compose(
    propsState.propTransformPosition.set(value, value2, value3),
    propsState.propTransformQuaternion.setFromEuler(
      propsState.propTransformEuler.set(value4, value5, value6, `YXZ`),
    ),
    propsState.propTransformScale.set(value7, value8, value9),
  );
}
