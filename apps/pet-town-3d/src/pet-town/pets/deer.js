import { T, ball, line, eyes, scarf, satchel, leaf, body, head } from "./mesh.js";
export function deer() {
  const g = new T.Group();

  body(g, "#bd9464", "#e4d0a3");
  head(g, "#c7a173", 0.39, 0.43, 0.34);
  for (const s of [-1, 1]) {
    const e = ball(g, "#c4a072", s * 0.36, 1.99, 0, 0.18, 0.1, 0.1);
    e.rotation.z = s * 0.4;
    ball(g, "#d0af93", s * 0.37, 2, 0.072, 0.13, 0.055, 0.04);
    line(
      g,
      "#886a47",
      [
        [s * 0.17, 2.04, 0],
        [s * 0.2, 2.37, 0],
        [s * 0.34, 2.55, 0],
      ],
      0.031,
    );
    line(
      g,
      "#886a47",
      [
        [s * 0.21, 2.33, 0],
        [s * 0.1, 2.47, 0],
      ],
      0.023,
    );
  }
  ball(g, "#e2c9a1", 0, 1.55, 0.32, 0.22, 0.18, 0.13);
  eyes(g, 1.76, 0.32, 0.16);
  ball(g, "#554634", 0, 1.58, 0.469, 0.046, 0.037, 0.033);
  scarf(g, "#628473");
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++)
      ball(g, "#f1dcac", s * (0.22 + i * 0.035), 0.91 - i * 0.15, 0.25, 0.038);
  leaf(g, "#80a16b", -0.23, 2.36, 0.02, 0.8);
  satchel(g, "#aa8156");
  return g;
}
