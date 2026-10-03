import { T, P, box, cylinder, tube, extrudePropShape } from "../shared/geometry.js";
import { ivy, pot } from "./planting.js";

export function appendAcornMailbox(builder, random) {
  cylinder(builder, "stone", 0.47, 0.2, 0, 0.1, 0, P.stone);
  tube(
    builder,
    "wood",
    [
      [0, 0.17, 0],
      [-0.12, 0.65, 0],
      [0, 1.2, 0],
    ],
    0.17,
    P.bark,
  );
  tube(
    builder,
    "wood",
    [
      [-0.05, 0.7, 0],
      [0.38, 0.9, 0.02],
      [0.54, 1.29, 0.02],
    ],
    0.08,
    P.bark,
  );
  box(builder, "wood", 1.0, 0.12, 0.8, 0, 1.18, 0, P.woodWarm);
  builder.add("wood", new T.SphereGeometry(0.55, 40, 28), {
    y: 1.63,
    sy: 1.05,
    sz: 0.83,
    tint: 0xa7784b,
  });
  let cap = new T.SphereGeometry(0.66, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  builder.add("wood", cap, { y: 1.88, sy: 0.62, sz: 0.82, tint: P.woodDark });
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 16; i++) {
      let a = (i * Math.PI) / 8 + (row % 2) * 0.13,
        rr = 0.63 - row * 0.11;
      builder.add("wood", new T.SphereGeometry(0.065, 10, 8), {
        x: Math.sin(a) * rr,
        y: 1.92 + row * 0.13,
        z: Math.cos(a) * rr * 0.82,
        sy: 0.35,
        tint: i % 2 ? P.woodWarm : P.bark,
      });
    }
  tube(
    builder,
    "wood",
    [
      [0, 2.26, 0],
      [0.03, 2.48, 0],
      [0.14, 2.53, 0],
    ],
    0.045,
    P.bark,
  );
  box(builder, "paint", 0.42, 0.57, 0.065, 0, 1.57, 0.46, 0x568b81);
  let hatch = new T.Shape();
  hatch.moveTo(-0.22, 0);
  hatch.lineTo(-0.22, 0.44);
  hatch.absarc(0, 0.44, 0.22, Math.PI, 0, true);
  hatch.lineTo(0.22, 0);
  hatch.closePath();
  builder.add("paint", extrudePropShape(hatch, 0.09, 0.02, 20), {
    y: 1.28,
    z: 0.49,
    tint: 0x568b81,
  });
  tube(
    builder,
    "metal",
    [
      [-0.16, 1.44, 0.56],
      [0, 1.47, 0.58],
      [0.16, 1.44, 0.56],
    ],
    0.018,
    P.brass,
  );
  box(builder, "paint", 0.27, 0.022, 0.06, 0, 1.81, 0.55, P.woodDark);
  box(builder, "metal", 0.035, 0.36, 0.035, 0.61, 1.76, 0.04, P.brass);
  ivy(builder, 0.61, 1.99, 0.055, 1.8, -0.65);
  box(builder, "sail", 0.28, 0.018, 0.21, -0.03, 1.4, 0.64, P.trim, { rx: 0.4 });
  for (let i = 0; i < 8; i++)
    ivy(builder, -0.1 + (i % 2) * 0.13, 0.26 + i * 0.1, 0.18, 1.4, i % 2 ? 0.7 : -0.7);
  pot(builder, random, -0.63, 0, 0.2, 0.7, P.pink);
  pot(builder, random, 0.68, 0, -0.14, 0.65, P.lilac);
}
