import { WILLOWMERE } from "./willowmere-layout.js";

function segmentSample(x, z, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return {
    distance: Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz),
    height: a[2] + (b[2] - a[2]) * t,
  };
}

export function sampleWillowmere(x, z) {
  let edgeDistance = Infinity;
  for (const shape of WILLOWMERE.shapes) {
    const radius = Math.hypot((x - shape.x) / shape.rx, (z - shape.z) / shape.rz);
    edgeDistance = Math.min(edgeDistance, (radius - 1) * Math.min(shape.rx, shape.rz));
  }
  const neck = segmentSample(x, z, [-12, -45, 9], [-12, -63, 10]);
  edgeDistance = Math.min(edgeDistance, neck.distance - 6);
  if (edgeDistance > 4) return null;
  let path;
  for (const route of WILLOWMERE.paths) {
    for (let i = 1; i < route.length; i++) {
      const sample = segmentSample(x, z, route[i - 1], route[i]);
      if (!path || sample.distance < path.distance) path = sample;
    }
  }
  let height = edgeDistance > 0 ? Math.max(2, 7 - Math.floor(edgeDistance)) : 9;
  if (edgeDistance < -3) {
    const ridgeDistance = Math.hypot(x + 62, (z + 87) * 1.15);
    height = 10 + Math.floor(6 * Math.max(0, 1 - ridgeDistance / 27));
  }
  for (const clearing of WILLOWMERE.clearings) {
    const distance = Math.hypot(x - clearing.x, z - clearing.z);
    if (distance < clearing.r + 3) {
      const weight = Math.max(0, Math.min(1, (clearing.r + 3 - distance) / 3));
      height = Math.round(height * (1 - weight) + clearing.height * weight);
    }
  }
  if (path.distance < 3 && edgeDistance < 0) height = Math.round(path.height);
  const lake = WILLOWMERE.lake;
  const lakeRadius = Math.hypot((x - lake.x) / lake.rx, (z - lake.z) / lake.rz);
  if (lakeRadius < 1)
    return { height: lakeRadius < 0.7 ? 5 : 7, edgeDistance: 1, onPath: false, forest: false };
  if (lakeRadius < 1.2) height = Math.min(height, 9);
  const onPath = path.distance < 1.35 && height >= 8;
  const clearing = WILLOWMERE.clearings.some(
    (site) => Math.hypot(x - site.x, z - site.z) < site.r + 1,
  );
  const forest = !onPath && !clearing && lakeRadius > 1.25;
  return { height, edgeDistance, onPath, forest };
}
