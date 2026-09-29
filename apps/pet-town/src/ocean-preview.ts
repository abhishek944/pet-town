import { advanceOceanWater } from "./ocean-water";

/** Settings has its own window/clock; the desktop renderer remains paused while it is open. */
export function startOceanPreview(water: HTMLElement): void {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let previous = 0;
  const animate = (now: number): void => {
    if (!water.isConnected) return;
    const gap = previous ? now - previous : 0;
    previous = now;
    if (!document.hidden && water.offsetParent !== null) {
      advanceOceanWater(water, gap > 250 ? 0 : gap, reducedMotion.matches);
    }
    window.requestAnimationFrame(animate);
  };
  window.requestAnimationFrame(animate);
}
