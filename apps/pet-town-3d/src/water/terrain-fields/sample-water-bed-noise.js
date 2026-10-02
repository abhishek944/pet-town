/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
import { hashWaterBedCoordinates } from "./hash-water-bed-coordinates.js";
export let sampleWaterBedNoise = (value, value2) => {
  let result = Math.floor(value);
  let result2 = Math.floor(value2);
  let result3 = value - result;
  let result4 = value2 - result2;
  let result5 = result3 * result3 * (3 - 2 * result3);
  let result6 = result4 * result4 * (3 - 2 * result4);
  let hashWaterBedCoordinatesResult = hashWaterBedCoordinates(result, result2);
  let hashWaterBedCoordinatesResult2 = hashWaterBedCoordinates(result + 1, result2);
  let hashWaterBedCoordinatesResult3 = hashWaterBedCoordinates(result, result2 + 1);
  let hashWaterBedCoordinatesResult4 = hashWaterBedCoordinates(result + 1, result2 + 1);
  return (
    hashWaterBedCoordinatesResult +
    (hashWaterBedCoordinatesResult2 - hashWaterBedCoordinatesResult) * result5 +
    (hashWaterBedCoordinatesResult3 +
      (hashWaterBedCoordinatesResult4 - hashWaterBedCoordinatesResult3) * result5 -
      (hashWaterBedCoordinatesResult +
        (hashWaterBedCoordinatesResult2 - hashWaterBedCoordinatesResult) * result5)) *
      result6
  );
};
