import { boatWorld } from "./coordinates.js";
import { hullHalfWidth } from "./model.js";

/** Local solid edges rotate with the hull; the dock has its own fixed support. */
export function createBoatCollisions() {
  const edges = [];
  function edge(a, b, radius, bottom, top) {
    edges.push({
      a,
      b,
      collider: { x1: 0, z1: 0, x2: 0, z2: 0, r: radius, y0: 0, y1: 0, noTop: true },
      bottom,
      top,
    });
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 20; i++) {
      const z0 = -3.5 + i * 0.35,
        z1 = z0 + 0.35;
      edge([side * hullHalfWidth(z0), z0], [side * hullHalfWidth(z1), z1], 0.075, -0.48, 0.65);
    }
    edge([side * 1.25, 2], [side * 1.55, 0.4], 0.045, 0.65, 1.32);
    edge([side * 1.55, 0.4], [side * 1.6, -1.8], 0.045, 0.65, 1.32);
    edge([side * 1.4, -0.4], [side * 1.4, 1.4], 0.32, 0.66, 1.04);
  }
  const cabin = [
    [-1.075, -2.55],
    [1.075, -2.55],
    [1.075, -0.35],
    [-1.075, -0.35],
  ];
  cabin.forEach((a, i) => edge(a, cabin[(i + 1) % cabin.length], 0.06, 0.65, 2.21));
  const colliders = edges.map((item) => item.collider);
  return {
    colliders,
    update(pose) {
      for (const { a, b, collider, bottom, top } of edges) {
        const start = boatWorld(pose, a[0], 0, a[1]);
        const end = boatWorld(pose, b[0], 0, b[1]);
        Object.assign(collider, {
          x1: start.x,
          z1: start.z,
          x2: end.x,
          z2: end.z,
          y0: pose.y + bottom,
          y1: pose.y + top,
        });
      }
    },
  };
}
