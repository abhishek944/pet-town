import { T, P, box, cylinder } from "../shared/geometry.js";
export function appendLightBase(b) {
  cylinder(b, "stone", 0.33, 0.3, 0, 0.15, 0, P.stone, 0.28);
  cylinder(b, "metal", 0.17, 0.09, 0, 0.34, 0, P.brass);
}
export function appendHexLantern(b, x, y, z, col = 0x365e59) {
  b.push(x, y, z);
  cylinder(b, "lamp", 0.17, 0.47, 0, 0, 0, P.trim);
  for (let i = 0; i < 6; i++) {
    let a = (i * Math.PI) / 3;
    box(b, "metal", 0.035, 0.51, 0.035, Math.sin(a) * 0.185, 0, Math.cos(a) * 0.185, col);
  }
  cylinder(b, "metal", 0.235, 0.075, 0, -0.29, 0, col);
  cylinder(b, "metal", 0.27, 0.2, 0, 0.37, 0, col, 0.035);
  b.add("metal", new T.TorusGeometry(0.06, 0.013, 8, 16), { y: 0.55, tint: P.brass });
  b.pop();
}
