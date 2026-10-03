import { T, P, box, tube, planter } from "../shared/geometry.js";
import { ivy, bloom } from "./planting.js";

export function appendRoseGate(builder, random) {
  for (let x of [-1.13, 1.13]) {
    box(builder, "stone", 0.5, 0.35, 0.55, x, 0.175, 0, P.stone);
    box(builder, "wood", 0.2, 2.8, 0.2, x, 1.75, 0, P.timber);
    for (let z of [-0.27, 0.27])
      tube(
        builder,
        "wood",
        [
          [x, 0.37, z],
          [x, 2.3, z],
          [x * 0.76, 3.14, z],
          [0, 3.5, z],
        ],
        0.085,
        P.woodWarm,
      );
    for (let y of [0.8, 1.4, 2]) box(builder, "wood", 0.12, 0.09, 0.65, x, y, 0, P.woodWarm);
  }
  for (let x of [-1.06, -0.78, -0.4, 0, 0.4, 0.78, 1.06])
    box(builder, "wood", 0.09, 0.12, 0.75, x, 3.47 - 0.45 * Math.abs(x), 0, P.woodWarm);
  for (let side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      let x = side * (1.42 + i * 0.19),
        h = 1.2 + 0.1 * Math.sin(i * 0.7);
      box(builder, "paint", 0.13, h, 0.08, x, h / 2, 0.04, P.shutterGreen);
      builder.add("paint", new T.ConeGeometry(0.09, 0.16, 4), {
        x,
        y: h + 0.08,
        z: 0.04,
        ry: Math.PI / 4,
        tint: P.shutterGreen,
      });
    }
    for (let y of [0.34, 0.85])
      box(builder, "paint", 1.2, 0.1, 0.08, side * 1.82, y, -0.04, P.shutterGreen);
    builder.push(side * 0.49, 0, 0.06, 0, side * -0.24, 0);
    for (let y of [0.37, 1.0]) box(builder, "paint", 0.92, 0.11, 0.11, 0, y, 0, 0x8aab89);
    for (let x of [-0.36, -0.18, 0, 0.18, 0.36]) {
      let h = 1.33 - 0.38 * Math.abs(x);
      box(builder, "paint", 0.12, h, 0.075, x, h / 2, 0, 0x8aab89);
      builder.add("paint", new T.SphereGeometry(0.075, 12, 8), { x, y: h, z: 0, tint: 0x8aab89 });
    }
    box(builder, "metal", 0.07, 0.15, 0.025, -side * 0.36, 0.95, 0.07, P.brass);
    builder.pop();
  }
  for (let i = 0; i < 60; i++) {
    let a = -Math.PI / 2 + (i * Math.PI) / 59,
      x = Math.sin(a) * 1.12,
      y = 2.38 + Math.cos(a) * 1.0;
    ivy(builder, x + random.range(-0.09, 0.09), y + random.range(-0.08, 0.08), 0.36, 2.2, a);
    if (i % 4 === 0) bloom(builder, random, x, y + 0.08, 0.42, i % 8 ? P.pink : P.trim, 2.7);
  }
  for (let side of [-1, 1])
    for (let i = 0; i < 16; i++) {
      ivy(
        builder,
        side * 1.12 + random.range(-0.09, 0.09),
        0.65 + i * 0.12,
        0.32,
        1.8,
        i % 2 ? 0.6 : -0.6,
      );
      if (i % 5 === 0) bloom(builder, random, side * 1.1, 0.77 + i * 0.12, 0.38, P.lilac, 2.3);
    }
  for (let x of [-1.93, 1.93]) planter(builder, random, x, 0, 0.42, 0.75, P.pink);
}
