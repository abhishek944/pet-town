import { P, cylinder } from "../shared/geometry.js";
import { createIvyLeafGeometry } from "../../building-details/create-ivy-leaf-geometry.js";
import { appendGardenFlowerGeometry } from "../../garden-geometry/append-garden-flower-geometry.js";

export function ivy(builder, x, y, z, scale = 1.9, rot = 0) {
  builder.add("leaf", createIvyLeafGeometry(), {
    x,
    y,
    z,
    sx: scale,
    sy: scale,
    sz: scale,
    rz: rot,
    tint: rot < 0 ? P.leafLight : P.leaf,
  });
}
export function bloom(builder, random, x, y, z, colour = P.pink, scale = 2.5) {
  builder.push(x, y, z, 0, 0, 0, scale);
  appendGardenFlowerGeometry(builder, random, 0, 0, { h: 0.08, color: colour });
  builder.pop();
}
export function pot(builder, random, x, y, z, s = 1, col = P.pink) {
  cylinder(builder, "plain", 0.18 * s, 0.32 * s, x, y + 0.16 * s, z, P.terracotta, 0.24 * s);
  cylinder(builder, "plain", 0.255 * s, 0.045 * s, x, y + 0.33 * s, z, P.terracotta);
  cylinder(builder, "soil", 0.22 * s, 0.025 * s, x, y + 0.34 * s, z, P.soilTint);
  for (let i = 0; i < 12; i++) {
    let a = i * 2.4,
      rr = random.range(0.04, 0.22) * s;
    ivy(
      builder,
      x + Math.sin(a) * rr,
      y + 0.36 * s + random.range(0, 0.1) * s,
      z + Math.cos(a) * rr,
      1.5 * s,
      a,
    );
    if (i % 3 === 0)
      bloom(
        builder,
        random,
        x + Math.sin(a) * rr,
        y + 0.46 * s,
        z + Math.cos(a) * rr,
        col,
        2.1 * s,
      );
  }
}
