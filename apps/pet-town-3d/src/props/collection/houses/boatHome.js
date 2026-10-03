import {
  T,
  P,
  box,
  cylinder,
  tube,
  door,
  window,
  porthole,
  lantern,
  planter,
  garden,
} from "../shared/geometry.js";
import { buildBarrelProp } from "../../street-furniture/build-barrel-prop.js";
export function boatHome(b, r) {
  box(b, "wood", 6.9, 0.3, 5.2, 0, 0.28, 0, P.woodWarm);
  for (let x = -3.3; x <= 3.3; x += 0.3) box(b, "wood", 0.27, 0.05, 5.15, x, 0.46, 0, P.woodLight);
  box(b, "stone", 5.2, 0.48, 3.7, 0, 0.72, 0, P.stone);
  box(b, "paint", 5.05, 2.55, 3.55, 0, 2.21, 0, 0x7baaa3);
  door(b, 0.25, 0.98, 1.84, P.doorTeal);
  window(b, r, -1.32, 2.2, 1.82, 1.06, 1.15, null, P.woodWarm);
  window(b, r, 2.58, 2.18, 0.2, 1, 1.15, null, P.woodWarm, Math.PI / 2);
  for (let row = 0; row < 14; row++) {
    let v0 = -1 + row / 7 + 0.001,
      v1 = v0 + 1 / 7 - 0.002,
      verts = [],
      indices = [];
    for (let i = 0; i <= 36; i++) {
      let u = -1 + i / 18;
      for (let v of [v0, v1])
        verts.push(
          u * 3.4,
          3.46 + 1.7 * (1 - v * v) + 0.25 * u * u,
          v * 2.24 * Math.sqrt(1 - 0.7 * u * u),
        );
    }
    for (let i = 0; i < 36; i++) {
      let a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    let geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    b.add("wood", geo, {
      tint: row % 2 ? 0xaf8254 : 0xc09361,
      noAO: true,
      uv: { grain: 0 },
    });
  }
  tube(
    b,
    "wood",
    [
      [-3.5, 5.42, 0],
      [-2, 5.27, 0],
      [0, 5.19, 0],
      [2, 5.27, 0],
      [3.5, 5.42, 0],
    ],
    0.105,
    P.woodDark,
  );
  for (let side of [-1, 1]) {
    let pts = [];
    for (let i = 0; i <= 24; i++) {
      let u = -1 + i / 12;
      pts.push([u * 3.4, 3.49 + 0.25 * u * u, side * 2.23 * Math.sqrt(1 - 0.7 * u * u)]);
    }
    tube(b, "paint", pts, 0.095, P.trim);
  }
  for (let x of [-2.3, 0, 2.3]) {
    let u = x / 3.4,
      zz = 1.63 * Math.sqrt(1 - 0.7 * u * u);
    b.push(x, 4.28 + 0.25 * u * u, zz, -0.5, 0, 0);
    porthole(b, r, 0, 0, 0, 0.27, P.brass);
    b.pop();
  }
  for (let x of [-3.15, -1.5, 1.5, 3.15])
    cylinder(b, "wood", 0.11, 1.12, x, 1.02, 2.43, P.woodDark);
  for (let x of [-3.15, 3.15])
    for (let z of [-2.3, 0]) cylinder(b, "wood", 0.11, 1.12, x, 1.02, z, P.woodDark);
  for (let yy of [1, 1.38]) {
    tube(
      b,
      "paint",
      [
        [-3.15, yy, 2.43],
        [-2.3, yy - 0.18, 2.43],
        [-1.5, yy, 2.43],
      ],
      0.04,
      0xe8d8ad,
    );
    tube(
      b,
      "paint",
      [
        [1.5, yy, 2.43],
        [2.3, yy - 0.18, 2.43],
        [3.15, yy, 2.43],
      ],
      0.04,
      0xe8d8ad,
    );
  }
  b.add("paint", new T.TorusGeometry(0.4, 0.12, 12, 32), {
    x: 2.12,
    y: 1.93,
    z: 1.89,
    tint: P.trim,
  });
  for (let a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5])
    b.add("paint", new T.TorusGeometry(0.4, 0.125, 10, 10, a, 0.3), {
      x: 2.12,
      y: 1.93,
      z: 1.9,
      tint: P.doorRed,
    });
  for (let x of [-2.85, -2.55]) {
    box(b, "wood", 0.06, 2.22, 0.08, x, 1.9, 1.86, P.woodWarm, { rz: 0.15 });
    box(b, "wood", 0.22, 0.7, 0.07, x + 0.08, 2.75, 1.84, P.woodWarm, {
      rz: 0.15,
    });
  }
  lantern(b, 0.98, 2.8, 1.98);
  planter(b, r, 2.8, 0.47, -1.6, 0.8, P.lilac);
  b.push(-2.83, 0.45, 1.95);
  buildBarrelProp(b, r, { h: 0.62, r: 0.28 });
  b.pop();
  garden(b, r, 4);
}
