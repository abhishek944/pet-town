import {
  countFor,
  createOceanFish,
  responsiveSelection,
  type OceanSceneryFrame,
} from "./ocean-fish";
import {
  createOceanSceneryArtwork,
  type BuoyArtwork,
  type LighthouseArtwork,
} from "./ocean-scenery-art";

export type { OceanSceneryFrame } from "./ocean-fish";

const DESIGN_WIDTH = 1512;
const KELP_X = [154, 1317, 922, 580, 1125];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dimension(value: number): number {
  return Number.isFinite(value) ? Math.max(1, value) : 1;
}

function surface(frame: OceanSceneryFrame, x: number): number {
  const value = frame.surfaceAt(clamp(x, 0, frame.width));
  return clamp(Number.isFinite(value) ? value : frame.height * 0.4, 0, frame.height - 1);
}

export function createOceanScenery(
  svg: SVGSVGElement,
  underwater: SVGGElement,
  landmarks: SVGGElement,
): { update(frame: OceanSceneryFrame): void } {
  const art = createOceanSceneryArtwork(svg, underwater, landmarks);
  const fish = createOceanFish(art.fish);
  let initialized = false;
  let visualTime = 8;

  function update(input: OceanSceneryFrame): void {
    const frame: OceanSceneryFrame = {
      ...input,
      width: dimension(input.width),
      height: dimension(input.height),
    };
    const elapsed = Number.isFinite(frame.elapsedSeconds) ? clamp(frame.elapsedSeconds, 0, 0.1) : 0;
    if (!initialized) {
      visualTime = Number.isFinite(frame.time) ? frame.time : 8;
      initialized = true;
    } else if (elapsed > 0 && !frame.reducedMotion) {
      visualTime = Number.isFinite(frame.time) ? frame.time : visualTime + elapsed;
    }
    fish.update(frame);

    const kelpCount = countFor(frame.width, KELP_X.length, 0);
    const bubbleCount = countFor(frame.width, art.bubbles.length);
    const reflectionCount = countFor(frame.width, art.reflections.length);
    const sizeScale = Math.min(1, frame.width / 700);
    for (const stem of art.kelp) {
      const visible = responsiveSelection(KELP_X.length, kelpCount, stem.cluster);
      stem.path.setAttribute("display", visible ? "inline" : "none");
      if (!visible) continue;
      const x =
        (KELP_X[stem.cluster] / DESIGN_WIDTH) * frame.width + (stem.stem - 1.5) * 6 * sizeScale;
      const depth = Math.max(0, frame.height - surface(frame, x));
      const height = Math.min(46, Math.max(0, depth - 2) * 0.64) - stem.stem * 2.2 * sizeScale;
      const sway =
        Math.sin(visualTime * 0.42 + stem.cluster * 0.87 + stem.stem * 0.31) * 6 * sizeScale;
      const base = frame.height + 3;
      const tip = base - Math.max(0, height);
      stem.path.setAttribute("stroke-width", String(3.2 * sizeScale));
      stem.path.setAttribute(
        "d",
        `M${x.toFixed(1)} ${base} Q${(x - 8 * sizeScale + sway * 0.4).toFixed(1)} ${(base + tip) / 2} ${(x + sway).toFixed(1)} ${tip.toFixed(1)}`,
      );
    }
    art.bubbles.forEach(({ circle, index }) => {
      const visible = responsiveSelection(art.bubbles.length, bubbleCount, index);
      circle.setAttribute("display", visible ? "inline" : "none");
      if (!visible) return;
      const x = ((180 + ((index * 191) % 1190)) / DESIGN_WIDTH) * frame.width;
      const depth = Math.max(0, frame.height - surface(frame, x));
      const radius = (1.1 + (index % 3) * 0.55) * Math.min(sizeScale, depth / 24);
      const phase = (((visualTime * 0.075 + index * 0.173) % 1) + 1) % 1;
      const travel = Math.max(0, depth - radius * 2 - 4);
      circle.setAttribute("r", radius.toFixed(2));
      circle.setAttribute(
        "cx",
        (x + Math.sin(visualTime * 0.8 + index) * 2 * sizeScale).toFixed(2),
      );
      circle.setAttribute("cy", (frame.height - radius - 2 - phase * travel).toFixed(2));
    });
    art.reflections.forEach(({ path, index }) => {
      const visible = responsiveSelection(art.reflections.length, reflectionCount, index);
      path.setAttribute("display", visible ? "inline" : "none");
      if (!visible) return;
      const x = ((90 + ((index * 113) % 1340)) / DESIGN_WIDTH) * frame.width;
      const length = (9 + (index % 5) * 2) * sizeScale;
      const xx = x + Math.sin(visualTime * 0.3 + index) * 5 * sizeScale;
      const lineY = surface(frame, xx);
      const yy = lineY + (4 + (index % 5) * 8) * Math.min(1, (frame.height - lineY) / 48);
      path.setAttribute(
        "d",
        `M${xx.toFixed(1)} ${yy.toFixed(1)} q${(length * 0.48).toFixed(1)} ${(Math.sin(visualTime + index) * sizeScale).toFixed(1)} ${length.toFixed(1)} 0`,
      );
      path.setAttribute("opacity", String(0.11 + (Math.sin(visualTime * 0.7 + index) + 1) * 0.055));
    });
    updateLandmarks(art.towers, art.buoys, frame, visualTime);
  }

  return { update };
}

function updateLandmarks(
  towers: LighthouseArtwork[],
  buoys: BuoyArtwork[],
  frame: OceanSceneryFrame,
  time: number,
): void {
  towers.forEach((tower) => {
    const inset = Math.min(41, frame.width * 0.12);
    const x = tower.side > 0 ? inset : frame.width - inset;
    const y = surface(frame, x);
    const scale = Math.min(1, frame.width / 420, Math.max(0, y - 3) / 76);
    const bob = Math.sin(time * 0.55 + tower.phase) * 1.1 * scale;
    const angle = Math.sin(time * 0.42 + tower.phase) * 1.35;
    const room = tower.side > 0 ? frame.width - x : x;
    const beamLength = Math.min(190, Math.max(0, room / Math.max(0.01, scale) - 8));
    tower.beam.setAttribute(
      "d",
      `M0 -53 L${tower.side * beamLength} -67 L${tower.side * beamLength} -28 Z`,
    );
    tower.group.setAttribute("display", scale > 0 ? "inline" : "none");
    tower.group.setAttribute(
      "transform",
      `translate(${x.toFixed(2)} ${(y + bob).toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${scale.toFixed(3)})`,
    );
  });
  buoys.forEach((buoy, index) => {
    const inset = Math.min(41, frame.width * 0.12);
    const rightInset = Math.max(
      Math.min(189, frame.width * 0.125),
      inset + 48 * Math.min(1, frame.width / 500),
    );
    const x = index === 0 ? inset + Math.min(119, frame.width * 0.1) : frame.width - rightInset;
    const y = surface(frame, x);
    const scale = Math.min(1, frame.width / 500, Math.max(0, y - 2) / 22);
    const bob = Math.sin(time * 0.7 + buoy.phase) * 1.4 * scale;
    const angle = Math.sin(time + buoy.phase) * 4.2;
    buoy.group.setAttribute("display", scale > 0 ? "inline" : "none");
    buoy.group.setAttribute(
      "transform",
      `translate(${x.toFixed(2)} ${(y + bob).toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${scale.toFixed(3)})`,
    );
  });
}
