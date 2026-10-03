import { placementKey } from "../placement-key.js";
/** Keep public trails protected while identifying a replaced house's own short connector. */
export function ownLegacyApproach(village, original, replacement) {
  const front = original.front;
  if (original.type !== "cottage" || !Array.isArray(front)) return;
  const assetKey = placementKey(replacement);
  village.entrances = village.entrances.filter(
    ([x, z]) => Math.hypot(x - front[0], z - front[1]) > 0.01,
  );
  village.pathSamples.push([{ x: front[0], z: front[1], assetKey }]);
  village.pathSamples = village.pathSamples.map((points) =>
    points.map((point) =>
      point.t !== undefined && Math.hypot(point.x - front[0], point.z - front[1]) < 2.5
        ? { ...point, assetKey }
        : point,
    ),
  );
}
