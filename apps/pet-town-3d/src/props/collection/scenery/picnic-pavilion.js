import { T, P, box, cylinder, tube, lantern, extrudePropShape } from "../shared/geometry.js";
import { ivy, pot } from "./planting.js";

export function appendPicnic(builder, random) {
  box(builder, "stone", 3.8, 0.13, 3.2, 0, 0.065, 0, P.stone);
  for (let x of [-1.57, 1.57])
    for (let z of [-1.18, 1.18]) {
      box(builder, "wood", 0.19, 2.65, 0.19, x, 1.42, z, P.timber);
      box(builder, "stone", 0.32, 0.24, 0.32, x, 0.25, z, P.stone);
      tube(
        builder,
        "wood",
        [
          [x, 1.99, z],
          [x * 0.78, 2.62, z],
        ],
        0.067,
        P.woodWarm,
      );
    }
  for (let z of [-1.28, 1.28]) box(builder, "wood", 3.67, 0.16, 0.17, 0, 2.65, z, P.woodWarm);
  for (let x of [-1.57, 1.57]) box(builder, "wood", 0.17, 0.16, 2.65, x, 2.65, 0, P.woodWarm);
  let roof = new T.Shape();
  roof.moveTo(-1.93, 0);
  roof.quadraticCurveTo(-1.1, 0.21, 0, 1.15);
  roof.quadraticCurveTo(1.1, 0.21, 1.93, 0);
  roof.lineTo(1.93, -0.13);
  roof.quadraticCurveTo(1.1, 0.06, 0, 0.99);
  roof.quadraticCurveTo(-1.1, 0.06, -1.93, -0.13);
  roof.closePath();
  builder.add("shingle", extrudePropShape(roof, 3.03, 0.025, 30), {
    y: 2.69,
    tint: P.roofBlue,
    noAO: true,
  });
  for (let z of [-1.54, 1.54])
    tube(
      builder,
      "paint",
      [
        [-1.94, 2.59, z],
        [-1.05, 2.92, z],
        [0, 3.81, z],
        [1.05, 2.92, z],
        [1.94, 2.59, z],
      ],
      0.055,
      P.trim,
    );
  for (let i = 0; i < 8; i++)
    box(builder, "wood", 2.43, 0.08, 0.125, 0, 1.13, -0.45 + i * 0.13, P.woodWarm);
  for (let x of [-0.85, 0.85]) {
    tube(
      builder,
      "wood",
      [
        [x, 0.17, -0.49],
        [x, 0.96, 0.36],
      ],
      0.06,
      P.timber,
    );
    tube(
      builder,
      "wood",
      [
        [x, 0.17, 0.49],
        [x, 0.96, -0.36],
      ],
      0.06,
      P.timber,
    );
    box(builder, "wood", 0.14, 0.11, 1.9, x, 0.56, 0, P.timber);
  }
  for (let z of [-0.94, 0.94])
    for (let i = 0; i < 3; i++)
      box(builder, "wood", 2.63, 0.1, 0.15, 0, 0.72, z + (i - 1) * 0.17, P.woodWarm);
  box(builder, "cloth", 1.06, 0.016, 0.83, 0.3, 1.182, 0, P.trim);
  for (let x of [0, 0.35, 0.7])
    box(builder, "cloth", 0.12, 0.022, 0.83, x, 1.195, 0, P.shutterBlue);
  cylinder(builder, "plain", 0.19, 0.025, -0.23, 1.21, 0.1, P.trim);
  builder.add("plain", new T.SphereGeometry(0.11, 16, 10), {
    x: -0.23,
    y: 1.31,
    z: 0.1,
    sy: 0.45,
    tint: 0xc08f4e,
  });
  box(builder, "wood", 0.4, 0.23, 0.36, 0.89, 1.31, -0.21, P.woodWarm);
  tube(
    builder,
    "wood",
    [
      [0.7, 1.37, -0.21],
      [0.89, 1.61, -0.21],
      [1.08, 1.37, -0.21],
    ],
    0.022,
    P.woodDark,
  );
  cylinder(builder, "plain", 0.09, 0.18, 0.34, 1.28, 0.19, P.shutterBlue);
  lantern(builder, -1.28, 2.2, 1.18);
  for (let i = 0; i < 13; i++) ivy(builder, -1.55, 1.1 + i * 0.12, 1.3, 1.9, i % 2 ? 0.55 : -0.55);
  for (let x of [-1.95, 1.95]) pot(builder, random, x, 0.15, 0.96, 0.8, P.pink);
}
