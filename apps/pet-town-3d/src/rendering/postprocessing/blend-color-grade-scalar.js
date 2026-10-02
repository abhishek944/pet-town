/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
export let blendColorGradeScalar = (property, weights) =>
  renderingState.timeOfDayColorGrades.day[property] * weights.day +
  renderingState.timeOfDayColorGrades.golden[property] * weights.golden +
  renderingState.timeOfDayColorGrades.night[property] * weights.night;
