/** Vegetation state, fixed and level-of-detail instance fields, and water-pass suppression. */
export function getVegetationRenderPass(getRenderTargetValue) {
  let renderTargetResult = getRenderTargetValue.getRenderTarget();
  return renderTargetResult
    ? renderTargetResult.texture && renderTargetResult.texture.name === `Water.reflection`
      ? 2
      : renderTargetResult.resolveDepthBuffer === false &&
          renderTargetResult.texture &&
          renderTargetResult.texture.generateMipmaps === true
        ? 1
        : 0
    : 0;
}
