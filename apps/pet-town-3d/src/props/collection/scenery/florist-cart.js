import { T, P, box, tube, lantern } from "../shared/geometry.js";
import { bloom, pot } from "./planting.js";

export function appendFlowerCart(builder, random) {
  for (let x of [-1.05, 1.05]) {
    builder.add("metal", new T.TorusGeometry(0.42, 0.045, 10, 40), {
      x,
      y: 0.45,
      z: 0.28,
      ry: Math.PI / 2,
      tint: P.iron,
    });
    builder.add("wood", new T.TorusGeometry(0.37, 0.06, 10, 32), {
      x,
      y: 0.45,
      z: 0.28,
      ry: Math.PI / 2,
      tint: P.woodWarm,
    });
    builder.add("metal", new T.CylinderGeometry(0.09, 0.09, 0.16, 20), {
      x,
      y: 0.45,
      z: 0.28,
      rz: Math.PI / 2,
      tint: P.brass,
    });
    for (let i = 0; i < 10; i++) {
      let a = (i * Math.PI) / 5;
      tube(
        builder,
        "wood",
        [
          [x, 0.45, 0.28],
          [x, 0.45 + Math.sin(a) * 0.36, 0.28 + Math.cos(a) * 0.36],
        ],
        0.025,
        P.woodWarm,
      );
    }
  }
  box(builder, "wood", 2.0, 0.16, 1.1, 0, 0.73, 0, P.woodWarm);
  for (let x of [-0.93, 0.93]) {
    box(builder, "wood", 0.1, 0.53, 1.12, x, 1.04, 0, P.woodWarm);
    box(builder, "paint", 0.13, 0.1, 1.2, x, 1.36, 0, 0x608b82);
  }
  for (let z of [-0.53, 0.53]) {
    box(builder, "wood", 1.96, 0.5, 0.08, 0, 1.06, z, P.woodWarm);
    for (let i = 0; i < 7; i++)
      box(
        builder,
        "wood",
        0.025,
        0.5,
        0.03,
        -0.9 + i * 0.3,
        1.06,
        z + 0.045 * Math.sign(z),
        P.woodDark,
      );
    box(builder, "paint", 2.09, 0.1, 0.11, 0, 1.36, z, 0x608b82);
  }
  for (let x of [-0.5, 0.5]) {
    tube(
      builder,
      "wood",
      [
        [x, 0.77, -0.5],
        [x, 1.13, -1.0],
        [x, 1.22, -1.4],
      ],
      0.047,
      P.woodWarm,
    );
    box(builder, "wood", 0.09, 0.7, 0.09, x, 0.38, -0.48, P.woodDark);
  }
  box(builder, "wood", 1.15, 0.09, 0.08, 0, 1.22, -1.4, P.woodDark);
  for (let i = 0; i < 6; i++)
    pot(
      builder,
      random,
      -0.67 + (i % 3) * 0.65,
      0.84,
      i < 3 ? 0.19 : -0.25,
      0.9,
      [P.pink, P.lilac, P.yellow][i % 3],
    );
  for (let x of [-0.88, 0.88]) box(builder, "wood", 0.1, 1.7, 0.1, x, 1.87, -0.48, P.timber);
  box(builder, "paint", 1.72, 0.41, 0.12, 0, 2.78, -0.48, P.shutterBlue);
  box(builder, "wood", 1.88, 0.075, 0.18, 0, 3.02, -0.48, P.woodWarm);
  for (let i = 0; i < 7; i++)
    bloom(builder, random, -0.63 + i * 0.21, 2.76, -0.39, i % 2 ? P.trim : P.yellow, 2.2);
  tube(
    builder,
    "metal",
    [
      [0.87, 2.92, -0.45],
      [1.15, 3.03, -0.39],
      [1.22, 2.72, -0.39],
    ],
    0.032,
    P.brass,
  );
  lantern(builder, 1.22, 2.31, -0.39);
  pot(builder, random, -1.3, 0, -0.08, 1.15, P.lilac);
  box(builder, "metal", 0.29, 0.28, 0.32, 1.35, 0.2, -0.25, 0x799d94);
  tube(
    builder,
    "metal",
    [
      [1.25, 0.37, -0.25],
      [1.4, 0.66, -0.25],
      [1.6, 0.4, -0.25],
    ],
    0.025,
    P.brass,
  );
  tube(
    builder,
    "metal",
    [
      [1.47, 0.3, -0.25],
      [1.72, 0.4, -0.25],
    ],
    0.05,
    0x799d94,
  );
}
