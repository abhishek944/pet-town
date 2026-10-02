/** Player felt shading, wrapped lighting, dither fading and day-night material uniforms. */
import { playerState } from "../state.js";
export function applyPlayerDitherFade(onBeforeCompileValue) {
  let onBeforeCompile2 = onBeforeCompileValue.onBeforeCompile;
  onBeforeCompileValue.onBeforeCompile = (uniformsValue, value) => {
    onBeforeCompile2?.call(onBeforeCompileValue, uniformsValue, value);
    uniformsValue.uniforms.uPipFade = playerState.playerFadeUniform;
    uniformsValue.fragmentShader = uniformsValue.fragmentShader
      .replace(
        `#include <common>`,
        `#include <common>
` + playerState.playerFadeDeclarationGlsl,
      )
      .replace(
        `#include <clipping_planes_fragment>`,
        `#include <clipping_planes_fragment>
` + playerState.playerFadeDiscardGlsl,
      );
  };
  let result = onBeforeCompileValue.customProgramCacheKey?.bind(onBeforeCompileValue);
  onBeforeCompileValue.customProgramCacheKey = () => (result ? result() : ``) + `|pipFade`;
  return onBeforeCompileValue;
}
