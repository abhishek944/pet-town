import { T } from "../shared/geometry.js";

function rectangle(x, z, w, d, y0, h, rot = 0) {
  return { x, z, w, d, radius: Math.hypot(w, d) / 2, y0, h, rot, noTop: Math.min(w, d) < 0.3 };
}

function parkFootprint() {
  const colliders = [
    rectangle(0, 0.005, 2.55, 0.74, 0.555, 0.11),
    rectangle(0, -0.36, 2.55, 0.22, 0.91, 0.62),
  ];
  for (const x of [-1.02, 1.02]) {
    colliders.push(rectangle(x, -0.06, 0.3, 0.76, 0, 0.97));
  }
  return { radius: 1.4, colliders };
}

function flowerBoxFootprint() {
  const colliders = [
    rectangle(0, 0.005, 2.35, 0.74, 0.605, 0.11),
    rectangle(0, -0.38, 2.4, 0.1, 0.93, 0.4),
  ];
  for (const x of [-1.62, 1.62]) {
    colliders.push(rectangle(x, 0, 0.94, 0.97, 0, 0.78));
  }
  for (const x of [-0.97, 0.97]) {
    colliders.push(rectangle(x, -0.37, 0.1, 0.1, 0.675, 0.77));
  }
  return { radius: 2.3, colliders };
}

function readingFootprint() {
  const colliders = [];
  // Small tangent rectangles follow the curved seat without filling its open front.
  for (let i = 0; i < 12; i++) {
    const a = -0.875 + (i * 1.75) / 11;
    colliders.push(
      rectangle(Math.sin(a) * 1.79, 1.4 - Math.cos(a) * 1.79, 0.34, 0.64, 0.535, 0.23, -a),
      rectangle(Math.sin(a) * 2.1, 1.4 - Math.cos(a) * 2.1, 0.33, 0.2, 0.75, 0.9, -a),
    );
  }
  for (const a of [-0.72, 0.72]) {
    colliders.push({
      x: Math.sin(a) * 1.8,
      z: 1.4 - Math.cos(a) * 1.8,
      radius: 0.21,
      y0: 0,
      h: 0.625,
      noTop: true,
    });
  }
  for (let i = 0; i < 3; i++) {
    const a = -0.55 + i * 0.55;
    colliders.push(
      rectangle(Math.sin(a) * 1.78, 1.4 - Math.cos(a) * 1.78, 0.75, 0.43, 0.79, 0.14, -a),
    );
  }
  colliders.push(rectangle(0.14, 0.08, 0.28, 0.24, 0.93, 0.16));
  colliders.push(rectangle(-1.48, 0.22, 0.48, 0.48, 1, 0.63));
  return { radius: 1.9, colliders, lights: [new T.Vector3(-1.48, 1.23, 0.22)] };
}

function treeFootprint() {
  const colliders = [{ x: 0, z: 0, radius: 0.17, y0: 0, h: 2.7, noTop: true }];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const local = (x, z, w, d, y0, h) =>
      rectangle(
        Math.sin(a) * 1.24 + Math.cos(a) * x + Math.sin(a) * z,
        Math.cos(a) * 1.24 - Math.sin(a) * x + Math.cos(a) * z,
        w,
        d,
        y0,
        h,
        a,
      );
    colliders.push(local(0, 0.005, 1.53, 0.74, 0.555, 0.11));
    colliders.push(local(0, -0.39, 1.05, 0.14, 0.63, 0.66));
    colliders.push(local(0, -0.24, 1.35, 0.12, 0.35, 0.14));
    for (const x of [-0.54, 0.54]) {
      for (const z of [-0.2, 0.24]) colliders.push(local(x, z, 0.12, 0.12, 0, 0.57));
    }
  }
  for (let i = 0; i < 4; i++) {
    colliders.push({
      x: Math.sin(i * 1.57) * 0.45,
      z: Math.cos(i * 1.57) * 0.45,
      radius: 0.42 * 0.34,
      y0: 0,
      h: 0.45 * 0.34,
      noTop: true,
    });
  }
  return { radius: 1.95, colliders };
}

function swingFootprint() {
  const colliders = [
    rectangle(0, 0.005, 2.5, 0.74, 0.795, 0.315),
    rectangle(0, -0.33, 2.5, 0.18, 1.11, 0.65),
  ];
  for (const x of [-1.63, 1.63]) {
    for (const z of [-0.56, 0.56]) {
      colliders.push(rectangle(x, z, 0.35, 0.35, 0, 0.24));
      colliders.push(rectangle(x, z, 0.18, 0.18, 0.24, 2.89));
    }
  }
  for (const x of [-1.82, 1.82]) {
    colliders.push({ x, z: 0.5, radius: 0.252, y0: 0, h: 0.27, noTop: true });
  }
  for (const x of [-1.05, 1.05]) {
    for (const z of [-0.28, 0.28]) {
      colliders.push({ x, z, radius: 0.034, y0: 0.81, h: 2.53, noTop: true });
    }
  }
  for (const z of [-0.56, 0, 0.56]) {
    const beam =
      z === 0
        ? [
            [-1.92, 3.08],
            [-1, 3.36],
            [0, 3.52],
            [1, 3.36],
            [1.92, 3.08],
          ]
        : [
            [-1.9, 3.07],
            [-1, 3.3],
            [0, 3.45],
            [1, 3.3],
            [1.9, 3.07],
          ];
    for (let i = 0; i < beam.length - 1; i++) {
      const [x1, y1] = beam[i],
        [x2, y2] = beam[i + 1];
      const r = z === 0 ? 0.12 : 0.085;
      colliders.push(
        rectangle(
          (x1 + x2) / 2,
          z,
          x2 - x1 + r * 2,
          r * 2,
          Math.min(y1, y2) - r,
          Math.abs(y2 - y1) + r * 2,
        ),
      );
    }
  }
  for (const x of [-1.55, -1, -0.5, 0, 0.5, 1, 1.55]) {
    colliders.push(rectangle(x, 0, 0.1, 1.7, 3.38 - 0.17 * Math.abs(x), 0.12));
  }
  colliders.push(rectangle(1.08, 0.48, 0.48, 0.48, 2.45, 0.63));
  return { radius: 2.25, colliders, lights: [new T.Vector3(1.08, 2.68, 0.48)] };
}

const footprints = {
  "fern-scroll-bench": parkFootprint,
  "flower-box-bench": flowerBoxFootprint,
  "reading-seat": readingFootprint,
  "tree-circle-bench": treeFootprint,
  "pergola-swing": swingFootprint,
};

export function collectionSeatMetadata(assetId) {
  return footprints[assetId]?.() ?? null;
}
