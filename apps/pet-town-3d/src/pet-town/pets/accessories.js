import { ball, box, ring, line } from "./mesh.js";
export function scarf(g, c, y = 1.24) {
  ring(g, c, 0, y, 0, 0.31, 0.08, Math.PI / 2);
  box(g, c, 0.18, y - 0.21, 0.32, 0.14, 0.34, 0.07);
  ball(g, "#edcea2", 0.18, y - 0.35, 0.365, 0.035);
}
export function satchel(g, c = "#916745", side = 1) {
  box(g, c, side * 0.43, 0.76, 0.08, 0.23, 0.31, 0.22);
  box(g, "#bd9565", side * 0.43, 0.86, 0.2, 0.25, 0.12, 0.04);
  ball(g, "#f5d386", side * 0.43, 0.83, 0.23, 0.034);
  line(
    g,
    c,
    [
      [-side * 0.24, 1.28, 0.28],
      [side * 0.18, 1.06, 0.36],
      [side * 0.44, 0.76, 0.21],
    ],
    0.034,
  );
}
export function leaf(g, c, x, y, z, angle = 0) {
  const m = ball(g, c, x, y, z, 0.08, 0.19, 0.035);
  m.rotation.z = angle;
  return m;
}
