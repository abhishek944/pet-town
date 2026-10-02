/** Vegetation shared uniforms, shader chunks, wind displacement, camera fading and material assembly. */
import { vegetationState } from "../state.js";
export function patchVegetationVertexShader(replaceValue, value, value2) {
  replaceValue = replaceValue.replace(
    `#include <common>`,
    `#include <common>
` + vegetationState.vegetationVertexCommonShader,
  );
  replaceValue = replaceValue.replace(
    `#include <begin_vertex>`,
    vegetationState.vegetationVertexDisplacementShader,
  );
  if (value2) {
    replaceValue = replaceValue.replace(
      `#include <project_vertex>`,
      vegetationState.vegetationVertexProjectionShader,
    );
  }
  if (!value) {
    replaceValue = replaceValue.replace(
      `#include <color_vertex>`,
      vegetationState.vegetationVertexColorShader,
    );
  }
  return replaceValue;
}
