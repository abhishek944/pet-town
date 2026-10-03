import { DECK_Y, hullHalfWidth } from "./model.js";

export function boatWorld(pose, x, y, z) {
  const c = Math.cos(pose.yaw),
    s = Math.sin(pose.yaw);
  return { x: pose.x + c * x + s * z, y: pose.y + y, z: pose.z - s * x + c * z };
}
export function boatLocal(pose, position) {
  const c = Math.cos(pose.yaw),
    s = Math.sin(pose.yaw);
  const dx = position.x - pose.x,
    dz = position.z - pose.z;
  return { x: c * dx - s * dz, y: position.y - pose.y, z: s * dx + c * dz };
}
export function insideBoat(x, z, padding = 0) {
  return Math.abs(z) < 3.5 - padding && Math.abs(x) + padding < hullHalfWidth(z);
}
export function boatDeckHeight(pose, x, z) {
  const local = boatLocal(pose, { x, y: 0, z });
  if (!insideBoat(local.x, local.z, 0.12)) return -Infinity;
  if (Math.abs(local.x) < 1.225 && local.z > -2.75 && local.z < -0.15) return pose.y + 2.21;
  if (Math.abs(local.x) > 1.05 && Math.abs(local.x) < 1.75 && local.z > -0.5 && local.z < 1.5)
    return pose.y + 1.04;
  return pose.y + DECK_Y;
}
