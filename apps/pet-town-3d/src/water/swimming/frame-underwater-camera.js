/** Keep the following camera beneath the surface once its swimming focus submerges. */
export function frameUnderwaterCamera(context, frame, focus, desired, clearance) {
  const water = context.water;
  if (!frame.diving || !water?.isWater(desired.x, desired.z)) return;
  const surface = water.sample(desired.x, desired.z);
  if (focus.y < surface - clearance) desired.y = Math.min(desired.y, surface - clearance - 0.05);
}
