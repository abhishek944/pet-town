import { boatWorld } from "./coordinates.js";
import { hullHalfWidth } from "./model.js";

export function createBoatSolidBoxes() {
  const entries = [];
  const add = (x, z, width, depth, bottom, top) =>
    entries.push({
      x,
      z,
      bottom,
      top,
      collider: { kind: "obb", x: 0, z: 0, yaw: 0, hx: width / 2, hz: depth / 2, y0: 0, y1: 0 },
    });
  for (let i = 0; i < 28; i++) {
    const z = -3.5 + (i + 0.5) * 0.25;
    add(0, z, hullHalfWidth(z) * 2 - 0.12, 0.25, -0.48, 0.66);
  }
  add(0, -1.45, 2.15, 2.2, 0.66, 2.21);
  for (const side of [-1, 1]) add(side * 1.4, 0.5, 0.7, 2, 0.66, 1.04);
  return {
    colliders: entries.map((e) => e.collider),
    update(pose) {
      for (const { x, z, bottom, top, collider } of entries) {
        const p = boatWorld(pose, x, 0, z);
        Object.assign(collider, {
          x: p.x,
          z: p.z,
          yaw: pose.yaw,
          y0: pose.y + bottom,
          y1: pose.y + top,
        });
      }
    },
  };
}
