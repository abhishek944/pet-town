/** Quality tiers, instance density, visibility updates and dynamic vegetation instances. */
import { vegetationState } from "../state.js";
export function prepareVegetationVisibility() {
  vegetationState.vegetationQualityTiers = {
    low: {
      dens: 0.5,
      dist: 0.65,
      look: [1.4, 1.15, 0.74],
    },
    med: {
      dens: 0.8,
      dist: 0.85,
      look: [1.1, 1.04, 0.95],
    },
    medium: {
      dens: 0.8,
      dist: 0.85,
      look: [1.1, 1.04, 0.95],
    },
    high: {
      dens: 1,
      dist: 1,
      look: [1, 1, 1],
    },
    ultra: {
      dens: 1,
      dist: 1.15,
      look: [1, 1, 1],
    },
  };
}
