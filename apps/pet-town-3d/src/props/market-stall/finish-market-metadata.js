/** Detailed market stall geometry and decorative flat leaf geometry. */
import * as THREE from "three";
export function finishMarketMetadata(stall) {
  stall.metadata.colliders = [
    {
      x: 0,
      z: stall.depth / 2 - 0.35,
      w: 3.3499999999999996,
      d: 0.95,
      radius: 1.6,
      h: 1.05,
      noTop: true,
    },
    {
      x: 0,
      z: -1.8 / 2 + 0.3,
      w: 3.0999999999999996,
      d: 0.5,
      radius: 1.5,
      h: 1.6,
      noTop: true,
    },
    ...[
      [-1, 0.9500000000000001, stall.frontPostHeight],
      [1, 0.9500000000000001, stall.frontPostHeight],
      [-1, -0.85, stall.backPostHeight],
      [1, -0.85, stall.backPostHeight],
    ].map(([value3, value4, value5]) => ({
      x: value3 * (stall.width / 2 - 0.05),
      z: value4,
      radius: 0.1,
      h: value5,
      noTop: true,
    })),
    {
      x: -3.3 / 2 - 0.55,
      z: 0.35,
      radius: 0.4,
      h: 0.95,
    },
    {
      x: -3.3 / 2 - 0.5,
      z: -0.55,
      w: 0.68,
      d: 0.68,
      radius: 0.45,
      h: 0.66,
    },
    {
      x: -3.3 / 2 - 0.45,
      z: -0.55,
      w: 0.52,
      d: 0.52,
      radius: 0.35,
      y0: 0.66,
      h: 0.5,
    },
    {
      x: 2.15,
      z: -0.5,
      w: 0.72,
      d: 0.72,
      radius: 0.48,
      h: 0.72,
      noTop: true,
    },
    {
      x: 2.2,
      z: 1.1,
      radius: 0.3,
      h: 0.9,
      noTop: true,
    },
  ];
  stall.metadata.front = new THREE.Vector3(0, 0, 2.1);
  stall.metadata.windows = [
    {
      x: 0,
      y: 1.2,
      z: 1.2,
      nx: 0,
      nz: 1,
    },
  ];
}
