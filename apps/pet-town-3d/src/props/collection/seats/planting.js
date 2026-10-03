import { P } from "../shared/geometry.js";
import { createIvyLeafGeometry } from "../../building-details/create-ivy-leaf-geometry.js";
import { appendGardenFlowerGeometry } from "../../garden-geometry/append-garden-flower-geometry.js";

export function lush(b, r, x, y, z, rad) {
  for (let i = 0; i < 28; i++) {
    let a = i * 2.4,
      rr = r.range(0.08, rad);
    b.add("leaf", createIvyLeafGeometry(), {
      x: x + Math.sin(a) * rr,
      y: y + r.range(0, 0.2),
      z: z + Math.cos(a) * rr,
      sx: 2.2,
      sy: 2.2,
      sz: 2.2,
      ry: a,
      rx: -0.5,
      rz: r.range(-0.3, 0.3),
      tint: i % 3 ? P.leaf : P.leafLight,
    });
    if (i % 2 === 0) {
      b.push(x + Math.sin(a) * rr, y + 0.15, z + Math.cos(a) * rr, 0, 0, 0, 2.0);
      appendGardenFlowerGeometry(b, r, 0, 0, {
        h: r.range(0.08, 0.2),
        color: [P.pink, P.white, P.lilac][i % 3],
      });
      b.pop();
    }
  }
}
