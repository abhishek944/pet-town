/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { appendCottageWindowGeometry } from "../building-details/append-cottage-window-geometry.js";
import { appendLanternGeometry } from "../street-furniture/append-lantern-geometry.js";
export function buildCottageWindows(cottage) {
  if (cottage.settings.porch === `veranda`) {
    cottage.builder.add(`metal`, createBeveledPropBox(0.06, 0.06, 0.34, 0.01), {
      x: cottage.doorX,
      y: 2.6 + 0.55,
      z: cottage.frontZ + 0.17,
      tint: propsState.propPalette.iron,
    });
    cottage.builder.add(`metal`, createBeveledPropBox(0.025, 0.12, 0.025, 0.006), {
      x: cottage.doorX,
      y: 3.08,
      z: cottage.frontZ + 0.32,
      tint: propsState.propPalette.iron,
    });
    appendLanternGeometry(cottage.builder, cottage.doorX, 2.87, cottage.frontZ + 0.32, 0.72);
    cottage.metadata.lights.push(new THREE.Vector3(cottage.doorX, 2.87, cottage.frontZ + 0.32));
  } else {
    let result109 =
      cottage.doorX + cottage.doorWidth / 2 + 0.45 + (cottage.hasPlasterWalls ? 0.25 : 0.05);
    cottage.builder.add(`metal`, createBeveledPropBox(0.06, 0.06, 0.32, 0.01), {
      x: result109,
      y: 2.62,
      z: cottage.frontZ + 0.16,
      tint: propsState.propPalette.iron,
    });
    appendLanternGeometry(cottage.builder, result109, 2.4, cottage.frontZ + 0.34, 0.8);
    cottage.metadata.lights.push(new THREE.Vector3(result109, 2.4, cottage.frontZ + 0.34));
  }
  cottage.windowStyle = {
    trim: cottage.trimColor,
    shutter: cottage.shutterColor,
    headerTint: cottage.timberColor,
    sill: cottage.timberColor,
    flowerCols: cottage.settings.flowerCols,
  };
  for (let result110 of cottage.settings.frontWindows ?? [cottage.doorX + 2.55]) {
    cottage.builder.push(result110, 2.05, cottage.frontZ);
    appendCottageWindowGeometry(cottage.builder, cottage.random, {
      ...cottage.windowStyle,
      shutter: cottage.settings.frontShutters === false ? null : cottage.shutterColor,
      w: cottage.settings.frontShutters === false ? 0.95 : 1,
      box: cottage.settings.box ?? propsState.propPalette.woodWarm,
    });
    cottage.builder.pop();
    cottage.metadata.windows.push({
      x: result110,
      y: 2,
      z: cottage.frontZ + 0.1,
      nx: 0,
      nz: 1,
    });
  }
  for (let result111 of [-1, 1]) {
    let result112 =
      result111 > 0 ? (cottage.hasChimney ? 1 : 0.7) : cottage.hasPlasterWalls ? -0.14 : 0;
    let result113 = result111 > 0 && cottage.hasChimney ? null : cottage.shutterColor;
    cottage.builder.push(
      (result111 * cottage.width) / 2,
      2.05,
      result112,
      0,
      (result111 * Math.PI) / 2,
      0,
    );
    appendCottageWindowGeometry(cottage.builder, cottage.random, {
      ...cottage.windowStyle,
      shutter: result113,
      w: 0.9,
      box: result111 < 0 && cottage.hasPlasterWalls ? propsState.propPalette.woodWarm : false,
    });
    cottage.builder.pop();
    cottage.metadata.windows.push({
      x: result111 * (cottage.width / 2 + 0.1),
      y: 2,
      z: result112,
      nx: result111,
      nz: 0,
    });
  }
  for (let result114 of [-cottage.width / 4, cottage.width / 4]) {
    cottage.builder.push(result114, 2.05, -cottage.depth / 2, 0, Math.PI, 0);
    appendCottageWindowGeometry(cottage.builder, cottage.random, {
      ...cottage.windowStyle,
      w: 0.9,
      shutter: null,
    });
    cottage.builder.pop();
    cottage.metadata.windows.push({
      x: result114,
      y: 2,
      z: -cottage.depth / 2 - 0.1,
      nx: 0,
      nz: -1,
    });
  }
}
