import { T } from "../shared/geometry.js";

const scale = 0.65;
// The approved attached cottage turns 90 degrees and faces east.
function point(position) {
  return new T.Vector3(2.9 + position.z * scale, position.y * scale, -0.2 - position.x * scale);
}
export function addWindmillShedMetadata(metadata, shed) {
  for (const collider of shed.colliders) {
    const centre = point({ ...collider, y: 0 });
    metadata.colliders.push({
      ...collider,
      x: centre.x,
      z: centre.z,
      w: collider.d === undefined ? undefined : collider.d * scale,
      d: collider.w === undefined ? undefined : collider.w * scale,
      radius: collider.radius * scale,
      y0: (collider.y0 ?? 0) * scale,
      h: collider.h * scale,
      noTop: true,
    });
  }
  metadata.lights.push(...shed.lights.map(point));
  for (const window of shed.windows) {
    const centre = point(window);
    metadata.windows.push({ ...window, ...centre, nx: window.nz, nz: -window.nx });
  }
  for (const clearing of shed.clear) {
    const centre = point({ ...clearing, y: 0 });
    metadata.clear.push({ x: centre.x, z: centre.z, r: clearing.r * scale });
  }
}
