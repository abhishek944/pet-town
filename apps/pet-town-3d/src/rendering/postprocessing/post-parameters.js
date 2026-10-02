import * as THREE from "three";
import { readPostNumericParameter } from "./read-post-numeric-parameter.js";

/** URL overrides for the reference game's depth, lighting and color pipeline. */
export function createPostParameters(query) {
  const debugView = query.get("post");
  const parameters = {
    enabled: debugView !== "off",
    debug: { ao: 1, coc: 2, depth: 3, aoraw: 1, normal: 1 }[debugView] ?? 0,
    aoBlur: debugView !== "aoraw" && debugView !== "normal",
    ao: query.get("ao") !== "0",
    aoRadius: 2.2,
    aoIntensity: 2.7,
    aoStrength: 1,
    aoPower: 1.5,
    aoTint: new THREE.Color(0.52, 0.5, 0.68),
    bloom: query.get("bloom") !== "0",
    bloomStrength: 0.3,
    bloomRadius: 0.55,
    bloomThreshold: 0.85,
    bloomKnee: 0.9,
    dof: query.get("dof") !== "0" && query.get("tilt") !== "0",
    tiltTop: 0.4,
    tiltBottom: 0.5,
    band: 0.2,
    ramp: 0.36,
    farAmt: 0.5,
    nearAmt: 0.3,
    focusDist: null,
    sharpen: null,
    haze: query.get("haze") === "0" ? 0 : readPostNumericParameter(query, "haze", 0.9),
    hazeStart: 18,
    hazeEnd: 110,
    shafts: query.get("shafts") === "0" ? 0 : readPostNumericParameter(query, "shafts", 1),
    mist: query.get("mist") === "0" ? 0 : readPostNumericParameter(query, "mist", 1),
    mistCap: 0.6,
    grade: query.get("grade") === "0" ? 0 : 1,
    chromaKnee: 0.3,
    chromaSlope: 0.4,
    greenShift: 1,
    vignette: query.get("vignette") === "0" ? 0 : readPostNumericParameter(query, "vignette", 1),
    grain: query.get("grain")
      ? query.get("grain") === "1"
        ? 0.035
        : readPostNumericParameter(query, "grain", 0)
      : 0,
    toneMapping: query.get("tm") ?? "neutral",
    exposure: readPostNumericParameter(query, "exposure", 1),
    underwaterColor: new THREE.Color(0.1, 0.42, 0.5),
    underwaterDeep: new THREE.Color(0.03, 0.14, 0.24),
  };
  for (const [key, value] of query) {
    if (key.startsWith("p.") && key.slice(2) in parameters && Number.isFinite(parseFloat(value))) {
      parameters[key.slice(2)] = parseFloat(value);
    }
  }
  return parameters;
}
