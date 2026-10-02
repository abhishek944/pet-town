/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
export function updateTerrain(value2, terrainValue) {
  let terrain2 = terrainValue.terrain;
  if (!terrain2) {
    return;
  }
  terrain2.flush();
  let uniforms2 = terrain2.material.userData.uniforms;
  let sky2 = terrainValue.sky;
  let result = sky2?.lightDir ?? sky2?.sunDir ?? terrainValue.sun?.position;
  if (result) {
    uniforms2.uLightDir.value.copy(result).normalize();
  }
  let result2 = Number.isFinite(sky2?.nightFactor) ? sky2.nightFactor : 0;
  let result3 = Number.isFinite(sky2?.dayFactor) ? sky2.dayFactor : 1;
  uniforms2.uNight.value = Math.min(1, result2 + 0.5 * (1 - result3));
  let result4 = terrainValue.lightState ?? sky2?.getLightState?.();
  let result5 = Number.isFinite(result4?.sunElevation)
    ? result4.sunElevation
    : Number.isFinite(sky2?.sunElevation)
      ? sky2.sunElevation
      : 0.8;
  let result6 = result3 * (1 - Math.min(1, Math.max(0, (result5 - 0.08) / 0.42)));
  uniforms2.uWarmShadow.value = 0.25 + 0.75 * result6 * result6 * (3 - 2 * result6);
  let hemiSky2 = result4?.hemiSky;
  if (hemiSky2 && Number.isFinite(hemiSky2.r)) {
    let result7 = 0.2126 * hemiSky2.r + 0.7152 * hemiSky2.g + 0.0722 * hemiSky2.b;
    if (result7 > 1e-4) {
      let callback = (value3, value4) =>
        Math.min(2.2, Math.max(0.55, (result7 * value3) / 0.985364 / Math.max(value4, 1e-4)));
      uniforms2.uFillFix.value.set(
        callback(1.1, hemiSky2.r),
        callback(0.97, hemiSky2.g),
        callback(0.8, hemiSky2.b),
      );
    }
  }
  if (!terrain2._wetAttached && terrainValue.water?.wetness) {
    terrain2._wetAttached = terrain2.material.userData.attachWetness(terrainValue.water.wetness);
  }
  let _terrainDebugCam2 = terrainValue._terrainDebugCam;
  if (_terrainDebugCam2) {
    terrainValue.camera.position.copy(_terrainDebugCam2.p);
    terrainValue.camera.lookAt(_terrainDebugCam2.t);
  }
}
