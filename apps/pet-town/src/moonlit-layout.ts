import type { PositionedMotion } from "./renderer-layout";

/** Fixed CSS-pixel amplitude at every display height. */
export function canopyOffset(y: number): number {
  return 8 * Math.sin(y / 93) + 1.76 * Math.sin(y / 39);
}

export function canopyLayout(height: number): { top: number; height: number; span: number } {
  // Scenery fills the native work area; endpoint clearance belongs to the pets,
  // not the decorative vine. Interview-card margins must not become screen gaps.
  const sceneHeight = Math.max(0, height);
  return { top: 0, height: sceneHeight, span: Math.max(0, sceneHeight - 137) };
}

/** Pack nearby resting nooks without resetting any ascending agent's progress. */
export function settleCanopyNooks(
  elements: ReadonlyMap<string, HTMLElement>,
  motions: ReadonlyMap<string, PositionedMotion>,
  span: number,
  climbing: (element: HTMLElement) => boolean,
): void {
  const resting = [...elements]
    .flatMap(([id, element]) => {
      const motion = motions.get(id);
      return motion && !motion.dragging && !element.hidden && !climbing(element)
        ? [{ element, motion }]
        : [];
    })
    .sort(
      (a, b) =>
        a.motion.x - b.motion.x ||
        (a.element.dataset.agentId ?? "").localeCompare(b.element.dataset.agentId ?? ""),
    );
  if (resting.length < 2) return;
  const largest = Math.max(
    ...resting.map(({ element }) =>
      Math.max(
        Number.parseFloat(element.style.getPropertyValue("--canopy-size")) || 64,
        element.querySelector<HTMLElement>(".project")?.offsetHeight ?? 0,
      ),
    ),
  );
  const gap = Math.min(largest + 6, span / (resting.length - 1));
  for (let i = 1; i < resting.length; i++) {
    resting[i].motion.x = Math.max(resting[i].motion.x, resting[i - 1].motion.x + gap);
  }
  for (let i = resting.length - 1; i >= 0; i--) {
    resting[i].motion.x = Math.min(resting[i].motion.x, span - (resting.length - 1 - i) * gap);
  }
}
