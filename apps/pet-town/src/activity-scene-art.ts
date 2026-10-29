import { createCoasterArt } from "./activity-coaster-art";
import type { CoasterMode } from "./preferences-types";

export function scopeSvg(markup: string, prefix: string): string {
  return markup
    .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`);
}

/** Immutable stock scenery; actor props and their animation state stay separate. */
export function createActivitySceneSvg(
  ownerDocument: Document,
  theme: string,
  mode: CoasterMode,
  prefix: string,
): SVGSVGElement {
  const art = theme === "rollercoaster" ? createCoasterArt(mode) : "";
  const container = ownerDocument.createElement("div");
  container.innerHTML = scopeSvg(art, prefix);
  const svg = container.querySelector<SVGSVGElement>("svg");
  if (!svg) throw new Error("Activity scenery must contain an SVG root.");
  svg.setAttribute("preserveAspectRatio", "none");
  return svg;
}
