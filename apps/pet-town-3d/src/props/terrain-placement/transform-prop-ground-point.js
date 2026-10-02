/** Terrain footprint sampling, cardinal orientation and cottage/windmill entrance access. */
import { rotatePropGroundPoint } from "./rotate-prop-ground-point.js";
export let transformPropGroundPoint = (position, value, value2) => {
  let [rotatePropGroundPointResult, rotatePropGroundPointResult2] = rotatePropGroundPoint(
    value,
    value2,
    position.rot,
  );
  return [position.x + rotatePropGroundPointResult, position.z + rotatePropGroundPointResult2];
};
