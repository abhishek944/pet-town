export type RainforestMode = "after-rain" | "firefly";

export interface InsectBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  visibleCount: number;
}

interface Insect {
  readonly group: SVGGElement;
  readonly index: number;
  readonly initialX: number;
  readonly initialY: number;
  readonly butterfly: boolean;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  heading: number;
  speed: number;
  seed: number;
}

const DESIGN_WIDTH = 1512;
const DESIGN_HEIGHT = 240;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function random(insect: Insect): number {
  insect.seed = (Math.imul(insect.seed, 1664525) + 1013904223) >>> 0;
  return insect.seed / 4294967296;
}

function readStartingPoint(group: SVGGElement, butterfly: boolean): [number, number] {
  if (butterfly) {
    const match = group
      .getAttribute("transform")
      ?.match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/);
    if (match) return [Number(match[1]), Number(match[2])];
  } else {
    const glow = group.querySelector("circle");
    const x = Number(glow?.getAttribute("cx"));
    const y = Number(glow?.getAttribute("cy"));
    if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
  }
  return [DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2];
}

export function createInsects(svg: SVGSVGElement, mode: RainforestMode): Insect[] {
  const butterfly = mode === "after-rain";
  const selector = butterfly ? "g.butterfly" : "g.firefly";
  return [...svg.querySelectorAll<SVGGElement>(selector)].map((group, index) => {
    const [x, y] = readStartingPoint(group, butterfly);
    const insect: Insect = {
      group,
      index,
      initialX: x,
      initialY: y,
      butterfly,
      x,
      y,
      targetX: x,
      targetY: y,
      heading: 0,
      speed: 20,
      seed: (Math.floor(Math.random() * 0xffffffff) ^ Math.imul(index + 31, 2654435761)) >>> 0,
    };
    insect.speed = 20 + random(insect) * 14;
    chooseTarget(insect, modeBounds(mode));
    return insect;
  });
}

export function modeBounds(mode: RainforestMode): InsectBounds {
  return mode === "after-rain"
    ? { minX: 30, maxX: DESIGN_WIDTH - 30, minY: 25, maxY: DESIGN_HEIGHT - 25, visibleCount: 0 }
    : { minX: 12, maxX: DESIGN_WIDTH - 12, minY: 14, maxY: DESIGN_HEIGHT - 14, visibleCount: 0 };
}

export function boundsFor(
  mode: RainforestMode,
  width: number,
  height: number,
  insectCount: number,
): InsectBounds {
  const bounds = modeBounds(mode);
  if (width < 40 || height < 32 || insectCount === 0) return { ...bounds, visibleCount: 0 };
  const widthRatio = Math.min(1, width / DESIGN_WIDTH);
  return { ...bounds, visibleCount: Math.max(1, Math.round(insectCount * widthRatio)) };
}

function chooseTarget(insect: Insect, bounds: InsectBounds): void {
  insect.targetX = bounds.minX + random(insect) * (bounds.maxX - bounds.minX);
  insect.targetY = bounds.minY + random(insect) * (bounds.maxY - bounds.minY);
}

function visibleAt(total: number, visibleCount: number, index: number): boolean {
  if (visibleCount <= 0) return false;
  if (visibleCount >= total) return true;
  if (visibleCount === 1) return index === Math.round((total - 1) / 2);
  for (let slot = 0; slot < visibleCount; slot += 1) {
    if (index === Math.round((slot * (total - 1)) / (visibleCount - 1))) return true;
  }
  return false;
}

function render(insect: Insect): void {
  const x = insect.x.toFixed(2);
  const y = insect.y.toFixed(2);
  const angle = ((insect.heading * 180) / Math.PI).toFixed(1);
  insect.group.setAttribute(
    "transform",
    insect.butterfly
      ? `translate(${x} ${y}) rotate(${angle})`
      : `translate(${x} ${y}) rotate(${angle}) translate(${-insect.initialX} ${-insect.initialY})`,
  );
}

function constrain(insect: Insect, bounds: InsectBounds): boolean {
  const oldX = insect.x;
  const oldY = insect.y;
  insect.x = clamp(insect.x, bounds.minX, bounds.maxX);
  insect.y = clamp(insect.y, bounds.minY, bounds.maxY);
  return oldX !== insect.x || oldY !== insect.y;
}

function steer(insect: Insect, bounds: InsectBounds, elapsed: number): void {
  const steps = Math.max(1, Math.ceil(elapsed / 0.025));
  const step = elapsed / steps;
  for (let index = 0; index < steps; index += 1) {
    constrain(insect, bounds);
    let dx = insect.targetX - insect.x;
    let dy = insect.targetY - insect.y;
    let distance = Math.hypot(dx, dy);
    if (distance < 9) {
      chooseTarget(insect, bounds);
      dx = insect.targetX - insect.x;
      dy = insect.targetY - insect.y;
      distance = Math.hypot(dx, dy);
    }
    const desired = Math.atan2(dy, dx);
    let turn = (desired - insect.heading + Math.PI) % (Math.PI * 2);
    if (turn < 0) turn += Math.PI * 2;
    turn -= Math.PI;
    insect.heading += clamp(turn, -2.2 * step, 2.2 * step);
    const travel = Math.min(distance, insect.speed * step);
    insect.x += Math.cos(insect.heading) * travel;
    insect.y += Math.sin(insect.heading) * travel;
    constrain(insect, bounds);
  }
}

export function advanceInsects(
  insects: readonly Insect[],
  elapsedMs: number,
  bounds: InsectBounds,
  move: boolean,
): void {
  const elapsed = move && Number.isFinite(elapsedMs) ? clamp(elapsedMs, 0, 100) / 1000 : 0;
  for (const insect of insects) {
    const visibility = visibleAt(insects.length, bounds.visibleCount, insect.index);
    if (visibility && insect.group.getAttribute("display") === "none") {
      insect.group.removeAttribute("display");
    } else if (!visibility && insect.group.getAttribute("display") !== "none") {
      insect.group.setAttribute("display", "none");
    }
    const constrained = constrain(insect, bounds);
    if (elapsed > 0) steer(insect, bounds, elapsed);
    if (constrained || elapsed > 0) render(insect);
  }
}
