import { P as p } from "../shared/geometry.js";
import { block } from "./cottage-style.js";
export function conservatory(b, r) {
  let w = 3.8,
    d = 3.6,
    h = 2.7;
  block(b, "stone", w + 0.3, 0.45, d + 0.3, 0, 0.22, 0, p.stone);
  block(b, "collectionGlass", w, h, d, 0, h / 2 + 0.45, 0, 0xf2ffff, {
    uv: { mode: "unit" },
    noAO: true,
  });
  for (let x = -w / 2; x <= w / 2 + 0.01; x += w / 5) {
    block(b, "paint", 0.1, h, 0.12, x, h / 2 + 0.45, d / 2 + 0.05, p.trim);
    block(b, "paint", 0.1, h, 0.12, x, h / 2 + 0.45, -d / 2 - 0.05, p.trim);
  }
  for (let yy of [0.48, 1.75, 3.15])
    for (let z of [-1, 1]) block(b, "paint", w + 0.1, 0.1, 0.14, 0, yy, (z * d) / 2, p.trim);
  for (let x of [-1, 1])
    for (let z = -d / 2; z <= d / 2; z += d / 4)
      block(b, "paint", 0.12, h, 0.1, (x * w) / 2, h / 2 + 0.45, z, p.trim);
  let slope = 0.55,
    len = (d / 2 + 0.22) / Math.cos(slope);
  for (let side of [-1, 1]) {
    block(
      b,
      "collectionGlass",
      w + 0.4,
      0.12,
      len,
      0,
      3.15 + (d / 4) * Math.tan(slope),
      (side * d) / 4,
      0xeeffff,
      { rx: side * slope, noAO: true, uv: { mode: "unit" } },
    );
    for (let x = -w / 2; x <= w / 2; x += w / 5)
      block(
        b,
        "paint",
        0.09,
        0.14,
        len,
        x,
        3.15 + (d / 4) * Math.tan(slope),
        (side * d) / 4,
        p.trim,
        { rx: side * slope, noAO: true },
      );
  }
  block(b, "paint", w + 0.4, 0.12, 0.15, 0, 3.15 + (d / 2) * Math.tan(slope), 0, p.trim);
}
