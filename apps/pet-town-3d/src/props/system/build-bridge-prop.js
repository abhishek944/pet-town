/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import * as THREE from "three";
import { buildArchedBridgeGeometry } from "../fences-and-bridges/build-arched-bridge-geometry.js";
import { propsState } from "../state.js";
export function buildBridgeProp(beginValue, value, itValue, value2, value3) {
  let it2 = itValue.it;
  let atan2Result = Math.atan2(-it2.dz, it2.dx);
  let result = Math.min(it2.yA, it2.yB);
  beginValue.begin(it2.ax, result, it2.az, atan2Result, {
    aoH: 0.01,
    aoMin: 1,
  });
  let archedBridgeGeometryResult = buildArchedBridgeGeometry(
    beginValue,
    value,
    it2.L,
    it2.yA,
    it2.yB,
    it2.water,
    result,
  );
  let result2 = result + archedBridgeGeometryResult.deckY(it2.L / 2);
  let options = {
    type: `bridge`,
    name: `Bridge`,
    x: it2.mx,
    y: result2,
    z: it2.mz,
    rot: atan2Result,
    radius: it2.L / 2,
    pos: new THREE.Vector3(it2.mx, result2, it2.mz),
    deck: {
      ax: it2.ax,
      az: it2.az,
      bx: it2.bx,
      bz: it2.bz,
      width: 1.7,
      heightAt: (value4) => result + archedBridgeGeometryResult.deckY(value4 * it2.L),
    },
  };
  propsState.propEntries.push(options);
  itValue.entry = options;
  let result3 = -it2.dz;
  let dx2 = it2.dx;
  let result4 = Math.max(3, Math.ceil(it2.L / 1.2));
  for (let index = 0; index < result4; index++) {
    for (let result5 of [-1, 1]) {
      let result6 = index / result4;
      let result7 = (index + 1) / result4;
      let result8 =
        result +
        Math.min(
          archedBridgeGeometryResult.deckY(result6 * it2.L),
          archedBridgeGeometryResult.deckY(result7 * it2.L),
        );
      let result9 =
        result +
        Math.max(
          archedBridgeGeometryResult.deckY(result6 * it2.L),
          archedBridgeGeometryResult.deckY(result7 * it2.L),
        );
      value3(itValue, {
        kind: `segment`,
        world: true,
        x1: it2.ax + (it2.bx - it2.ax) * result6 + result3 * result5 * 0.93,
        z1: it2.az + (it2.bz - it2.az) * result6 + dx2 * result5 * 0.93,
        x2: it2.ax + (it2.bx - it2.ax) * result7 + result3 * result5 * 0.93,
        z2: it2.az + (it2.bz - it2.az) * result7 + dx2 * result5 * 0.93,
        r: 0.08,
        y0: result8 - 0.25,
        h: result9 - result8 + 1.25,
      });
    }
  }
}
