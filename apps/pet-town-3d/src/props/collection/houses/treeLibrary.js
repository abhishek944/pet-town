import {
  T,
  P,
  box,
  cylinder,
  tube,
  door,
  porthole,
  lantern,
  planter,
  garden,
  curvyRoof,
} from "../shared/geometry.js";
import { appendTrailingVineGeometry } from "../../building-details/append-trailing-vine-geometry.js";
import { createNoisyPropRock } from "../../geometry/create-noisy-prop-rock.js";
export function treeLibrary(b, r) {
  cylinder(b, "wood", 2.35, 3.9, 0, 2.1, 0, 0xc09969, 2);
  cylinder(b, "wood", 1, 2.1, -1.47, 4.66, -0.45, 0xbd915c, 0.83);
  cylinder(b, "wood", 0.8, 2.8, 1.15, 4.7, -0.7, 0xb58b56, 0.64);
  for (let [x, y, z, rr] of [
    [-1.47, 5.75, -0.45, 0.83],
    [1.15, 6.1, -0.7, 0.64],
  ]) {
    cylinder(b, "plain", rr, 0.08, x, y, z, P.woodLight);
    b.add("wood", new T.TorusGeometry(rr * 0.6, 0.065, 8, 32), {
      x,
      y: y + 0.045,
      z,
      rx: Math.PI / 2,
      tint: P.woodDark,
    });
  }
  for (let i = 0; i < 25; i++) {
    let a = (i * Math.PI) / 12.5,
      rad = 2.31 - r.range(0, 0.07);
    tube(
      b,
      "wood",
      [
        [Math.sin(a) * rad, 0.28, Math.cos(a) * rad],
        [Math.sin(a + 0.03) * rad, 1.4, Math.cos(a + 0.03) * rad],
        [Math.sin(a - 0.015) * (rad - 0.2), 2.7, Math.cos(a - 0.015) * (rad - 0.2)],
        [Math.sin(a) * (rad - 0.3), 4.07, Math.cos(a) * (rad - 0.3)],
      ],
      r.range(0.045, 0.085),
      i % 3 ? 0x8c663e : 0xa8804b,
    );
  }
  for (let i = 0; i < 8; i++) {
    let a = (i * Math.PI) / 4;
    tube(
      b,
      "wood",
      [
        [Math.sin(a) * 3.15, 0.04, Math.cos(a) * 3.15],
        [Math.sin(a) * 2.5, 0.35, Math.cos(a) * 2.5],
        [Math.sin(a) * 2.1, 1.6, Math.cos(a) * 2.1],
      ],
      0.25,
      P.timber,
    );
  }
  door(b, -0.74, 0.12, 2.18, 0x5088a3, 1.12, 2.2);
  b.push(-0.74, 0, 2.24);
  curvyRoof(b, 1.65, 0.8, 2.65, 0x7b9753);
  b.pop();
  box(b, "wood", 1.6, 1.75, 0.18, 0.9, 2.3, 2.17, P.woodDark);
  for (let yy of [1.54, 2.11, 2.68, 3.18]) {
    box(b, "wood", 1.8, 0.13, 0.42, 0.9, yy, 2.25, P.woodWarm);
    for (let i = 0; i < 8; i++) {
      let bh = 0.3 + (i % 3) * 0.055;
      box(
        b,
        "paint",
        0.12,
        bh,
        0.19,
        0.15 + i * 0.2,
        yy + 0.08 + bh / 2,
        2.3,
        [P.roofRed, P.doorTeal, P.yellow, P.roofBlue, P.lilac][i % 5],
        { rz: ((i % 3) - 1) * 0.04 },
      );
    }
  }
  box(b, "wood", 1.8, 0.25, 0.65, 0.9, 1.08, 2.31, P.woodWarm);
  box(b, "cloth", 1.5, 0.14, 0.55, 0.9, 1.27, 2.32, P.trim);
  for (let i = 0; i < 10; i++) {
    let a = 0.3 + i * 0.13,
      y = 0.14 + i * 0.33,
      x = 2.35 * Math.cos(a),
      z = 2.35 * Math.sin(a);
    box(b, "wood", 0.92, 0.15, 0.55, x, y, z, P.woodWarm, { ry: -a });
    box(
      b,
      "wood",
      0.06,
      0.9,
      0.06,
      x + Math.cos(a) * 0.35,
      y + 0.45,
      z + Math.sin(a) * 0.35,
      P.timber,
    );
  }
  tube(
    b,
    "wood",
    [
      [2.66, 0.6, 0.8],
      [2.45, 1.9, 1.5],
      [1.85, 3.3, 2.1],
    ],
    0.07,
    P.woodWarm,
  );
  lantern(b, -1.45, 2.36, 2);
  tube(
    b,
    "metal",
    [
      [-2, 3.45, 1.3],
      [-2.8, 3.6, 1.5],
      [-2.8, 3.32, 1.5],
    ],
    0.05,
    P.iron,
  );
  box(b, "wood", 0.75, 0.7, 0.13, -2.8, 2.93, 1.5, P.woodWarm);
  for (let x of [-2.95, -2.65])
    box(b, "paint", 0.25, 0.4, 0.07, x, 2.93, 1.6, P.trim, {
      rz: x < -2.8 ? 0.08 : -0.08,
    });
  porthole(b, r, 0, 4.35, 1.54, 0.35, P.trim);
  planter(b, r, -1.5, 3.92, -0.45, 0.75, P.white);
  planter(b, r, 1.35, 3.89, -0.8, 0.75, P.pink);
  for (let i = 0; i < 12; i++) {
    let a = i * 2.4,
      xx = Math.sin(a) * 1.7,
      zz = Math.cos(a) * 1.7;
    b.add("leaf", createNoisyPropRock(0.38, 2, 0.14, 3, i, 0.85), {
      x: xx,
      y: 3.95,
      z: zz,
      sy: 0.26,
      tint: i % 2 ? P.leaf : P.moss,
    });
    if (i % 2 === 0) appendTrailingVineGeometry(b, r, xx, 3.98, zz, 1.25, a, 15);
  }
  garden(b, r, 3.4);
}
