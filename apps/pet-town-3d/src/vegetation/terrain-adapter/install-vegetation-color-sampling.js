/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
export function installVegetationColorSampling(adapter) {
  adapter.srgbByteToLinear = (value38) => {
    let result81 = value38 / 255;
    return result81 <= 0.04045 ? result81 / 12.92 : ((result81 + 0.055) / 1.055) ** 2.4;
  };
  adapter.snapshot.groundColor = (value39, value40 = [0, 0, 0]) => {
    let ground2 = adapter.snapshot.ground;
    let result98 = ground2 && ground2.cell;
    if (result98 && value39 >= 0 && result98[value39 * 3] >= 0) {
      value40[0] = result98[value39 * 3];
      value40[1] = result98[value39 * 3 + 1];
      value40[2] = result98[value39 * 3 + 2];
      return value40;
    }
    let result99 = (ground2 && ground2.fallback) || [0.2, 0.45, 0.12];
    value40[0] = result99[0];
    value40[1] = result99[1];
    value40[2] = result99[2];
    return value40;
  };
}
