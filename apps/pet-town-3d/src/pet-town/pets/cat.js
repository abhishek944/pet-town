import { T, ball, box, line, eyes, scarf, ears, body, head } from "./mesh.js";
export function cat() {
  const g = new T.Group();

  body(g, "#73888d", "#dbe2cf");
  head(g, "#82989b");
  ears(g, "#687f87");
  ball(g, "#c0cdbe", 0, 1.56, 0.35, 0.24, 0.16, 0.12);
  eyes(g, 1.76, 0.38);
  ball(g, "#a76765", 0, 1.6, 0.48, 0.033);
  scarf(g, "#cd995d");
  box(g, "#426954", -0.44, 0.74, 0.18, 0.24, 0.3, 0.14).userData.limb = { kind: "held", side: -1 };
  box(g, "#f2d9ab", -0.44, 0.74, 0.26, 0.19, 0.24, 0.04).userData.limb = { kind: "held", side: -1 };
  line(
    g,
    "#677d85",
    [
      [0.36, 0.44, -0.18],
      [0.66, 0.66, -0.23],
      [0.65, 1.05, -0.2],
      [0.52, 1.09, -0.2],
    ],
    0.07,
  );
  for (const s of [-1, 1])
    for (let i = 0; i < 2; i++)
      line(
        g,
        "#f1dfc3",
        [
          [s * 0.25, 1.56 - i * 0.06, 0.42],
          [s * 0.44, 1.61 - i * 0.09, 0.4],
        ],
        0.007,
      );

  return g;
}
