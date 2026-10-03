import { T, P, cylinder, tube } from "../shared/geometry.js";
import { createIvyLeafGeometry } from "../../building-details/create-ivy-leaf-geometry.js";
export function appendMushroomLantern(b, lights) {
  cylinder(b, "stone", 0.28, 0.18, 0, 0.09, 0, P.stone);
  tube(
    b,
    "wood",
    [
      [0, 0.18, 0],
      [-0.04, 0.5, 0],
      [0.04, 0.86, 0],
    ],
    0.1,
    P.woodWarm,
  );
  b.add("plain", new T.SphereGeometry(0.65, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), {
    y: 0.93,
    sy: 0.5,
    tint: 0xdc8167,
    noAO: true,
  });
  cylinder(b, "lamp", 0.54, 0.08, 0, 0.9, 0, P.trim);
  for (let i = 0; i < 11; i++) {
    let a = i * 2.4,
      rr = 0.13 + (i % 3) * 0.13;
    b.add("plain", new T.SphereGeometry(0.075, 16, 10), {
      x: Math.sin(a) * rr,
      y: 0.93 + Math.sqrt(0.65 * 0.65 - rr * rr) * 0.5,
      z: Math.cos(a) * rr,
      sy: 0.25,
      tint: P.trim,
      noAO: true,
    });
  }
  for (let i = 0; i < 3; i++)
    b.add("leaf", createIvyLeafGeometry(), {
      x: 0.13,
      y: 0.1 + i * 0.08,
      z: 0.06,
      sx: 1.6,
      sy: 1.6,
      sz: 1.6,
      ry: i,
      tint: P.leaf,
    });
  lights.push({ x: 0, y: 0.88, z: 0 });
}
