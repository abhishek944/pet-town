import { regionFor, type HitRegion } from "./renderer-view";

export interface PositionedMotion {
  x: number;
  direction: -1 | 1;
  dragging: boolean;
}

export function applyMotionPosition(
  element: HTMLElement,
  motion: PositionedMotion,
  waveOffsetY = 0,
  wavePitch = 0,
): void {
  element.classList.toggle("direction-right", motion.direction === 1);
  element.classList.toggle("direction-left", motion.direction === -1);
  element.style.transform = `translate3d(${motion.x.toFixed(2)}px, ${waveOffsetY.toFixed(2)}px, 0)`;
  element.style.setProperty("--ocean-pitch", `${wavePitch.toFixed(2)}deg`);
}

function hitRegionFor(element: Element): HitRegion | null {
  if (
    !(element instanceof HTMLImageElement) ||
    !element.matches(".pet") ||
    !element.closest('.village[data-strip-theme="ocean"]')
  )
    return regionFor(element);
  // Visual pitch must not expand the native click-through exclusion rectangle.
  const parent = element.offsetParent;
  if (!(parent instanceof HTMLElement) || !element.offsetWidth || !element.offsetHeight)
    return null;
  const bounds = parent.getBoundingClientRect();
  return {
    x: bounds.left + parent.clientLeft + element.offsetLeft,
    y: bounds.top + parent.clientTop + element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
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
  ]
    .filter((element): element is Element => element !== null)
    .map(hitRegionFor)
    .filter((region): region is HitRegion => region !== null);
}
