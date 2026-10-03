const rect = (x, z, w, d, y0, h, noTop = true, rot = 0) => ({
  x,
  z,
  w,
  d,
  radius: Math.hypot(w, d) / 2,
  y0,
  h,
  noTop,
  rot,
});
const round = (x, z, radius, h, y0 = 0) => ({ x, z, radius, y0, h, noTop: true });
const segment = (x1, z1, x2, z2, r, h) => ({
  kind: "segment",
  x1,
  z1,
  x2,
  z2,
  r,
  h,
  noTop: true,
});

export function roseGateMetadata() {
  const colliders = [];
  for (const side of [-1, 1]) {
    colliders.push(
      rect(side * 1.13, 0, 0.5, 0.65, 0, 3.2),
      segment(side * 1.22, 0, side * 2.42, 0, 0.1, 1.46),
      // Preserve the approved closed leaf pose; this gate has no opening action.
      rect(side * 0.49, 0.06, 0.92, 0.11, 0, 1.4, true, -side * 0.24),
      round(side * 1.93, 0.42, 0.32, 0.55),
    );
  }
  colliders.push(rect(0, 0, 2.26, 0.75, 3.08, 0.53));
  return { radius: 2.5, colliders, clear: [{ x: 0, z: 0, r: 2.55 }] };
}

export function floristCartMetadata() {
  const colliders = [
    rect(0, 0, 2.16, 1.22, 0.65, 0.77, false),
    rect(0, -0.97, 1.18, 0.92, 0.72, 0.55, false),
    rect(0, -0.48, 1.88, 0.18, 2.57, 0.49),
    round(-1.3, -0.08, 0.3, 0.55),
    rect(1.48, -0.25, 0.55, 0.32, 0.06, 0.62),
  ];
  for (const side of [-1, 1]) {
    colliders.push(
      rect(side * 1.05, 0.28, 0.16, 0.94, 0, 0.92),
      rect(side * 0.88, -0.48, 0.13, 0.13, 1.02, 1.85),
      rect(side * 0.5, -0.48, 0.12, 0.12, 0.03, 0.74),
    );
  }
  return {
    radius: 1.9,
    colliders,
    lights: [{ x: 1.22, y: 2.31, z: -0.39 }],
    clear: [{ x: 0, z: -0.15, r: 1.9 }],
  };
}

export function acornMailboxMetadata() {
  return {
    radius: 0.94,
    colliders: [
      round(0, 0, 0.47, 0.2),
      round(0, 0, 0.2, 1.2),
      rect(0.15, 0.04, 0.8, 0.3, 0.7, 0.59),
      rect(0, 0.07, 1.42, 1.23, 1.18, 1.4),
      round(-0.63, 0.2, 0.2, 0.38),
      round(0.68, -0.14, 0.19, 0.36),
    ],
    clear: [{ x: 0, z: 0, r: 1 }],
  };
}

export function picnicPavilionMetadata() {
  const colliders = [
    rect(0, 0, 2.43, 1.12, 0.17, 1.03, false),
    // The solid roof starts above walking height; the open perimeter stays usable.
    rect(0, 0, 3.98, 3.15, 2.54, 1.32),
  ];
  for (const x of [-1.57, 1.57]) {
    for (const z of [-1.18, 1.18]) colliders.push(rect(x, z, 0.32, 0.32, 0.13, 2.66));
  }
  for (const z of [-0.94, 0.94]) colliders.push(rect(0, z, 2.63, 0.49, 0.55, 0.23, false));
  for (const x of [-0.85, 0.85]) colliders.push(rect(x, 0, 0.14, 1.9, 0.5, 0.12));
  for (const x of [-1.95, 1.95]) colliders.push(round(x, 0.96, 0.24, 0.42, 0.15));
  return {
    radius: 2.7,
    colliders,
    walk: [{ cx: 0, cz: 0, hw: 1.9, hd: 1.6, y: 0.13 }],
    lights: [{ x: -1.28, y: 2.2, z: 1.18 }],
    clear: [{ x: 0, z: 0, r: 2.75 }],
  };
}

export function lilyFountainMetadata() {
  return {
    radius: 1.65,
    colliders: [
      round(0, 0, 1.23, 0.53),
      round(0, 0, 0.28, 1.4),
      round(0, 0, 0.58, 0.27, 1.35),
      round(0, 0, 0.34, 0.66, 1.53),
      round(-1.4, 0.4, 0.2, 0.38),
      round(1.4, 0.4, 0.2, 0.38),
    ],
    clear: [{ x: 0, z: 0, r: 1.7 }],
  };
}
