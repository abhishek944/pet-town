import { playerState } from "../state.js";
import { playerPropFootprint } from "../collision-world/player-prop-footprint.js";
import { samplePlayerPropCeiling } from "./sample-player-prop-ceiling.js";

/** Clip the full vertical path, so thin furniture cannot be crossed in one step. */
export function sweepPlayerPropVertical(body, distance) {
  const { halfW, height } = playerState.playerMovementSettings;
  const { pos, world } = body;
  let travel = distance;
  if (distance < 0) {
    const top = world.platformHeight(pos.x, pos.z, pos.y + 0.01);
    if (top >= pos.y + travel && top <= pos.y + 0.01) travel = Math.min(0, top - pos.y);
  }
  for (const collider of world.colliders) {
    if (!playerPropFootprint(collider, pos.x, pos.z, halfW)) continue;
    const top = collider.y1 ?? collider.maxY;
    const bottom = samplePlayerPropCeiling(collider, pos.x, pos.z);
    if (distance < 0 && !collider.noTop && pos.y >= top - 0.01 && pos.y + travel <= top) {
      travel = Math.min(0, top - pos.y);
    } else if (
      distance > 0 &&
      pos.y + height <= bottom + 0.001 &&
      pos.y + height + travel >= bottom
    ) {
      travel = Math.max(0, bottom - pos.y - height - 0.001);
    }
  }
  return travel;
}
