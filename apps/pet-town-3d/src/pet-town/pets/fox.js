import { T, ball, eyes, cheeks, scarf, satchel, ears, body, head } from "./mesh.js";
export function fox() {
  const g = new T.Group();

  body(g, "#b75d38", "#edcc96");
  head(g, "#dc8a4d");
  ears(g, "#b85f3e");
  for (const s of [-1, 1]) ball(g, "#f4dfbd", s * 0.17, 1.59, 0.35, 0.23, 0.19, 0.12);
  ball(g, "#473831", 0, 1.6, 0.5, 0.067, 0.044, 0.044);
  eyes(g, 1.77, 0.372, 0.2);
  scarf(g, "#527b68");
  satchel(g);
  const tail = ball(g, "#bc633b", -0.44, 0.6, -0.23, 0.25, 0.47, 0.25);
  tail.rotation.z = -0.62;
  ball(g, "#f4dfbd", -0.7, 0.9, -0.18, 0.18, 0.22, 0.18);
  cheeks(g, 1.59, 0.44, 0.29);

  return g;
}
