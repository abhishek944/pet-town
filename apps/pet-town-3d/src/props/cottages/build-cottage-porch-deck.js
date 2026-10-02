/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { getCottagePorchLayout } from "./get-cottage-porch-layout.js";
import { getStairLayout } from "./get-stair-layout.js";
export function buildCottagePorchDeck(cottage) {
  cottage.porch = getCottagePorchLayout({
    W: cottage.width,
    D: cottage.depth,
    doorX: cottage.doorX,
    porch: cottage.settings.porch,
  });
  ({ pw: cottage.porchWidth, pd: cottage.porchDepth, pz0: cottage.porchStartZ } = cottage.porch);
  cottage.builder.add(
    `wood`,
    createBeveledPropBox(
      cottage.porchWidth - 0.1,
      cottage.floorY + cottage.foundationDepth - 0.1,
      cottage.porchDepth,
      0.04,
    ),
    {
      x: cottage.porch.cx,
      y: (0.4 - cottage.foundationDepth) / 2,
      z: cottage.porchStartZ + cottage.porchDepth / 2 - 0.05,
      tint: propsState.propPalette.timber,
      ao: 1.15,
      uv: {
        grain: 0,
      },
    },
  );
  cottage.porchPlankCount = Math.round(cottage.porchDepth / 0.27);
  for (let index2 = 0; index2 < cottage.porchPlankCount; index2++) {
    cottage.builder.add(
      `wood`,
      createBeveledPropBox(
        cottage.porchWidth,
        0.1,
        cottage.porchDepth / cottage.porchPlankCount - 0.025,
        0.025,
      ),
      {
        x: cottage.porch.cx + (cottage.random.next() - 0.5) * 0.04,
        y: 0.45,
        z:
          cottage.porchStartZ -
          0.05 +
          ((index2 + 0.5) * cottage.porchDepth) / cottage.porchPlankCount,
        tint: propsState.propPalette.woodWarm,
        jitter: 0.08,
        uv: {
          grain: 0,
        },
      },
    );
  }
  cottage.stairs = getStairLayout(cottage.floorY, Math.min(0, cottage.settings.frontGround ?? 0));
  for (let index3 = 0; index3 < cottage.stairs.n; index3++) {
    let result89 = cottage.floorY - (index3 + 1) * cottage.stairs.rise;
    let result90 = cottage.porch.stepZ + 0.2 + index3 * cottage.stairs.depth;
    let result91 = result89 + cottage.foundationDepth + index3 * 0.2;
    cottage.builder.add(
      `wood`,
      createBeveledPropBox(1.5, result91, cottage.stairs.depth + 0.04, 0.04),
      {
        x: cottage.porch.stepX,
        y: result89 - result91 / 2,
        z: result90,
        tint: propsState.propPalette.woodWarm,
        jitter: 0.05,
        uv: {
          grain: 0,
        },
      },
    );
    cottage.metadata.walk.push({
      cx: cottage.porch.stepX,
      cz: result90,
      hw: 0.75,
      hd: cottage.stairs.depth / 2 + 0.02,
      y: result89,
    });
  }
  cottage.metadata.walk.push({
    cx: cottage.porch.cx,
    cz: cottage.porchStartZ + cottage.porchDepth / 2 - 0.05,
    hw: cottage.porchWidth / 2,
    hd: cottage.porchDepth / 2 + 0.05,
    y: cottage.floorY,
  });
  cottage.metadata.clear.push(
    {
      x: cottage.porch.cx,
      z: cottage.porchStartZ + cottage.porchDepth / 2 + 0.1,
      r: Math.max(1.9, cottage.porchWidth / 2 + 0.2),
    },
    {
      x: cottage.porch.stepX,
      z: cottage.porch.stepZ + 0.2 + (cottage.stairs.n * cottage.stairs.depth) / 2,
      r: 1,
    },
  );
  cottage.metadata.front = new THREE.Vector3(
    cottage.porch.stepX,
    0,
    cottage.porch.stepZ + cottage.stairs.n * cottage.stairs.depth + 0.55,
  );
  cottage.builder.add(`cloth`, createBeveledPropBox(0.95, 0.025, 0.6, 0.01), {
    x: cottage.doorX,
    y: 0.512,
    z: cottage.frontZ + 0.55,
    noAO: true,
    uv: {
      grain: 2,
      scale: 1 / 0.8,
    },
  });
}
