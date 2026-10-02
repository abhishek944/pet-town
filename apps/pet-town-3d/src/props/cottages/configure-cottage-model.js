/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */

import { propsState } from "../state.js";
export function configureCottageModel(cottage) {
  cottage.width = cottage.settings.W ?? 6.2;
  cottage.depth = cottage.settings.D ?? 4.8;
  cottage.wallHeight = cottage.settings.wallH ?? 2.9;
  cottage.floorY = 0.5;
  cottage.foundationDepth = Math.max(0.3, cottage.settings.found ?? 0.3);
  cottage.eaveY = cottage.floorY + cottage.wallHeight;
  cottage.roofPitch = cottage.settings.pitch ?? 0.74;
  cottage.roofSlope = Math.tan(cottage.roofPitch);
  cottage.eaveOverhang = 0.62;
  cottage.gableOverhang = 0.36;
  cottage.roofThickness = 0.3;
  cottage.hasPlasterWalls = cottage.settings.walls !== `wood`;
  cottage.roofColor = cottage.settings.roof ?? propsState.propPalette.roofRed;
  cottage.wallColor =
    cottage.settings.wallTint ??
    (cottage.hasPlasterWalls ? propsState.propPalette.plaster : propsState.propPalette.woodLight);
  cottage.trimColor = cottage.settings.trim ?? propsState.propPalette.trim;
  cottage.timberColor = cottage.settings.timber ?? propsState.propPalette.timber;
  cottage.doorColor = cottage.settings.door ?? propsState.propPalette.doorTeal;
  cottage.shutterColor = cottage.settings.shutter ?? propsState.propPalette.shutterGreen;
  cottage.metadata = {
    lights: [],
    windows: [],
    walk: [],
    clear: [],
    chimney: null,
    door: null,
    colliders: [],
    segs: [],
  };
  cottage.wallNoiseSeed = cottage.width * 7.3;
  cottage.ridgeY =
    cottage.eaveY +
    (cottage.depth / 2) * cottage.roofSlope +
    cottage.roofThickness / Math.cos(cottage.roofPitch);
  cottage.wallMaterial = cottage.hasPlasterWalls ? `plaster` : `wood`;
  cottage.wallUvs = cottage.hasPlasterWalls
    ? undefined
    : {
        grain: 0,
        scale: 1 / 2.4,
      };
  cottage.foundationHeight = cottage.floorY + cottage.foundationDepth;
}
