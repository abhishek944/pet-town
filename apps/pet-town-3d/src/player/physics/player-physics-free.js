import { playerState } from "../state.js";
export function playerPhysicsFree(x, y, z) {
  let halfW2 = playerState.playerMovementSettings.halfW;
  return this.world.boxFree(
    x - halfW2,
    y,
    z - halfW2,
    x + halfW2,
    y + playerState.playerMovementSettings.height,
    z + halfW2,
  );
}
