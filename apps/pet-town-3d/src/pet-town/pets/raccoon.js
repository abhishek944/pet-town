import { T, ball, box, ring, eyes, scarf, satchel, ears, body, head } from "./mesh.js";
export function raccoon() {
  const g = new T.Group();

  body(g, "#888477", "#d8c6a4");
  head(g, "#aca491");
  ears(g, "#6e6b61", "round");
  for (const s of [-1, 1]) {
    const patch = ball(g, "#4d4d46", s * 0.19, 1.73, 0.33, 0.2, 0.11, 0.085);
    patch.rotation.z = s * 0.2;
  }
  ball(g, "#e8d5b3", 0, 1.53, 0.37, 0.25, 0.16, 0.13);
  eyes(g, 1.75, 0.424, 0.19);
  ball(g, "#443a30", 0, 1.57, 0.52, 0.062, 0.04, 0.04);
  scarf(g, "#b35f45");
  satchel(g, "#697851", -1);
  const tail = ball(g, "#706e61", 0.41, 0.56, -0.25, 0.19, 0.42, 0.18);
  tail.rotation.z = 0.7;
  for (let i = 0; i < 3; i++)
    ball(g, "#464944", 0.26 + i * 0.095, 0.43 + i * 0.13, -0.255, 0.16, 0.064, 0.19);
  box(g, "#d4a65e", 0.52, 0.61, 0.16, 0.16, 0.19, 0.16).userData.limb = { kind: "held", side: 1 };
  ring(g, "#8c6e41", 0.52, 0.77, 0.16, 0.07, 0.013).userData.limb = { kind: "held", side: 1 };

  return g;
}
