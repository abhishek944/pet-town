import { Vector3 } from "three";
import { isCameraVegetationOccluded } from "../../player/camera-visibility/is-camera-vegetation-occluded.js";

/** Fade only the local viewing corridor around the followed companion. */
export function createTownFoliageFade(context) {
  const target = new Vector3();
  const vegetation = context.vegetation;
  const fade = vegetation?.setCameraFade ?? vegetation?.fadeCanopies;
  let hold = 0;
  let active = false;
  return {
    get active() {
      return active;
    },
    update(world, position, deltaTime, enabled = true) {
      if (!fade) return;
      if (!enabled) {
        if (active) this.reset();
        return;
      }
      target.copy(position);
      target.y += 0.9;
      if (isCameraVegetationOccluded(context, world, context.camera.position, target)) hold = 0.5;
      else hold = Math.max(0, hold - deltaTime);
      active = hold > 0;
      fade.call(
        vegetation,
        active ? context.camera.position : null,
        active ? target : null,
        active ? 1.6 : 0,
      );
    },
    reset() {
      hold = 0;
      active = false;
      fade?.call(vegetation, null, null, 0);
    },
  };
}
