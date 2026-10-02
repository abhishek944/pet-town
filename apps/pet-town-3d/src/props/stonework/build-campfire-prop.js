/** Stairs, moss shading, faceted rocks, path stones and campfire base geometry. */
import * as THREE from "three";
import { propValueNoise3d } from "../math/prop-value-noise3d.js";
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
import { propFractalNoise3d } from "../math/prop-fractal-noise3d.js";
import { clampPropValue } from "../math/clamp-prop-value.js";
import { propsState } from "../state.js";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
export function buildCampfireProp(values, nextValue) {
  let ringGeometry = new THREE.RingGeometry(0, 0.66, 28, 5);
  ringGeometry.rotateX(-Math.PI / 2);
  let position2 = ringGeometry.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let xResult = position2.getX(index);
    let zResult = position2.getZ(index);
    position2.setY(
      index,
      (propValueNoise3d(xResult * 6, 0, zResult * 6) - 0.5) * 0.035 +
        0.02 -
        Math.hypot(xResult, zResult) * 0.02,
    );
  }
  ringGeometry.computeVertexNormals();
  let clonePropColorResult = clonePropColor(2893346);
  let clonePropColorResult2 = clonePropColor(9274749);
  values.add(`plain`, ringGeometry, {
    noAO: true,
    tint: 16777215,
    colorFn: (copyValue, value, value2, value3) => {
      let propFractalNoise3dResult = propFractalNoise3d(value * 5, 3.1, value3 * 5, 2);
      let result = Math.hypot(value, value3) / 0.66;
      copyValue
        .copy(clonePropColorResult)
        .lerp(
          clonePropColorResult2,
          clampPropValue(propFractalNoise3dResult * 1.3 - 0.2 + result * 0.35),
        );
    },
  });
  for (let index2 = 0; index2 < 9; index2++) {
    let result2 = nextValue.next() * propsState.propFullTurn;
    let rangeResult = nextValue.range(0.25, 0.5);
    values.add(
      `plain`,
      createNoisyPropRock(nextValue.range(0.03, 0.06), 0, 0.3, 8, nextValue.next() * 9, 0.6),
      {
        x: Math.cos(result2) * rangeResult,
        y: 0.04,
        z: Math.sin(result2) * rangeResult,
        tint: 1972760,
      },
    );
  }
  for (let index3 = 0; index3 < 16; index3++) {
    let result3 = nextValue.next() * propsState.propFullTurn;
    let result4 = Math.sqrt(nextValue.next()) * 0.3;
    values.add(
      `ember`,
      createNoisyPropRock(nextValue.range(0.035, 0.07), 1, 0.35, 8, nextValue.next() * 9, 0.6),
      {
        x: Math.cos(result3) * result4,
        y: 0.045,
        z: Math.sin(result3) * result4,
        tint: 16777215,
        noAO: true,
      },
    );
  }
  for (let index4 = 0; index4 < 11; index4++) {
    let result5 = (index4 / 11) * propsState.propFullTurn + nextValue.range(-0.08, 0.08);
    values.add(
      `rock`,
      createNoisyPropRock(nextValue.range(0.16, 0.22), 2, 0.22, 3.2, nextValue.next() * 50, 0.7),
      {
        x: Math.cos(result5) * 0.74,
        y: 0.06,
        z: Math.sin(result5) * 0.74,
        ry: nextValue.next() * 6,
        tint: nextValue.pick([12432292, 11576985, 13023912, 11183258]),
        down: 0.96,
        colorFn: (multiplyScalarValue, value4, value5, value6, value7, value8, value9) => {
          let result6 = value7 * Math.cos(result5) + value9 * Math.sin(result5);
          multiplyScalarValue.multiplyScalar(
            mixPropScalar(1, 0.62, clampPropValue((-result6 - 0.05) * 1.6)) *
              (1 + (propFractalNoise3d(value4 * 6, value5 * 6, value6 * 6, 2) - 0.5) * 0.2),
          );
        },
      },
    );
  }
  for (let index5 = 0; index5 < 7; index5++) {
    let result7 = (index5 / 7) * propsState.propFullTurn + 0.3 + nextValue.range(-0.12, 0.12);
    let rangeResult2 = nextValue.range(0.55, 0.72);
    let rangeResult3 = nextValue.range(0.78, 0.92);
    let rangeResult4 = nextValue.range(0.06, 0.085);
    values.push(
      Math.cos(result7) * 0.36,
      0.03,
      Math.sin(result7) * 0.36,
      0,
      -result7 + Math.PI / 2,
      0,
    );
    values.push(0, 0, 0, -rangeResult2, 0, 0);
    values.add(`wood`, createBeveledPropCylinder(rangeResult4, rangeResult3, 8, 0.02), {
      tint: clonePropColor(propsState.propPalette.bark).multiplyScalar(nextValue.range(0.85, 1.1)),
      uv: {
        mode: `native`,
        su: 0.3,
        sv: 0.4,
        swap: true,
      },
      colorFn: (multiplyScalarValue2, value10, value11) =>
        multiplyScalarValue2.multiplyScalar(
          mixPropScalar(
            1,
            0.16,
            clampPropValue((value11 - rangeResult3 * 0.45) / (rangeResult3 * 0.45)),
          ),
        ),
    });
    values.add(`plain`, new THREE.CircleGeometry(rangeResult4 * 0.85, 10), {
      y: -0.002,
      rx: Math.PI / 2,
      tint: 15189134,
      colorFn: (multiplyScalarValue3, value12, value13, value14) =>
        multiplyScalarValue3.multiplyScalar(
          0.8 +
            0.2 *
              Math.cos(
                Math.hypot(value12 - Math.cos(result7) * 0.36, value14 - Math.sin(result7) * 0.36) *
                  90,
              ),
        ),
    });
    values.pop();
    values.pop();
  }
  values.push(0.98, 0.1, -0.62, 0, 0.6, Math.PI / 2);
  values.add(`wood`, createBeveledPropCylinder(0.1, 0.7, 8, 0.02), {
    y: -0.35,
    tint: propsState.propPalette.bark,
    uv: {
      mode: `native`,
      su: 0.3,
      sv: 0.4,
      swap: true,
    },
  });
  for (let result8 of [-1, 1]) {
    values.add(`plain`, new THREE.CircleGeometry(0.086, 10), {
      y: result8 * 0.353,
      rx: (-result8 * Math.PI) / 2,
      tint: 15189134,
    });
  }
  values.pop();
  return {
    fire: new THREE.Vector3(0, 0.15, 0),
    radius: 0.95,
    colliders: [
      {
        x: 0,
        z: 0,
        radius: 0.92,
        h: 0.35,
        noTop: true,
      },
    ],
  };
}
