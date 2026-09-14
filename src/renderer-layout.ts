import { regionFor, type HitRegion } from "./renderer-view";

export interface PositionedMotion {
  x: number;
  direction: -1 | 1;
  dragging: boolean;
}

export function applyMotionPosition(element: HTMLElement, motion: PositionedMotion): void {
  element.classList.toggle("direction-right", motion.direction === 1);
  element.classList.toggle("direction-left", motion.direction === -1);
  element.style.transform = `translate3d(${motion.x.toFixed(2)}px, 0, 0)`;
}

export function collectHitRegions(
  root: HTMLElement,
  elements: Iterable<HTMLElement>,
  dragging: boolean,
): HitRegion[] {
  if (dragging) {
    return [{ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }];
  }
  return [
    ...[...elements]
      .filter((element) => !element.classList.contains("retiring"))
      .flatMap((element) => [element.querySelector(".pet"), element.querySelector(".project")]),
    ...root.querySelectorAll(".pet-menu, .pet-menu-backdrop"),
  ].filter((element): element is Element => element !== null)
    .map(regionFor)
    .filter((region): region is HitRegion => region !== null);
}
