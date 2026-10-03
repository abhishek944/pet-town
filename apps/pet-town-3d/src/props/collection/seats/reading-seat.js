import { T, P, box, cylinder, lantern, extrudePropShape } from "../shared/geometry.js";

export function reading(b) {
  let radius = 2.1,
    span = 1.75,
    shape = new T.Shape();
  shape.absarc(0, 0, radius, -span / 2, span / 2, false);
  shape.lineTo(Math.cos(span / 2) * 1.48, Math.sin(span / 2) * 1.48);
  shape.absarc(0, 0, 1.48, span / 2, -span / 2, true);
  shape.closePath();
  let g = extrudePropShape(shape, 0.23, 0.045, 32);
  g.rotateX(-Math.PI / 2);
  g.rotateY(Math.PI / 2);
  g.translate(0, 0.65, 1.4);
  b.add("stone", g, { tint: P.stone });
  for (let i = 0; i < 12; i++) {
    let a = -span / 2 + (i * span) / 11,
      x = Math.sin(a) * radius,
      z = 1.4 - Math.cos(a) * radius;
    box(b, "stone", 0.31, 0.74, 0.17, x, 1.12, z, P.stone, { ry: -a });
    b.add("stone", new T.SphereGeometry(0.18, 16, 10), { x, y: 1.55, z, sz: 0.53, tint: P.stone });
  }
  for (let a of [-0.72, 0.72]) {
    cylinder(
      b,
      "stone",
      0.21,
      0.65,
      Math.sin(a) * 1.8,
      0.3,
      1.4 - Math.cos(a) * 1.8,
      P.stoneDark,
      0.17,
    );
  }
  for (let i = 0; i < 3; i++) {
    let a = -0.55 + i * 0.55;
    box(
      b,
      "cloth",
      0.75,
      0.14,
      0.43,
      Math.sin(a) * 1.78,
      0.86,
      1.4 - Math.cos(a) * 1.78,
      [P.shutterBlue, P.pink, P.lilac][i],
      { ry: -a },
    );
  }
  box(b, "wood", 0.28, 0.1, 0.24, 0.14, 0.98, 0.08, P.woodWarm);
  box(b, "paint", 0.14, 0.045, 0.23, 0.075, 1.06, 0.08, P.trim, { rz: 0.17 });
  box(b, "paint", 0.14, 0.045, 0.23, 0.205, 1.06, 0.08, P.trim, { rz: -0.17 });
  lantern(b, -1.48, 1.23, 0.22);
}
