/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
export function finishCottageMetadata(cottage) {
  if (
    (cottage.metadata.colliders.push({
      x: 0,
      z: 0,
      w: cottage.width + 0.5,
      d: cottage.depth + 0.5,
      radius: Math.hypot(cottage.width + 0.5, cottage.depth + 0.5) / 2,
      y0: -cottage.foundationDepth,
      h: cottage.ridgeY + cottage.foundationDepth + 0.2,
      noTop: true,
    }),
    cottage.settings.porch === `veranda`)
  ) {
    for (let result145 of [
      -(cottage.porchWidth / 2 - 0.15),
      -0.95,
      0.95,
      cottage.porchWidth / 2 - 0.15,
    ]) {
      cottage.metadata.colliders.push({
        x: cottage.porch.cx + result145,
        z: cottage.porchStartZ + cottage.porchDepth - 0.15,
        radius: 0.12,
        y0: cottage.floorY,
        h: cottage.porchRoofY - cottage.floorY,
        noTop: true,
      });
    }
  } else {
    for (let result146 of [-1, 1]) {
      cottage.metadata.colliders.push({
        x: cottage.doorX + result146 * (cottage.porchWidth / 2 - 0.17),
        z: cottage.porchStartZ + cottage.porchDepth - 0.15,
        radius: 0.12,
        y0: cottage.floorY,
        h: cottage.porchRoofY - cottage.floorY,
        noTop: true,
      });
    }
  }
  cottage.metadata.porch = {
    cx: cottage.porch.cx,
    cz: cottage.porchStartZ + cottage.porchDepth / 2,
    r: Math.max(cottage.porchWidth, cottage.porchDepth) / 2 + 0.3,
  };
  cottage.metadata.height = cottage.ridgeY;
}
