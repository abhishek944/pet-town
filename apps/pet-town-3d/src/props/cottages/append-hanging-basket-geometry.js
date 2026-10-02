/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { appendLeafRosetteGeometry } from "../building-details/append-leaf-rosette-geometry.js";
import { appendTrailingVineGeometry } from "../building-details/append-trailing-vine-geometry.js";
export function appendHangingBasketGeometry(addValue, nextValue, value, value2, value3, value4) {
  let result = 0.26;
  let result2 = value2 - 0.62;
  addValue.add(`metal`, createBeveledPropBox(0.04, 0.04, 0.46, 0.01), {
    x: value,
    y: value2 + 0.02,
    z: value3 - 0.2,
    tint: propsState.propPalette.iron,
  });
  for (let index = 0; index < 3; index++) {
    let result3 = (index / 3) * propsState.buildingFullTurn;
    let result4 = value + Math.cos(result3) * result * 0.92;
    let result5 = value3 + Math.sin(result3) * result * 0.92;
    let hypotResult = Math.hypot(result4 - value, result2 + 0.12 - value2, result5 - value3);
    let normalizeResult = new THREE.Vector3(
      result4 - value,
      result2 + 0.12 - value2,
      result5 - value3,
    ).normalize();
    let setFromUnitVectorsResult = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      normalizeResult,
    );
    let setFromQuaternionResult = new THREE.Euler().setFromQuaternion(
      setFromUnitVectorsResult,
      `YXZ`,
    );
    addValue.add(`metal`, new THREE.CylinderGeometry(0.007, 0.007, hypotResult, 4), {
      x: (value + result4) / 2,
      y: (value2 + result2 + 0.12) / 2,
      z: (value3 + result5) / 2,
      rx: setFromQuaternionResult.x,
      ry: setFromQuaternionResult.y,
      rz: setFromQuaternionResult.z,
      tint: propsState.propPalette.iron,
      noAO: true,
    });
  }
  addValue.add(
    `wood`,
    new THREE.SphereGeometry(
      result,
      14,
      8,
      0,
      propsState.buildingFullTurn,
      Math.PI / 2,
      Math.PI / 2,
    ),
    {
      x: value,
      y: result2 + 0.14,
      z: value3,
      tint: 10975818,
      uv: {
        mode: `native`,
        su: 3,
        sv: 0.6,
      },
    },
  );
  addValue.add(`wood`, new THREE.TorusGeometry(result, 0.025, 6, 16), {
    x: value,
    y: result2 + 0.14,
    z: value3,
    rx: Math.PI / 2,
    tint: 9068600,
  });
  addValue.add(`soil`, new THREE.CircleGeometry(result * 0.95, 14), {
    x: value,
    y: result2 + 0.13,
    z: value3,
    rx: -Math.PI / 2,
  });
  appendLeafRosetteGeometry(addValue, nextValue, value, result2 + 0.13, value3, 0.75, 9);
  let values = [value4, 16777215, propsState.propPalette.lilac];
  for (let index2 = 0; index2 < 14; index2++) {
    let result6 = nextValue.next() * propsState.buildingFullTurn;
    let rangeResult = nextValue.range(0.04, result * 0.95);
    addValue.add(`plain`, new THREE.SphereGeometry(0.042, 6, 4), {
      x: value + Math.cos(result6) * rangeResult,
      y: result2 + 0.2 + nextValue.range(0, 0.1) - rangeResult * 0.15,
      z: value3 + Math.sin(result6) * rangeResult,
      sy: 0.7,
      tint: values[index2 % 3],
      noAO: true,
    });
  }
  for (let index3 = 0; index3 < 4; index3++) {
    let result7 = (index3 / 4) * propsState.buildingFullTurn + 0.4;
    appendTrailingVineGeometry(
      addValue,
      nextValue,
      value + Math.cos(result7) * result * 0.9,
      result2 + 0.14,
      value3 + Math.sin(result7) * result * 0.9,
      nextValue.range(0.28, 0.46),
      Math.atan2(Math.cos(result7), Math.sin(result7)),
      6,
    );
  }
}
