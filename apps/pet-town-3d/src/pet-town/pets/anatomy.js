import { ball, cone, line } from "./mesh.js";
import { petMaterial } from "./material.js";
export function eyes(g, y = 1.68, z = 0.47, wide = 0.19) {
  g.userData.mouth = [y - 0.17, z + 0.035];
  for (const s of [-1, 1]) {
    ball(g, "#34342e", s * wide, y, z, 0.055, 0.075, 0.035);
    ball(g, "#fff8e9", s * wide - 0.016, y + 0.028, z + 0.031, 0.018);
  }
  g.userData.smile = line(
    g,
    "#684a3c",
    [
      [-0.07, y - 0.14, z + 0.01],
      [0, y - 0.18, z + 0.025],
      [0.07, y - 0.14, z + 0.01],
    ],
    0.014,
  );
}
export function cheeks(g, y = 1.52, z = 0.46, wide = 0.3) {
  g.userData.blush ??= petMaterial("#e79a86");
  g.userData.blush.transparent = true;
  for (const s of [-1, 1]) ball(g, g.userData.blush, s * wide, y, z, 0.062, 0.035, 0.025);
}
export function feet(g, c, spread = 0.22) {
  for (const s of [-1, 1]) {
    ball(g, c, s * spread, 0.34, 0.015, 0.105, 0.2, 0.12).userData.limb = { kind: "leg", side: s };
    ball(g, c, s * spread, 0.18, 0.08, 0.16, 0.14, 0.22).userData.limb = { kind: "foot", side: s };
  }
}
export function ears(g, c, kind = "point", y = 2.1) {
  for (const s of [-1, 1]) {
    if (kind === "point") {
      const m = cone(g, c, s * 0.3, y, 0, 0.17, 0.46);
      m.rotation.z = -s * 0.16;
      const e = cone(g, "#e2ac93", s * 0.3, y + 0.01, 0.07, 0.09, 0.26);
      e.rotation.z = -s * 0.16;
    } else ball(g, c, s * 0.36, y, 0, 0.17, 0.18, 0.13);
  }
}
export function body(g, c, belly = "#f3dec0", h = 1) {
  ball(g, c, 0, 0.77, 0, 0.4, 0.55 * h, 0.3);
  ball(g, belly, 0, 0.8, 0.268, 0.27, 0.36 * h, 0.065);
  feet(g, c);
  for (const s of [-1, 1]) {
    const m = ball(g, c, s * 0.39, 0.88, 0, 0.12, 0.27, 0.13);
    m.rotation.z = s * 0.25;
    m.userData.limb = { kind: "arm", side: s };
  }
}
export function head(g, c, sx = 0.46, sy = 0.44, sz = 0.39) {
  ball(g, c, 0, 1.7, 0, sx, sy, sz);
}
