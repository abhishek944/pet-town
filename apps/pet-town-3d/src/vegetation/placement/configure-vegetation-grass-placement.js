/** Vegetation clearings, flower palettes and biome-aware world population. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
export function configureVegetationGrassPlacement(world) {
  world.grassCount = 0;
  world.tallGrassCount = 0;
  world.flowerCount = 0;
  world.duneGrassCount = 0;
  world.grassDensity =
    Number(vegetationState.vegetationRuntimeState.ctx.params?.get?.(`vegGrass`)) || 1;
  world.grassVariants = vegetationState.vegetationRuntimeState.lib.grass.length;
  world.tallGrassVariants = vegetationState.vegetationRuntimeState.lib.tall.length;
  world.groundTint = (value31, value32, setRGBValue) => {
    world.ground.groundColor(value31, world.groundRgb);
    let result107 = world.canopyShade[value31];
    let result108 =
      (0.95 + vegetationHash2d(value31, 80 + value32, world.seed) * 0.1) * (1 - 0.3 * result107);
    return setRGBValue.setRGB(
      world.groundRgb[0] * result108 * (1 - 0.14 * result107),
      world.groundRgb[1] * result108 * (1 - 0.04 * result107),
      world.groundRgb[2] * result108 * (1 + 0.02 * result107),
    );
  };
  world.tint = new THREE.Color();
  world.tallGrassCells = new Uint8Array(world.cellCount);
}
