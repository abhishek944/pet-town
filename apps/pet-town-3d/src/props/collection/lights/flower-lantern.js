import { P, box, cylinder, tube } from "../shared/geometry.js";
import { appendLightBase, appendHexLantern } from "./details.js";
import { appendHangingBasketGeometry } from "../../cottages/append-hanging-basket-geometry.js";
import { createIvyLeafGeometry } from "../../building-details/create-ivy-leaf-geometry.js";
export function appendFlowerLantern(b, r, lights) {
  appendLightBase(b);
  box(b, "wood", 0.18, 2.8, 0.18, 0, 1.7, 0, P.timber, { uv: { grain: 1 } });
  for (let yy of [0.52, 3.04]) box(b, "wood", 0.29, 0.1, 0.29, 0, yy, 0, P.woodDark);
  cylinder(b, "wood", 0.19, 0.2, 0, 3.22, 0, P.woodWarm, 0.01);
  tube(
    b,
    "metal",
    [
      [0, 2.95, 0.1],
      [0.28, 3.07, 0.13],
      [0.58, 2.99, 0.13],
      [0.67, 2.73, 0.13],
    ],
    0.045,
    P.brass,
  );
  appendHexLantern(b, 0.67, 2.21, 0.13, P.roofBlue);
  lights.push({ x: 0.67, y: 2.21, z: 0.13 });
  appendHangingBasketGeometry(b, r, -0.28, 2.15, 0.22, P.pink);
  for (let i = 0; i < 10; i++)
    b.add("leaf", createIvyLeafGeometry(), {
      x: -0.13 + (i % 2 ? 0.08 : -0.08),
      y: 0.65 + i * 0.13,
      z: 0.16,
      sx: 1.2,
      sy: 1.2,
      sz: 1.2,
      rz: i % 2 ? 0.6 : -0.6,
      tint: P.leaf,
    });
}
