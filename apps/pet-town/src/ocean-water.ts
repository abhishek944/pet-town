import type { StripTheme } from "./preferences-types";

// The same Soft Surf SVG path drives both the visible crest and boat positions.
const surface = "M0 14 C95 12 145 3 240 10 S400 17 510 13 S660 1 810 13 S980 18 1080 11 S1260 3 1370 12 S1510 17 1600 13";
const SURFACE_SAMPLES = 1024;
const wavePoints = new WeakMap<SVGPathElement, { x: number; y: number }[]>();

export function createOceanWater(): HTMLElement {
  const water = document.createElement("div");
  water.className = "ocean-water";
  water.setAttribute("aria-hidden", "true");
  water.hidden = true;
  water.innerHTML = `<svg viewBox="0 0 1600 102" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs><linearGradient id="ocean-body-gradient" x1="0" y1="0" x2="0" y2="1">
      <stop class="ocean-top" stop-color="#37dcdf"/>
      <stop class="ocean-bottom" offset="1" stop-color="#167eac"/>
    </linearGradient></defs>
    <path class="ocean-body" d="${surface} L1600 102 L0 102 Z" fill="url(#ocean-body-gradient)"/>
    <path d="${surface}" class="ocean-wave-depth" fill="none"/>
    <path d="${surface}" class="ocean-wave-crest" fill="none"/>
  </svg>`;
  return water;
}

export function updateOceanWater(
  water: HTMLElement,
  theme: StripTheme,
  opacityPercent: number,
  waterlineHeightPx = 88,
): void {
  water.hidden = theme !== "ocean";
  const strength = Math.max(16, Math.min(36, opacityPercent));
  const lineHeight = Math.max(50, Math.min(146, waterlineHeightPx));
  const bodyHeight = lineHeight + 14;
  water.style.height = `${bodyHeight}px`;
  water.querySelector("svg")?.setAttribute("viewBox", `0 0 1600 ${bodyHeight}`);
  water.querySelector(".ocean-body")?.setAttribute("d", `${surface} L1600 ${bodyHeight} L0 ${bodyHeight} Z`);
  water.style.setProperty("--ocean-top-opacity", String(strength / 100));
  // 16% at the surface pairs with 13% at the bottom; 36% pairs with 29%.
  water.style.setProperty("--ocean-bottom-opacity", String((strength * 0.8 + 0.2) / 100));
}

/** Sample the displayed crest, including its CSS drift and current viewport scale. */
export function oceanWaveSampler(water: HTMLElement, waterlineHeightPx: number): ((localX: number) => number) | null {
  if (water.hidden) return null;
  const path = water.querySelector<SVGPathElement>(".ocean-wave-crest");
  const svg = water.querySelector<SVGSVGElement>("svg");
  const parent = water.parentElement;
  if (!path || !svg || !parent) return null;
  const svgBounds = svg.getBoundingClientRect();
  if (!svgBounds.width || !svgBounds.height) return null;
  let points = wavePoints.get(path);
  if (!points) {
    const length = path.getTotalLength();
    points = Array.from({ length: SURFACE_SAMPLES + 1 }, (_, index) => {
      const point = path.getPointAtLength(length * index / SURFACE_SAMPLES);
      return { x: point.x, y: point.y };
    });
    wavePoints.set(path, points);
  }
  const rootBounds = parent.getBoundingClientRect();
  const baseline = rootBounds.bottom - waterlineHeightPx;
  const widthScale = svgBounds.width / svg.viewBox.baseVal.width;
  const heightScale = svgBounds.height / svg.viewBox.baseVal.height;
  return (localX) => {
    const targetX = (rootBounds.left + localX - svgBounds.left) / widthScale;
    let low = 0;
    let high = points.length - 1;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if (points[middle].x < targetX) low = middle;
      else high = middle;
    }
    const left = points[low];
    const right = points[high];
    const fraction = Math.max(0, Math.min(1, (targetX - left.x) / (right.x - left.x || 1)));
    const surfaceY = left.y + (right.y - left.y) * fraction;
    return svgBounds.top + surfaceY * heightScale - baseline;
  };
}
