/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */

import { renderingState } from "../state.js";
import { blendColorGradeVector } from "./blend-color-grade-vector.js";
import { blendColorGradeScalar } from "./blend-color-grade-scalar.js";
export function updatePostColorGrade(deltaTime, daylight) {
  const post = renderingState.postprocessingState;
  const { params: parameters, passes } = post;
  let gradeUniforms = passes.outputPass.uniforms;
  blendColorGradeVector(gradeUniforms.uWB.value, `wb`, daylight);
  blendColorGradeVector(gradeUniforms.uLift.value, `lift`, daylight);
  blendColorGradeVector(gradeUniforms.uGamma.value, `gamma`, daylight);
  blendColorGradeVector(gradeUniforms.uGain.value, `gain`, daylight);
  blendColorGradeVector(gradeUniforms.uShadowTint.value, `shadow`, daylight);
  blendColorGradeVector(gradeUniforms.uHighTint.value, `high`, daylight);
  blendColorGradeVector(gradeUniforms.uVigColor.value, `vig`, daylight);
  gradeUniforms.uSat.value = blendColorGradeScalar(`sat`, daylight);
  gradeUniforms.uVibrance.value = blendColorGradeScalar(`vib`, daylight);
  gradeUniforms.uContrast.value = blendColorGradeScalar(`contrast`, daylight);
  gradeUniforms.uVignette.value =
    blendColorGradeScalar(`vigAmt`, daylight) * parameters.vignette * (1 + post.underFull * 0.6);
  gradeUniforms.uMagentaCut.value = parameters.grade
    ? 0.25 * daylight.golden + 0.1 * daylight.night
    : 0;
  gradeUniforms.uChromaKnee.value = parameters.chromaKnee;
  gradeUniforms.uChromaSlope.value = parameters.chromaSlope;
  gradeUniforms.uGreenAmt.value = parameters.greenShift;
  gradeUniforms.uGrain.value = parameters.grain;
  gradeUniforms.uTime.value = post.time;
  gradeUniforms.uGradeAmt.value = parameters.debug ? 0 : parameters.grade;
  post.underGrade =
    (post.underGrade ?? 0) +
    (+!!post.underFull - (post.underGrade ?? 0)) * (1 - Math.exp(-deltaTime * 10));
  if (post.underGrade > 0.01) {
    gradeUniforms.uWB.value.lerp(post.tmpV.set(0.8, 1, 1.08), post.underGrade * 0.6);
    gradeUniforms.uLift.value.lerp(post.tmpV.set(0.03, 0.08, 0.1), post.underGrade * 0.7);
    gradeUniforms.uSat.value *= 1 - 0.1 * post.underGrade;
  }
}
