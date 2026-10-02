import { T, ball, box, cyl, eyes, cheeks, scarf, leaf, body, head } from "./mesh.js";
export function mushroom() {
  const g = new T.Group();

  body(g, "#d5c7a6", "#eee1bf", 0.75);
  head(g, "#e4d6b4", 0.33, 0.37, 0.29);
  eyes(g, 1.64, 0.29, 0.14);
  cheeks(g, 1.48, 0.282, 0.23);
  ball(g, "#b76553", 0, 2.02, 0, 0.68, 0.37, 0.59);
  cyl(g, "#ecd5a7", 0, 1.96, 0, 0.59, 0.59, 0.045);
  for (const [x, z] of [
    [-0.28, 0.27],
    [0.27, 0.42],
    [0.43, -0.13],
    [-0.4, -0.2],
    [0, -0.08],
  ]) {
    const y = 2.02 + 0.37 * Math.sqrt(1 - (x / 0.68) ** 2 - (z / 0.59) ** 2) + 0.018;
    ball(g, "#f2dfb7", x, y, z, 0.09, 0.036, 0.08);
  }
  scarf(g, "#8fa083", 1.18);
  box(g, "#8b7257", -0.37, 0.66, 0.15, 0.2, 0.3, 0.16).userData.limb = { kind: "held", side: -1 };
  leaf(g, "#8caa69", -0.38, 0.94, 0.14, -0.2).userData.limb = { kind: "held", side: -1 };

  return g;
}
