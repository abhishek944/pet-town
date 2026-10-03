import { Vector3 } from "three";

const sample = new Vector3();
const heights = [-0.35, 0.45];
const widths = [0, -0.24, 0.24];

/** Target is the actor's mid-body point, matching the local fade capsule. */
export function isCameraVegetationOccluded(context, world, cameraPosition, target) {
  const queries = context.cameraQueries;
  const dx = target.x - cameraPosition.x;
  const dz = target.z - cameraPosition.z;
  const length = Math.hypot(dx, dz);
  const sideX = length > 0.001 ? -dz / length : 1;
  const sideZ = length > 0.001 ? dx / length : 0;
  if (world.canopyOnSegment?.(cameraPosition, target)) return true;

  // Head and torso edges catch narrow trunks even when the center ray is clear.
  for (const height of heights) {
    for (const width of widths) {
      sample.set(target.x + sideX * width, target.y + height, target.z + sideZ * width);
      if (queries?.raycast(cameraPosition, sample, true)?.kind === "vegetation") return true;
    }
    sample.set(target.x, target.y + height, target.z);
    if (world.canopyOnSegment?.(cameraPosition, sample)) return true;
  }
  return false;
}
