/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
export function buildScarecrowProp(addValue, rangeValue) {
  let propPaletteValue = propsState.propPalette;
  let result = 15123562;
  addValue.add(`wood`, new THREE.CylinderGeometry(0.05, 0.06, 1.9, 6), {
    y: 0.59,
    tint: propPaletteValue.woodDark,
  });
  addValue.add(`wood`, new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6), {
    y: 1.25,
    rz: Math.PI / 2,
    tint: propPaletteValue.woodDark,
  });
  addValue.add(`cloth`, new THREE.CylinderGeometry(0.2, 0.3, 0.6, 10), {
    y: 1.1,
    uv: {
      mode: `native`,
      su: 1,
      sv: 0.6,
    },
  });
  addValue.add(`sail`, createBeveledPropBox(0.1, 0.1, 0.012, 0.003), {
    x: 0.08,
    y: 1,
    z: 0.26,
    rz: 0.2,
    tint: 6989784,
  });
  for (let result2 of [-1, 1]) {
    addValue.add(`sail`, new THREE.CylinderGeometry(0.07, 0.1, 0.5, 8), {
      x: result2 * 0.42,
      y: 1.25,
      rz: (result2 * Math.PI) / 2,
      tint: 15321487,
    });
    for (let index = 0; index < 6; index++) {
      addValue.add(`plain`, new THREE.ConeGeometry(0.018, rangeValue.range(0.1, 0.18), 3), {
        x: result2 * (0.68 + rangeValue.range(0, 0.04)),
        y: 1.25 + rangeValue.range(-0.05, 0.05),
        z: rangeValue.range(-0.05, 0.05),
        rz: result2 * (Math.PI / 2 + rangeValue.range(-0.5, 0.5)),
        tint: result,
      });
    }
  }
  for (let index2 = 0; index2 < 8; index2++) {
    let result3 = (index2 / 8) * propsState.propFullTurn;
    addValue.add(`plain`, new THREE.ConeGeometry(0.02, 0.12, 3), {
      x: Math.cos(result3) * 0.12,
      y: 1.43,
      z: Math.sin(result3) * 0.12,
      rx: Math.sin(result3) * 1.2,
      rz: -Math.cos(result3) * 1.2,
      tint: result,
    });
  }
  addValue.add(`sail`, new THREE.SphereGeometry(0.2, 12, 10), {
    y: 1.62,
    tint: 15983295,
  });
  addValue.add(`plain`, new THREE.CylinderGeometry(0.34, 0.36, 0.04, 16), {
    y: 1.76,
    tint: 14266974,
  });
  addValue.add(`plain`, new THREE.CylinderGeometry(0.16, 0.2, 0.2, 12), {
    y: 1.87,
    tint: 14266974,
  });
  addValue.add(`cloth`, new THREE.CylinderGeometry(0.205, 0.205, 0.05, 12), {
    y: 1.8,
    uv: {
      mode: `native`,
      su: 1,
      sv: 0.1,
    },
  });
  for (let index3 = 0; index3 < 10; index3++) {
    let result4 = rangeValue.next() * propsState.propFullTurn;
    addValue.add(`plain`, new THREE.ConeGeometry(0.018, 0.12, 3), {
      x: Math.cos(result4) * 0.33,
      y: 1.74,
      z: Math.sin(result4) * 0.33,
      rx: Math.sin(result4) * 1.9,
      rz: -Math.cos(result4) * 1.9,
      tint: result,
    });
  }
  for (let result5 of [-1, 1]) {
    addValue.add(`plain`, new THREE.SphereGeometry(0.025, 6, 4), {
      x: result5 * 0.07,
      y: 1.66,
      z: 0.18,
      tint: 2761504,
      noAO: true,
    });
  }
  for (let result6 of [-1, 1]) {
    addValue.add(`plain`, new THREE.SphereGeometry(0.03, 6, 4), {
      x: result6 * 0.12,
      y: 1.6,
      z: 0.16,
      sz: 0.4,
      tint: 15899274,
      noAO: true,
    });
  }
  addValue.add(`plain`, new THREE.TorusGeometry(0.05, 0.012, 4, 10, Math.PI), {
    y: 1.58,
    z: 0.18,
    rz: Math.PI,
    tint: 2761504,
    noAO: true,
  });
  for (let index4 = 0; index4 < 8; index4++) {
    addValue.add(`plain`, new THREE.ConeGeometry(0.03, 0.18, 4), {
      x: rangeValue.range(-0.18, 0.18),
      y: 0.78,
      z: rangeValue.range(-0.1, 0.1),
      rx: Math.PI + rangeValue.range(-0.3, 0.3),
      tint: result,
    });
  }
  return {
    colliders: [
      {
        x: 0,
        z: 0,
        radius: 0.15,
        y0: -0.36,
        h: 2.3,
        noTop: true,
      },
    ],
  };
}
