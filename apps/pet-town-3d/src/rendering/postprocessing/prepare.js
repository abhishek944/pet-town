/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
import { initializePostprocessing } from "./initialize-postprocessing.js";
import { renderPostprocessing } from "./render-postprocessing.js";
import { resizePostprocessing } from "./resize-postprocessing.js";
import { updatePostprocessing } from "./update-postprocessing.js";
export function prepareRenderingPostprocessing() {
  renderingState.postprocessingModule = {
    get TIERS() {
      return renderingState.renderingQualityTiers;
    },
    get init() {
      return initializePostprocessing;
    },
    get render() {
      return renderPostprocessing;
    },
    get resize() {
      return resizePostprocessing;
    },
    get update() {
      return updatePostprocessing;
    },
  };
  renderingState.renderingQualityTiers = {
    low: {
      name: `low`,
      pr: 1,
      samples: 0,
      ao: true,
      aoSamples: 6,
      aoScale: 0.25,
      bloomScale: 0.5,
      fxaa: true,
      sharpen: 0,
      shadowMap: 1024,
      shadowHalf: 32,
      vegDensity: 0.5,
      vegDistance: 0.55,
      creatureShadows: false,
      reflection: 0,
      refraction: 0.5,
    },
    med: {
      name: `med`,
      pr: 1.25,
      samples: 2,
      ao: true,
      aoSamples: 8,
      aoScale: 0.35,
      bloomScale: 0.5,
      fxaa: false,
      sharpen: 0.2,
      shadowMap: 2048,
      shadowHalf: 40,
      vegDensity: 0.75,
      vegDistance: 0.8,
      creatureShadows: true,
      reflection: 0.25,
      refraction: 0.75,
    },
    high: {
      name: `high`,
      pr: 1.75,
      samples: 4,
      ao: true,
      aoSamples: 14,
      aoScale: 0.5,
      bloomScale: 1,
      fxaa: false,
      sharpen: 0.3,
      shadowMap: 4096,
      shadowHalf: 46,
      vegDensity: 1,
      vegDistance: 1,
      creatureShadows: true,
      reflection: 0.42,
      refraction: 1,
    },
  };
  for (let e of Object.values(renderingState.renderingQualityTiers)) {
    let t = () => e.name;
    Object.defineProperties(e, {
      toString: {
        value: t,
      },
      valueOf: {
        value: t,
      },
    });
  }
  renderingState.toneMappingModes = {
    aces: 4,
    agx: 6,
    neutral: 7,
  };
  renderingState.timeOfDayColorGrades = {
    day: {
      wb: [1.02, 1, 0.985],
      lift: [0.075, 0.075, 0.095],
      gamma: [1, 1, 1],
      gain: [1.06, 1.04, 1],
      shadow: [-0.015, 0, 0.04],
      high: [0.012, 0.004, 0],
      sat: 0.96,
      vib: 0.1,
      contrast: 0.08,
      vig: [0.78, 0.72, 0.78],
      vigAmt: 0.32,
      haze: [0.78, 0.88, 1],
    },
    golden: {
      wb: [1, 1, 1],
      lift: [0.045, 0.04, 0.065],
      gamma: [1.1, 1.07, 1.04],
      gain: [1.01, 1, 0.995],
      shadow: [-0.02, 0, 0.03],
      high: [0.035, 0.018, -0.01],
      sat: 1.04,
      vib: 0.12,
      contrast: 0.12,
      vig: [0.72, 0.6, 0.72],
      vigAmt: 0.38,
      haze: [1, 0.86, 0.8],
    },
    night: {
      wb: [0.9, 0.96, 1.08],
      lift: [0.03, 0.045, 0.085],
      gamma: [0.98, 1, 1.04],
      gain: [0.97, 1, 1.03],
      shadow: [-0.01, 0.01, 0.035],
      high: [0, 0.01, 0.02],
      sat: 0.82,
      vib: 0.1,
      contrast: 0.08,
      vig: [0.55, 0.6, 0.78],
      vigAmt: 0.5,
      haze: [0.22, 0.28, 0.45],
    },
  };
  renderingState.postprocessingState = null;
}
