import type { SnowMode } from "./preferences-types";

const SVG_NS = "http://www.w3.org/2000/svg";
const LIFETIME_MS = 6_000;
interface Trail {
  x: number;
  pending: number;
  side: number;
  direction: number;
  scale: number;
}
interface Mark {
  node: SVGGElement;
  age: number;
}

/** A bounded history of real walking displacement, never a source of pet movement. */
export class SnowFootprints {
  private readonly marks: Mark[];
  private trails = new WeakMap<HTMLElement, Trail>();
  private cursor = 0;

  constructor(
    private readonly group: SVGGElement,
    mode: SnowMode,
  ) {
    const color = mode === "aurora-night" ? "#355574" : "#47657d";
    this.marks = Array.from({ length: 128 }, () => {
      const node = group.ownerDocument.createElementNS(SVG_NS, "g");
      node.innerHTML =
        `<path d="M-2.8 -1.1Q-.6 -2.1 2.2 -1.4L3 .1Q1 2 -2.4 1.3Z" fill="${color}"/>` +
        '<path d="M-2.4 1.4Q.8 2.3 3 .3" fill="none" stroke="#effaff" stroke-width=".6" opacity=".8"/>';
      node.style.opacity = "0";
      group.append(node);
      return { node, age: LIFETIME_MS };
    });
  }

  setBounds(width: number, height: number): void {
    this.group.setAttribute(
      "transform",
      `scale(${1512 / Math.max(1, width)} ${290 / Math.max(1, height)})`,
    );
    this.resetTracking();
    for (const mark of this.marks) {
      mark.age = LIFETIME_MS;
      mark.node.style.opacity = "0";
    }
  }

  resetTracking(): void {
    this.trails = new WeakMap();
  }

  synchronize(element: HTMLElement, x: number): void {
    // Poll/render refreshes at the same position must not erase the step remainder.
    if (this.trails.get(element)?.x !== x) this.trails.delete(element);
  }

  age(elapsedMs: number): void {
    for (const mark of this.marks) {
      if (mark.age >= LIFETIME_MS) continue;
      mark.age = Math.min(LIFETIME_MS, mark.age + elapsedMs);
      mark.node.style.opacity = String((1 - mark.age / LIFETIME_MS) * 0.85);
    }
  }

  sample(
    element: HTMLElement,
    x: number,
    direction: number,
    scale: number,
    walking: boolean,
    locateFeet: () => { x: number; y: number },
  ): void {
    if (!walking || !Number.isFinite(x) || !Number.isFinite(scale) || scale <= 0) {
      this.trails.delete(element);
      return;
    }
    const previous = this.trails.get(element);
    const delta = previous ? Math.abs(x - previous.x) : 0;
    if (
      !previous ||
      previous.direction !== direction ||
      previous.scale !== scale ||
      delta > 48 * scale
    ) {
      this.trails.set(element, { x, pending: 0, side: 0, direction, scale });
      return;
    }
    previous.x = x;
    previous.pending += delta;
    const spacing = 9 * scale;
    if (previous.pending < spacing) return;
    // Measure image geometry only when a step is due, not for every pet every frame.
    const feet = locateFeet();
    if (!Number.isFinite(feet.x) || !Number.isFinite(feet.y)) {
      this.trails.delete(element);
      return;
    }
    while (previous.pending >= spacing) {
      previous.pending -= spacing;
      const side = previous.side++ % 2 ? 1 : -1;
      const mark = this.marks[this.cursor++ % this.marks.length];
      mark.age = 0;
      const markX = feet.x - (previous.pending + 5 * scale) * direction;
      const markY = feet.y + side * 1.5 * scale;
      mark.node.setAttribute(
        "transform",
        `translate(${markX.toFixed(2)} ${markY.toFixed(2)}) scale(${scale.toFixed(3)}) rotate(${side * 12})`,
      );
      // Mirror the asymmetric shoe shape so toes follow travel direction.
      mark.node.firstElementChild?.setAttribute("transform", `scale(${direction} 1)`);
      mark.node.lastElementChild?.setAttribute("transform", `scale(${direction} 1)`);
      mark.node.style.opacity = "0.85";
    }
  }
}
