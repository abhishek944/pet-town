import { T, P, cylinder, tube } from "../shared/geometry.js";
import { bloom, pot } from "./planting.js";

export function appendFountain(builder, random) {
  cylinder(builder, "stone", 1.23, 0.23, 0, 0.115, 0, P.stone, 0.99);
  cylinder(builder, "stone", 1.07, 0.2, 0, 0.31, 0, P.stone);
  builder.add("stone", new T.TorusGeometry(1.02, 0.1, 14, 64), {
    y: 0.43,
    rx: Math.PI / 2,
    tint: P.stone,
  });
  cylinder(builder, "collectionWater", 0.96, 0.035, 0, 0.385, 0, 0x87bfc3);
  cylinder(builder, "stone", 0.2, 1.2, 0, 1.01, 0, P.stone, 0.13);
  for (let y of [0.62, 1.35]) cylinder(builder, "stone", 0.28, 0.1, 0, y, 0, P.stone);
  builder.add("stone", new T.TorusGeometry(0.49, 0.09, 12, 48), {
    y: 1.48,
    rx: Math.PI / 2,
    tint: P.stone,
  });
  cylinder(builder, "stone", 0.49, 0.09, 0, 1.44, 0, P.stone, 0.45);
  cylinder(builder, "collectionWater", 0.42, 0.025, 0, 1.51, 0, 0x87bfc3);
  tube(
    builder,
    "metal",
    [
      [0, 1.53, 0],
      [-0.06, 1.78, 0],
      [0.08, 2.06, 0],
    ],
    0.045,
    0x608b72,
  );
  for (let i = 0; i < 6; i++) {
    let a = (i * Math.PI) / 3;
    builder.add("paint", new T.SphereGeometry(0.16, 24, 16), {
      x: Math.sin(a) * 0.15,
      y: 2.05,
      z: Math.cos(a) * 0.15,
      sx: 0.5,
      sy: 1.25,
      sz: 0.8,
      ry: a,
      rz: 0.28,
      tint: i % 2 ? P.pink : P.trim,
    });
  }
  builder.add("metal", new T.SphereGeometry(0.08, 16, 12), { y: 2.19, tint: P.brass });
  for (let i = 0; i < 4; i++) {
    let a = (i * Math.PI) / 2 + 0.25,
      x = Math.sin(a) * 0.35,
      z = Math.cos(a) * 0.35;
    tube(
      builder,
      "collectionWater",
      [
        [x, 1.5, z],
        [x * 1.8, 1.35, z * 1.8],
        [x * 2.15, 0.52, z * 2.15],
      ],
      0.022,
      0xbee1dc,
    );
  }
  for (let i = 0; i < 5; i++) {
    let a = i * 1.27,
      rr = 0.65;
    builder.add(
      "leaf",
      new T.CylinderGeometry(0.19, 0.19, 0.013, 24, 1, false, 0.23, Math.PI * 2 - 0.45),
      { x: Math.sin(a) * rr, y: 0.421, z: Math.cos(a) * rr, ry: a, tint: P.leaf },
    );
    if (i % 2 === 0) bloom(builder, random, Math.sin(a) * rr, 0.445, Math.cos(a) * rr, P.pink, 2.1);
  }
  for (let x of [-1.4, 1.4]) pot(builder, random, x, 0, 0.4, 0.7, P.lilac);
}
