import { createSceneryModel } from "./model-kit.js";

/** Broken open hull: the centre and both ends remain visually navigable. */
export function createWreck() {
  const model = createSceneryModel("Sunken sailboat garden");
  const wood = 0x8b7465;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      if ((side > 0 && i === 2) || (side < 0 && i === 4)) continue;
      model.box([side * 1.25, 0.43, (i - 2.5) * 0.67], [0.12, 0.48, 0.61], wood, [
        0.05 * (i % 2),
        side * 0.07,
        side * 0.1,
      ]);
      model.branch(
        [side * 0.9, 0.03, (i - 2.5) * 0.67],
        [side * 1.3, 0.85, (i - 2.5) * 0.67],
        0.075,
        0x635f57,
      );
    }
  }
  for (let i = 0; i < 5; i++) {
    model.box([-0.75 + i * 0.37, 0.08, -0.8 + i * 0.21], [0.25, 0.1, 2.6], wood, [
      0.02,
      (i - 2) * 0.09,
      0.025,
    ]);
  }
  model.branch([-0.7, 0.1, -0.7], [-2.6, 0.55, 1.2], 0.13, 0x87725d, 0.08);
  model.branch([-2.6, 0.55, 1.2], [-2.9, 0.4, 1.5], 0.09, 0xb9ab91, 0.04);
  model.box([1.8, 0.13, -1.7], [0.38, 0.21, 0.85], 0x617979, [0, 0.5, 0.12]);
  // Barnacles and shells turn the wreck into habitat rather than a dark obstacle.
  for (let i = 0; i < 9; i++) {
    model.pebble(
      [i % 2 ? -1.3 : 1.3, 0.65, -1.7 + i * 0.4],
      [0.11, 0.12, 0.09],
      i % 2 ? 0xdbd7bb : 0x9bc5bd,
    );
  }
  model.finish();
  return model;
}
