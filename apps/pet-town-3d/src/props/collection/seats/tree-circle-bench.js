import { T, P, box, cylinder, tube, planter } from "../shared/geometry.js";
import { slats } from "./slats.js";

export function treeSeat(b, r) {
  for (let i = 0; i < 6; i++) {
    let a = (i * Math.PI) / 3;
    b.push(Math.sin(a) * 1.24, 0, Math.cos(a) * 1.24, 0, a, 0);
    slats(b, 1.53, 0.61, 0);
    for (let yy of [0.97, 1.2]) box(b, "wood", 1.05, 0.17, 0.1, 0, yy, -0.37, P.woodWarm);
    for (let x of [-0.4, 0.4]) box(b, "wood", 0.08, 0.66, 0.08, x, 0.96, -0.4, P.woodDark);
    for (let x of [-0.54, 0.54])
      for (let z of [-0.2, 0.24]) box(b, "wood", 0.12, 0.57, 0.12, x, 0.285, z, P.woodDark);
    box(b, "wood", 1.35, 0.14, 0.12, 0, 0.42, -0.24, P.woodDark);
    b.pop();
  }
  cylinder(b, "wood", 0.17, 2.7, 0, 1.36, 0, P.bark, 0.1);
  for (let i = 0; i < 4; i++) {
    let a = (i * Math.PI) / 2;
    tube(
      b,
      "wood",
      [
        [0, 1.72, 0],
        [Math.sin(a) * 0.4, 2.22, Math.cos(a) * 0.4],
        [Math.sin(a) * 0.73, 2.55, Math.cos(a) * 0.73],
      ],
      0.065,
      P.bark,
    );
    b.add("leaf", new T.SphereGeometry(0.58, 18, 12), {
      x: Math.sin(a) * 0.65,
      y: 2.76,
      z: Math.cos(a) * 0.65,
      sy: 0.8,
      tint: i % 2 ? P.leaf : P.leafLight,
    });
  }
  b.add("leaf", new T.SphereGeometry(0.67, 18, 12), { y: 3.09, sy: 0.85, tint: P.leaf });
  for (let i = 0; i < 4; i++)
    planter(b, r, Math.sin(i * 1.57) * 0.45, 0, Math.cos(i * 1.57) * 0.45, 0.34, P.yellow);
}
