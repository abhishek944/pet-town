import { playerState } from "../state.js";

/** Resolve a yaw-oriented solid without inflating it to a world-axis box. */
export function collideOrientedBox(body, box) {
  const cos = Math.cos(box.yaw),
    sin = Math.sin(box.yaw);
  const dx = body.pos.x - box.x,
    dz = body.pos.z - box.z;
  let x = cos * dx - sin * dz,
    z = sin * dx + cos * dz;
  const radius = playerState.playerMovementSettings.halfW;
  const height = playerState.playerMovementSettings.height;
  const px = box.hx + radius - Math.abs(x),
    pz = box.hz + radius - Math.abs(z);
  if (px <= 0 || pz <= 0 || body.pos.y >= box.y1 - 0.001 || body.pos.y + height <= box.y0) return;
  if (!box.noTop && body.vel.y <= 0.1 && body.prev.y >= box.y1 - 0.01) {
    body.pos.y = box.y1;
    body.vel.y = 0;
    body._land();
    return;
  }
  if (body.vel.y > 0 && body.prev.y + height <= box.y0 + 0.15) {
    body.pos.y = box.y0 - height;
    body.vel.y = 0;
    body.jumping = false;
    return;
  }
  let nx = 0,
    nz = 0;
  if (px < pz) {
    nx = x < 0 ? -1 : 1;
    x += nx * (px + 0.001);
  } else {
    nz = z < 0 ? -1 : 1;
    z += nz * (pz + 0.001);
  }
  body.pos.x = box.x + cos * x + sin * z;
  body.pos.z = box.z - sin * x + cos * z;
  const worldNX = cos * nx + sin * nz,
    worldNZ = -sin * nx + cos * nz;
  const inward = body.vel.x * worldNX + body.vel.z * worldNZ;
  if (inward < 0) {
    body.vel.x -= inward * worldNX;
    body.vel.z -= inward * worldNZ;
  }
}
