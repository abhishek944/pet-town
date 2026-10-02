/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
export function configurePlayerFixedCamera(cameraValue, frozenValue, value, value2) {
  let position2 = value2 ?? {
    x: 0,
    y: 0,
    z: 0,
  };
  cameraValue.camera.position.set(
    position2.x + value[0],
    position2.y + value[1],
    position2.z + value[2],
  );
  cameraValue.camera.lookAt(position2.x + value[3], position2.y + value[4], position2.z + value[5]);
  cameraValue.camera.updateMatrixWorld();
  frozenValue.frozen = true;
  frozenValue.focus.set(position2.x + value[3], position2.y + value[4], position2.z + value[5]);
}
