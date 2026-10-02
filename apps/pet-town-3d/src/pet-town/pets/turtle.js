import { T, ball, ring, line, eyes, scarf, leaf, body, head } from "./mesh.js";
export function turtle() {
  const g = new T.Group();

  body(g, "#96a075", "#d2bd84", 0.8);
  head(g, "#b5b988", 0.44, 0.36, 0.37);
  eyes(g, 1.73, 0.36);
  ball(g, "#756f47", 0, 0.87, -0.18, 0.55, 0.58, 0.32);
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++)
      ball(g, "#8b8759", s * 0.42, 0.58 + i * 0.2, -0.18, 0.09, 0.1, 0.22);
  for (const s of [-1, 1]) ring(g, "#827144", s * 0.19, 1.73, 0.411, 0.105, 0.016);
  line(
    g,
    "#827144",
    [
      [-0.08, 1.74, 0.412],
      [0, 1.77, 0.413],
      [0.08, 1.74, 0.412],
    ],
    0.012,
  );
  scarf(g, "#977054");
  ball(g, "#728d57", 0.1, 1.28, -0.22, 0.25, 0.13, 0.22);
  leaf(g, "#8fac69", 0.18, 1.42, -0.26, -0.6);

  return g;
}
