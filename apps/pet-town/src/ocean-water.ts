import type { StripTheme } from "./preferences-types";
import { createOceanScenery } from "./ocean-scenery";

const SVG_NS = "http://www.w3.org/2000/svg";
let nextOceanId = 0;
interface OceanState {
  svg: SVGSVGElement;
  body: SVGPathElement;
  clip: SVGPathElement;
  crest: SVGPathElement;
  depth: SVGPathElement;
  back: SVGPathElement;
  wakes: SVGPathElement;
  spray: SVGPathElement;
  scenery: ReturnType<typeof createOceanScenery>;
  width: number;
  height: number;
  waterline: number;
  time: number;
  reducedMotion: boolean;
  dirty: boolean;
}
const states = new WeakMap<HTMLElement, OceanState>();

function path(parent: SVGElement, attributes: Record<string, string>): SVGPathElement {
  const element = document.createElementNS(SVG_NS, "path");
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  parent.append(element);
  return element;
}

// Screen-space wavelengths: resizing does not stretch the swells or their slope.
function waveOffset(x: number, time: number): number {
  return Math.sin(x / 93 - time * 0.4) * 8 + Math.sin(x / 39 - time * 0.62) * 1.76;
}
function surfaceAt(state: OceanState, x: number, time = state.time): number {
  return state.height - state.waterline + waveOffset(x, time);
}
function wavePath(state: OceanState, offset = 0, time = state.time): string {
  const segments = Math.max(1, Math.ceil(state.width / 6));
  const points = Array.from({ length: segments + 1 }, (_, index) => {
    const x = (state.width * index) / segments;
    return `${index ? "L" : "M"}${x.toFixed(1)} ${(surfaceAt(state, x, time) + offset).toFixed(2)}`;
  });
  return points.join(" ");
}

export function createOceanWater(): HTMLElement {
  const water = document.createElement("div");
  water.className = "ocean-water";
  water.setAttribute("aria-hidden", "true");
  water.hidden = true;
  const id = `living-coast-${nextOceanId++}`;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.innerHTML = `<defs>
    <linearGradient id="${id}-body" x1="0" y1="0" x2="0" y2="1">
      <stop class="ocean-top" stop-color="#2acece"/>
      <stop class="ocean-bottom" offset="1" stop-color="#125572"/>
    </linearGradient>
    <clipPath id="${id}-clip"><path/></clipPath>
  </defs>`;
  const back = path(svg, { class: "ocean-wave-back", fill: "none" });
  const body = path(svg, { fill: `url(#${id}-body)` });
  const underwater = document.createElementNS(SVG_NS, "g");
  underwater.setAttribute("clip-path", `url(#${id}-clip)`);
  svg.append(underwater);
  const depth = path(svg, { class: "ocean-wave-depth", fill: "none" });
  const crest = path(svg, { class: "ocean-wave-crest", fill: "none" });
  const landmarks = document.createElementNS(SVG_NS, "g");
  svg.append(landmarks);
  const wakes = path(svg, { class: "ocean-boat-wake", fill: "none" });
  const spray = path(svg, { class: "ocean-boat-spray", fill: "none" });
  water.append(svg);
  states.set(water, {
    svg,
    body,
    clip: svg.querySelector("clipPath path")!,
    crest,
    depth,
    back,
    wakes,
    spray,
    scenery: createOceanScenery(svg, underwater, landmarks),
    width: 0,
    height: 0,
    waterline: 88,
    time: 8,
    reducedMotion: false,
    dirty: true,
  });
  return water;
}

export function updateOceanWater(
  water: HTMLElement,
  theme: StripTheme,
  opacityPercent: number,
  waterlineHeightPx = 88,
): void {
  water.hidden = theme !== "ocean";
  const state = states.get(water);
  if (!state) return;
  const strength = Math.max(16, Math.min(36, opacityPercent));
  state.dirty = true;
  state.waterline = Math.max(50, Math.min(146, waterlineHeightPx));
  water.style.setProperty("--ocean-top-opacity", String(strength / 100));
  water.style.setProperty("--ocean-bottom-opacity", String((strength * 0.8) / 100));
  advanceOceanWater(water, 0, state.reducedMotion);
}

/** Driven by the renderer clock; there is no second RAF or CSS drift to desynchronize boats. */
export function advanceOceanWater(
  water: HTMLElement,
  elapsedMs: number,
  reducedMotion: boolean,
): boolean {
  const state = states.get(water);
  if (!state || water.hidden) return false;
  const width = water.clientWidth;
  const height = water.clientHeight;
  const resized = state.width !== width || state.height !== height;
  state.width = width;
  state.height = height;
  const motionChanged = state.reducedMotion !== reducedMotion;
  state.reducedMotion = reducedMotion;
  if (width < 1 || height < 1) return false;
  if (resized) state.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const elapsedSeconds =
    reducedMotion || water.classList.contains("is-paused")
      ? 0
      : Math.min(100, Math.max(0, elapsedMs)) / 1_000;
  if (!elapsedSeconds && !resized && !motionChanged && !state.dirty) return false;
  state.dirty = false;
  state.time += elapsedSeconds;
  const surface = wavePath(state);
  const body = `${surface} L${width} ${height} L0 ${height} Z`;
  state.body.setAttribute("d", body);
  state.clip.setAttribute("d", body);
  state.crest.setAttribute("d", surface);
  state.depth.setAttribute("d", wavePath(state, 4));
  state.back.setAttribute("d", wavePath(state, -5, state.time - 3));
  const time = state.time;
  const baseline = height - state.waterline;
  state.scenery.update({
    width,
    height,
    time,
    elapsedSeconds,
    reducedMotion,
    surfaceAt: (x) => baseline + waveOffset(x, time),
  });
  return true;
}

/** Relative to the existing boat baseline, in root CSS pixels. No per-pet SVG/DOM reads. */
export function oceanWaveSampler(water: HTMLElement): ((x: number) => number) | null {
  const state = states.get(water);
  if (water.hidden || !state || !state.width) return null;
  const time = state.time;
  return (x) => waveOffset(x, time);
}

export interface OceanBoatWake {
  x: number;
  width: number;
}
export function updateOceanWakes(water: HTMLElement, boats: readonly OceanBoatWake[]): void {
  const state = states.get(water);
  if (water.hidden || !state || !state.width) return;
  const wakes: string[] = [];
  const spray: string[] = [];
  // Bound decoration work, not the number of rendered agents.
  for (const [index, boat] of boats.slice(0, 64).entries()) {
    const x = boat.x;
    const y = surfaceAt(state, x);
    const half = Math.max(9, boat.width * 0.3);
    wakes.push(`M${x - half} ${y + 3} q-10 2 -20 0 M${x + half} ${y + 3} q9 2 17 0`);
    for (let drop = 0; drop < 2; drop++) {
      const phase = (state.time * 0.65 + index * 0.3 + drop * 0.12) % 1;
      const dropY = y - Math.sin(phase * Math.PI) * 5;
      spray.push(`M${x + half + drop * 3} ${dropY} v0.3`);
    }
  }
  const wakePath = wakes.join(" ");
  const sprayPath = spray.join(" ");
  if (state.wakes.getAttribute("d") !== wakePath) state.wakes.setAttribute("d", wakePath);
  if (state.spray.getAttribute("d") !== sprayPath) state.spray.setAttribute("d", sprayPath);
}
