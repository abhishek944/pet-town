import type { FishArtwork } from "./ocean-scenery-art";

export interface OceanSceneryFrame {
  width: number;
  height: number;
  time: number;
  elapsedSeconds: number;
  surfaceAt: (x: number) => number;
  reducedMotion: boolean;
}

interface Fish extends FishArtwork {
  seed: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  heading: number;
  speed: number;
}

type Geometry = OceanSceneryFrame;
const DESIGN_WIDTH = 1512;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dimension(value: number): number {
  return Number.isFinite(value) ? Math.max(1, value) : 1;
}

function surface(frame: Geometry, x: number): number {
  const value = frame.surfaceAt(clamp(x, 0, frame.width));
  return clamp(Number.isFinite(value) ? value : frame.height * 0.4, 0, frame.height - 1);
}

export function countFor(width: number, nominal: number, minimum = 1): number {
  if (width < 40) return 0;
  return clamp(Math.round(nominal * Math.min(1, width / DESIGN_WIDTH)), minimum, nominal);
}

export function responsiveSelection(total: number, count: number, index: number): boolean {
  if (count >= total) return true;
  if (count <= 0) return false;
  if (count === 1) return index === Math.round((total - 1) / 2);
  for (let slot = 0; slot < count; slot++) {
    if (index === Math.round((slot * (total - 1)) / (count - 1))) return true;
  }
  return false;
}

function random(fish: Fish): number {
  fish.seed = (Math.imul(fish.seed, 1664525) + 1013904223) >>> 0;
  return fish.seed / 4294967296;
}

function fishScale(fish: Fish, frame: Geometry): number {
  const depth = Math.max(0, frame.height - surface(frame, fish.x));
  return Math.min(1, frame.width / 700, depth / 32);
}

function constrainFish(fish: Fish, frame: Geometry): void {
  const size = fishScale(fish, frame);
  const horizontal = Math.min(15 * size, frame.width / 2);
  fish.x = clamp(fish.x, horizontal, frame.width - horizontal);
  const waterline = surface(frame, fish.x);
  const vertical = Math.min(15 * size, (frame.height - waterline) / 2);
  fish.y = clamp(fish.y, waterline + vertical, frame.height - vertical);
}

function chooseTarget(fish: Fish, frame: Geometry): void {
  const size = fishScale(fish, frame);
  const margin = Math.min(14 * size, frame.width * 0.08);
  fish.targetX = margin + random(fish) * Math.max(0, frame.width - margin * 2);
  const top = surface(frame, fish.targetX);
  fish.targetY = top + (frame.height - top) * (0.28 + random(fish) * 0.44);
}

function steer(fish: Fish, frame: Geometry, elapsed: number): void {
  const steps = Math.max(1, Math.ceil(elapsed / 0.025));
  const step = elapsed / steps;
  for (let index = 0; index < steps; index++) {
    constrainFish(fish, frame);
    const dx = fish.targetX - fish.x;
    const dy = fish.targetY - fish.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 14 * fishScale(fish, frame)) chooseTarget(fish, frame);
    const angle = Math.atan2(fish.targetY - fish.y, fish.targetX - fish.x);
    let difference = (angle - fish.heading + Math.PI) % (Math.PI * 2);
    if (difference < 0) difference += Math.PI * 2;
    difference -= Math.PI;
    fish.heading += clamp(difference, -2.4 * step, 2.4 * step);
    const speed = fish.speed * Math.min(1, frame.width / 700);
    const travel = Math.min(distance, speed * step);
    fish.x += Math.cos(fish.heading) * travel;
    fish.y += Math.sin(fish.heading) * travel;
    constrainFish(fish, frame);
  }
}

function remapFish(fish: Fish[], old: Geometry, next: Geometry): void {
  for (const swimmer of fish) {
    const oldX = clamp(swimmer.x, 0, old.width);
    const oldSurface = surface(old, oldX);
    const oldDepth = Math.max(1, old.height - oldSurface);
    const fraction = clamp((swimmer.y - oldSurface) / oldDepth, 0.18, 0.84);
    const targetX = clamp(swimmer.targetX, 0, old.width);
    const targetSurface = surface(old, targetX);
    const targetDepth = Math.max(1, old.height - targetSurface);
    const targetFraction = clamp((swimmer.targetY - targetSurface) / targetDepth, 0.18, 0.84);
    swimmer.x = (oldX / old.width) * next.width;
    const waterline = surface(next, swimmer.x);
    swimmer.y = waterline + (next.height - waterline) * fraction;
    swimmer.targetX = (targetX / old.width) * next.width;
    const targetTop = surface(next, swimmer.targetX);
    swimmer.targetY = targetTop + (next.height - targetTop) * targetFraction;
  }
}

export function createOceanFish(artwork: FishArtwork[]): {
  update(frame: OceanSceneryFrame): void;
} {
  const fish: Fish[] = artwork.map((art) => ({
    ...art,
    seed: (art.index + 17) >>> 0,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    heading: 0,
    speed: 20,
  }));
  let initialized = false;
  let previous: Geometry | null = null;

  function update(input: OceanSceneryFrame): void {
    const frame: Geometry = {
      ...input,
      width: dimension(input.width),
      height: dimension(input.height),
    };
    const elapsed = Number.isFinite(frame.elapsedSeconds) ? clamp(frame.elapsedSeconds, 0, 0.1) : 0;
    if (!initialized) {
      for (const swimmer of fish) {
        const size = Math.min(1, frame.width / 700);
        swimmer.x =
          (frame.width * (swimmer.index + 0.5)) / fish.length +
          (random(swimmer) - 0.5) * Math.min(14 * size, frame.width * 0.012);
        const top = surface(frame, swimmer.x);
        swimmer.y = top + (frame.height - top) * (0.36 + random(swimmer) * 0.38);
        swimmer.heading = swimmer.index % 2 ? 0 : Math.PI;
        swimmer.speed = 20 + random(swimmer) * 11;
        chooseTarget(swimmer, frame);
      }
      initialized = true;
    }
    if (previous && (previous.width !== frame.width || previous.height !== frame.height)) {
      remapFish(fish, previous, frame);
    }
    if (elapsed > 0 && !frame.reducedMotion) {
      for (const swimmer of fish) steer(swimmer, frame, elapsed);
    }

    const fishCount = countFor(frame.width, fish.length);
    for (const swimmer of fish) {
      constrainFish(swimmer, frame);
      const visible =
        responsiveSelection(fish.length, fishCount, swimmer.index) && fishScale(swimmer, frame) > 0;
      swimmer.group.setAttribute("display", visible ? "inline" : "none");
      if (!visible) continue;
      const scale = fishScale(swimmer, frame);
      const facing = Math.cos(swimmer.heading);
      const facingWidth = (facing < 0 ? -1 : 1) * Math.max(0.25, Math.abs(facing));
      const tilt = Math.sin(swimmer.heading) * 12 * facing;
      swimmer.group.setAttribute(
        "transform",
        `translate(${swimmer.x.toFixed(2)} ${swimmer.y.toFixed(2)}) rotate(${tilt.toFixed(1)}) scale(${(scale * facingWidth).toFixed(3)} ${scale.toFixed(3)})`,
      );
    }
    previous = frame;
  }

  return { update };
}
