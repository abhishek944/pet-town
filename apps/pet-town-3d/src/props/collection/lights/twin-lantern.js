import { T, P, cylinder, tube } from "../shared/geometry.js";
import { appendLightBase, appendHexLantern } from "./details.js";
export function appendTwinLantern(b, lights) {
  appendLightBase(b);
  cylinder(b, "metal", 0.082, 2.78, 0, 1.77, 0, 0x365e59, 0.058);
  for (let yy of [0.53, 1.73, 2.99]) cylinder(b, "metal", 0.125, 0.09, 0, yy, 0, P.brass);
  for (let side of [-1, 1]) {
    tube(
      b,
      "metal",
      [
        [0, 2.93, 0],
        [side * 0.35, 3.22, 0],
        [side * 0.74, 3.13, 0],
        [side * 0.91, 2.82, 0],
        [side * 0.88, 2.67, 0],
      ],
      0.048,
      0x365e59,
    );
    tube(
      b,
      "metal",
      [
        [side * 0.08, 2.84, 0],
        [side * 0.33, 2.7, 0],
        [side * 0.49, 2.77, 0],
        [side * 0.36, 2.9, 0],
      ],
      0.025,
      0x365e59,
    );
    appendHexLantern(b, side * 0.88, 2.13, 0);
    lights.push({ x: side * 0.88, y: 2.13, z: 0 });
  }
  b.add("metal", new T.SphereGeometry(0.08, 12, 8), { y: 3.06, tint: P.brass });
}
