import { SUNMEADOW } from "./layout.js";

function segmentSample(x, z, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return {
    distance: Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz),
    height: a[2] + (b[2] - a[2]) * t,
  };
}

/** Authored silhouettes and terraces; no seed or random placement affects these places. */
export function sampleSunmeadow(x, z) {
  let edgeDistance = Infinity;
  for (const shape of SUNMEADOW.shapes) {
    const radius = Math.hypot((x - shape.x) / shape.rx, (z - shape.z) / shape.rz);
    edgeDistance = Math.min(edgeDistance, (radius - 1) * Math.min(shape.rx, shape.rz));
  }
  const neck = segmentSample(x, z, [29, -2, 9], [65, 2, 10]);
  edgeDistance = Math.min(edgeDistance, neck.distance - 5);
  if (edgeDistance > 4) return null;
  let height = edgeDistance > 0 ? Math.max(2, 7 - Math.floor(edgeDistance)) : 9;
  let path = null;
  for (const route of SUNMEADOW.paths) {
    for (let i = 1; i < route.length; i++) {
      const sample = segmentSample(x, z, route[i - 1], route[i]);
      if (!path || sample.distance < path.distance) path = sample;
    }
  }
  const hillDistance = Math.hypot((x - 102) * 0.95, (z + 15) * 1.1);
  if (edgeDistance < -3) height = 10 + Math.floor(5 * Math.max(0, 1 - hillDistance / 24));
  for (const clearing of SUNMEADOW.clearings) {
    const distance = Math.hypot(x - clearing.x, z - clearing.z);
    if (distance < clearing.r + 3) {
      const weight = Math.max(0, Math.min(1, (clearing.r + 3 - distance) / 3));
      height = Math.round(height * (1 - weight) + clearing.height * weight);
    }
  }
  if (path.distance < 3 && edgeDistance < 0) height = Math.round(path.height);
  const onPath = path.distance < 1.35 && height >= 8;
  const forest = z < -8 && x < 85 && !onPath;
  return { height, edgeDistance, onPath, forest };
}
