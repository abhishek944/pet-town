function overlaps(left: DOMRect, right: DOMRect): boolean {
  return (
    left.left < right.right + 2 &&
    left.right + 2 > right.left &&
    left.top < right.bottom + 2 &&
    left.bottom + 2 > right.top
  );
}

export function resolveLabelOverlaps(elements: Iterable<HTMLElement>): void {
  const accepted: DOMRect[] = [];
  for (const element of elements) {
    delete element.dataset.labelOverlapHidden;
    const label = element.querySelector<HTMLElement>(".project");
    if (!label || element.hidden || element.dataset.labelVisibility === "hidden") continue;
    const bounds = label.getBoundingClientRect();
    if (accepted.some((other) => overlaps(bounds, other))) {
      element.dataset.labelOverlapHidden = "true";
    } else {
      accepted.push(bounds);
    }
  }
}
