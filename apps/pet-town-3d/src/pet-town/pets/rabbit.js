import { T, ball, cone, cyl, eyes, cheeks, scarf, leaf, body, head } from "./mesh.js";
export function rabbit() {
  const g = new T.Group();

  body(g, "#d5bca5", "#f9ecd5");
  head(g, "#e5d1b9");
  for (const s of [-1, 1]) {
    const m = ball(g, "#d5bca5", s * 0.2, 2.29, 0, 0.12, 0.47, 0.13);
    m.rotation.z = -s * 0.11;
    ball(g, "#d7998e", s * 0.2, 2.3, 0.09, 0.065, 0.32, 0.05);
  }
  eyes(g, 1.75, 0.37);
  cheeks(g, 1.56, 0.38);
  ball(g, "#b8736f", 0, 1.57, 0.412, 0.036);
  scarf(g, "#9eab77");
  cyl(g, "#c2995d", 0, 2.01, 0, 0.57, 0.57, 0.045);
  cyl(g, "#d6b37a", 0, 2.11, 0, 0.29, 0.32, 0.18);
  const carrot = cone(g, "#d58843", 0.46, 0.79, 0.21, 0.09, 0.36);
  carrot.rotation.z = -0.4;
  carrot.userData.limb = { kind: "held", side: 1 };
  for (let i = 0; i < 3; i++)
    leaf(g, "#668751", 0.43 + i * 0.04, 1.03, 0.21, (i - 1) * 0.4).userData.limb = {
      kind: "held",
      side: 1,
    };
  ball(g, "#f9eddc", 0, 0.5, -0.32, 0.17);

  return g;
}
