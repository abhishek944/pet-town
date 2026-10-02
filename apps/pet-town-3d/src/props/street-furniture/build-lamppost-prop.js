/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { createPropPostCap } from "./create-prop-post-cap.js";
import { appendLanternGeometry } from "./append-lantern-geometry.js";
export function buildLamppostProp(addValue, value, hValue = {}) {
  let result = hValue.h ?? 2.35;
  addValue.add(`stone`, createBeveledPropBox(0.56, 0.34, 0.56, 0.07), {
    y: 0.17,
    tint: propsState.propPalette.stone,
    jitter: 0.05,
  });
  addValue.add(`wood`, createBeveledPropBox(0.2, result, 0.2, 0.04), {
    y: 0.3 + result / 2,
    tint: propsState.propPalette.timber,
    uv: {
      grain: 1,
    },
  });
  addValue.add(`wood`, createBeveledPropBox(0.3, 0.12, 0.3, 0.03), {
    y: 0.36,
    tint: propsState.propPalette.woodDark,
  });
  let result2 = 0.3 + result;
  addValue.add(`wood`, createBeveledPropBox(0.28, 0.1, 0.28, 0.03), {
    y: result2,
    tint: propsState.propPalette.woodDark,
  });
  addValue.add(`wood`, createPropPostCap(0.12, 0.12), {
    y: result2 + 0.05,
    tint: propsState.propPalette.woodDark,
  });
  addValue.add(`metal`, createBeveledPropBox(0.08, 0.08, 0.72, 0.02), {
    y: result2 - 0.22,
    z: 0.3,
    tint: propsState.propPalette.iron,
  });
  addValue.add(`metal`, createBeveledPropBox(0.05, 0.4, 0.05, 0.015), {
    y: result2 - 0.38,
    z: 0.08,
    rx: 0.78,
    tint: propsState.propPalette.iron,
  });
  addValue.add(`metal`, new THREE.TorusGeometry(0.06, 0.014, 6, 12), {
    y: result2 - 0.3,
    z: 0.6,
    tint: propsState.propPalette.iron,
  });
  let result3 = result2 - 0.72;
  let result4 = 0.6;
  appendLanternGeometry(addValue, 0, result3, result4, 1);
  return {
    light: new THREE.Vector3(0, result3, result4),
    radius: 0.3,
    colliders: [
      {
        x: 0,
        z: 0,
        radius: 0.3,
        h: result2 + 0.1,
        noTop: true,
      },
    ],
  };
}
