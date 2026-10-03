import { T, P, box, tube } from "../shared/geometry.js";
import { slats } from "./slats.js";

export function park(b) {
  slats(b);
  for (let yy of [1, 1.22, 1.44])
    box(b, "wood", 2.55, 0.16, 0.095, 0, yy, -0.36, P.woodWarm, { rx: -0.12 });
  for (let side of [-1, 1]) {
    let x = side * 1.02;
    tube(
      b,
      "metal",
      [
        [x, 0, 0.3],
        [x - 0.08 * side, 0.35, 0.23],
        [x, 0.65, 0],
        [x, 0.9, -0.32],
        [x, 1.53, -0.47],
      ],
      0.07,
      0x365b55,
    );
    tube(
      b,
      "metal",
      [
        [x, 0, -0.42],
        [x, 0.3, -0.33],
        [x, 0.64, 0],
        [x, 0.8, 0.33],
        [x, 0.94, 0.21],
        [x, 0.93, -0.25],
      ],
      0.065,
      0x365b55,
    );
    tube(
      b,
      "metal",
      [
        [x, 0.9, -0.12],
        [x, 0.82, 0.06],
        [x, 0.67, -0.05],
        [x, 0.69, -0.2],
        [x, 0.78, -0.15],
      ],
      0.035,
      0x365b55,
    );
    for (let yy of [0.6, 1.04, 1.46])
      b.add("metal", new T.SphereGeometry(0.027, 10, 8), {
        x,
        y: yy,
        z: -0.29,
        tint: P.brass,
        noAO: true,
      });
    box(b, "metal", 0.22, 0.075, 0.43, x, 0.037, -0.06, 0x365b55);
  }
}
