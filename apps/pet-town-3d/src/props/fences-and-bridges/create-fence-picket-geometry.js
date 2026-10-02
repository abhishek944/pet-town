/** Fence pickets, sloping fence segments, open gates and arched wooden bridge decks. */
import * as THREE from "three";
import { extrudePropShape } from "../geometry/extrude-prop-shape.js";
export function createFencePicketGeometry(value, value2, value3) {
  let shape = new THREE.Shape();
  let result = value / 2;
  shape.moveTo(-result, 0);
  shape.lineTo(result, 0);
  shape.lineTo(result, value2 - result);
  shape.absarc(0, value2 - result, result, 0, Math.PI, false);
  shape.closePath();
  return extrudePropShape(shape, value3, 0.014, 5);
}
