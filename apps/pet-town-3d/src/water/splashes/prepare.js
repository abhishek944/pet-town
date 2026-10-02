/** Recycled splash particle pool and gravity-driven droplets with impact callbacks. */
import { waterState } from "../state.js";
export function prepareWaterSplashes() {
  waterState.waterSplashParticleCapacity = 384;
}
