import { T, P, box, tube, planter, lantern } from "../shared/geometry.js";
import { slats } from "./slats.js";
import { createIvyLeafGeometry } from "../../building-details/create-ivy-leaf-geometry.js";

export function swing(b, r) {
  for (let x of [-1.63, 1.63])
    for (let z of [-0.56, 0.56]) {
      box(b, "wood", 0.18, 3.13, 0.18, x, 1.56, z, P.timber);
      box(b, "stone", 0.35, 0.24, 0.35, x, 0.12, z, P.stone);
    }
  tube(
    b,
    "wood",
    [
      [-1.92, 3.08, 0],
      [-1, 3.36, 0],
      [0, 3.52, 0],
      [1, 3.36, 0],
      [1.92, 3.08, 0],
    ],
    0.12,
    P.woodWarm,
  );
  for (let z of [-0.56, 0.56])
    tube(
      b,
      "wood",
      [
        [-1.9, 3.07, z],
        [-1, 3.3, z],
        [0, 3.45, z],
        [1, 3.3, z],
        [1.9, 3.07, z],
      ],
      0.085,
      P.woodWarm,
    );
  for (let x of [-1.55, -1, -0.5, 0, 0.5, 1, 1.55])
    box(b, "wood", 0.1, 0.12, 1.7, x, 3.44 - 0.17 * Math.abs(x), 0, P.woodWarm);
  slats(b, 2.5, 0.85);
  for (let yy of [1.27, 1.47, 1.67]) box(b, "wood", 2.5, 0.16, 0.11, 0, yy, -0.33, P.woodWarm);
  for (let x of [-1.05, 1.05])
    for (let z of [-0.28, 0.28])
      tube(
        b,
        "paint",
        [
          [x, 3.34, z],
          [x, 2.15, z],
          [x, 0.81, z],
        ],
        0.034,
        0xe5d7b2,
      );
  for (let x of [-0.68, 0, 0.68]) box(b, "cloth", 0.62, 0.16, 0.48, x, 1.03, 0.02, P.shutterBlue);
  for (let x of [-0.65, 0.65])
    box(b, "cloth", 0.56, 0.37, 0.16, x, 1.36, -0.25, P.trim, { rz: x * 0.08 });
  for (let i = 0; i < 10; i++) {
    let x = -1.72 + i * 0.38;
    for (let j = 0; j < 5; j++)
      b.add("leaf", createIvyLeafGeometry(), {
        x: x + (j - 2) * 0.09,
        y: 3.32 - 0.16 * Math.abs(x) + (j % 2) * 0.08,
        z: 0.54 + (j % 2) * 0.08,
        sx: 1.8,
        sy: 1.8,
        sz: 1.8,
        rz: (j - 2) * 0.42,
        tint: i % 2 ? P.leaf : P.leafLight,
      });
    b.add("plain", new T.SphereGeometry(0.065, 8, 6), {
      x,
      y: 3.23 - 0.17 * Math.abs(x),
      z: 0.6,
      tint: i % 3 ? P.lilac : P.white,
    });
  }
  for (let x of [-1.6, 1.6])
    for (let i = 0; i < 16; i++)
      b.add("leaf", createIvyLeafGeometry(), {
        x: x + (i % 2 ? 0.1 : -0.1),
        y: 0.45 + i * 0.17,
        z: 0.65,
        sx: 1.5,
        sy: 1.5,
        sz: 1.5,
        rz: i % 2 ? 0.65 : -0.65,
        tint: i % 3 ? P.leaf : P.leafLight,
      });
  lantern(b, 1.08, 2.68, 0.48);
  planter(b, r, -1.82, 0, 0.5, 0.6, P.pink);
  planter(b, r, 1.82, 0, 0.5, 0.6, P.lilac);
}
