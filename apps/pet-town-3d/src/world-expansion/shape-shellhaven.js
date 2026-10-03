import { SHELLHAVEN } from "./shellhaven-layout.js";

function segmentSample(x, z, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return {
    distance: Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz),
    height: a[2] + (b[2] - a[2]) * t,
  };
}

export function sampleShellhaven(x, z) {
  let edgeDistance = Infinity;
  for (const shape of SHELLHAVEN.shapes) {
    const radius = Math.hypot((x - shape.x) / shape.rx, (z - shape.z) / shape.rz);
    edgeDistance = Math.min(edgeDistance, (radius - 1) * Math.min(shape.rx, shape.rz));
  }
  edgeDistance = Math.min(edgeDistance, segmentSample(x, z, [6, 43, 9], [6, 65, 9]).distance - 6);
  if (edgeDistance > 4) return null;
  let path;
  for (const route of SHELLHAVEN.paths) {
    for (let i = 1; i < route.length; i++) {
      const sample = segmentSample(x, z, route[i - 1], route[i]);
      if (!path || sample.distance < path.distance) path = sample;
    }
  }
  const bluffDistance = Math.hypot(x - 17, (z - 90) * 1.1);
  let height = edgeDistance > 0 ? Math.max(2, 7 - Math.floor(edgeDistance)) : 9;
  if (edgeDistance < -4) height = 10 + Math.floor(4 * Math.max(0, 1 - bluffDistance / 22));
  for (const clearing of SHELLHAVEN.clearings) {
    const distance = Math.hypot(x - clearing.x, z - clearing.z);
    if (distance < clearing.r + 3) {
      const weight = Math.max(0, Math.min(1, (clearing.r + 3 - distance) / 3));
      height = Math.round(height * (1 - weight) + clearing.height * weight);
    }
  }
  if (path.distance < 3 && edgeDistance < 0) height = Math.round(path.height);
  const pool = SHELLHAVEN.pool;
  const poolRadius = Math.hypot((x - pool.x) / pool.rx, (z - pool.z) / pool.rz);
  const inlet = SHELLHAVEN.inlet;
  const inletRadius = Math.hypot((x - inlet.x) / inlet.rx, (z - inlet.z) / inlet.rz);
  if (poolRadius < 1 || inletRadius < 1)
    return { height: 6, edgeDistance: 1, onPath: false, beach: true };
  const onPath = path.distance < 1.35 && height >= 8;
  const beach = (z > 75 && bluffDistance > 13) || edgeDistance > -5;
  return { height, edgeDistance, onPath, beach, forest: false };
}
