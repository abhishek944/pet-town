/** Defaults shared by the renderer and the game loop. */
export const gameConfig = {
  title: "Pet Town",
  renderer: {
    pixelRatioLimit: 2,
    cameraFov: 50,
    near: 0.1,
    far: 600,
    initialCameraPosition: [24, 22, 24],
    maxFrameDelta: 1 / 20,
  },
};
