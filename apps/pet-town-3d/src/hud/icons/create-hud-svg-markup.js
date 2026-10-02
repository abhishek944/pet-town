/** Inline SVG HUD icon definitions. */
export let createHudSvgMarkup = (paths, viewBox = `0 0 24 24`) =>
  `<svg viewBox="${viewBox}" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
