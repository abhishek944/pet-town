import { T, P, cylinder, tube, planter } from "../shared/geometry.js";
import { appendLightBase } from "./details.js";
import { createIvyLeafGeometry } from "../../building-details/create-ivy-leaf-geometry.js";
export function appendLilyBellLamp(b, r, lights) {
  appendLightBase(b);
  tube(
    b,
    "metal",
    [
      [0, 0.3, 0],
      [-0.17, 1.3, 0],
      [-0.13, 2.5, 0],
      [0.3, 3.17, 0],
      [0.71, 2.87, 0],
    ],
    0.065,
    0x46745d,
  );
  for (let side of [-1, 1]) {
    b.add("leaf", createIvyLeafGeometry(), {
      x: -0.13,
      y: 1.3 + (side + 1) * 0.33,
      z: 0.03,
      sx: 3,
      sy: 3.5,
      sz: 3,
      rz: side * 0.65,
      tint: 0x669465,
    });
  }
  b.push(0.71, 2.77, 0);
  cylinder(b, "metal", 0.44, 0.39, 0, -0.1, 0, P.brass, 0.06);
  for (let i = 0; i < 6; i++) {
    let a = (i * Math.PI) / 3;
    b.add("paint", new T.SphereGeometry(0.14, 20, 12), {
      x: Math.sin(a) * 0.33,
      y: -0.26,
      z: Math.cos(a) * 0.33,
      sx: 0.8,
      sy: 1.15,
      sz: 0.45,
      ry: a,
      tint: P.trim,
    });
  }
  b.add("lamp", new T.SphereGeometry(0.2, 24, 16), { y: -0.31, tint: P.trim, noAO: true });
  b.pop();
  planter(b, r, -0.24, 0, 0.22, 0.5, P.lilac);
  lights.push({ x: 0.71, y: 2.46, z: 0 });
}
