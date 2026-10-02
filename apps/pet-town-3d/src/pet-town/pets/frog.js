import { T, ball, box, line, cheeks, scarf, satchel, body, head } from "./mesh.js";
export function frog() {
  const g = new T.Group();

  body(g, "#98ac6c", "#d8d694");
  head(g, "#9fba7a", 0.5, 0.34, 0.38);
  for (const s of [-1, 1]) {
    ball(g, "#9fba7a", s * 0.31, 2.01, 0.07, 0.19, 0.21, 0.18);
    ball(g, "#edf0ce", s * 0.31, 2.02, 0.214, 0.118);
    ball(g, "#3d4533", s * 0.31, 2.02, 0.316, 0.05, 0.076, 0.035);
    ball(g, "#fff6de", s * 0.31 - 0.014, 2.05, 0.344, 0.016);
  }
  g.userData.mouth = [1.58, 0.43];
  g.userData.smile = line(
    g,
    "#5b6541",
    [
      [-0.2, 1.64, 0.372],
      [0, 1.56, 0.401],
      [0.2, 1.64, 0.372],
    ],
    0.017,
  );
  cheeks(g, 1.68, 0.373, 0.34);
  box(g, "#d3a850", 0, 0.8, 0.31, 0.45, 0.5, 0.05);
  scarf(g, "#d8b45b");
  for (let i = 0; i < 3; i++) ball(g, "#f2d997", 0, 1.02 - i * 0.13, 0.35, 0.025);
  satchel(g, "#958052");

  return g;
}
