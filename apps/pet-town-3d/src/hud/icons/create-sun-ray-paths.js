/** Inline SVG HUD icon definitions. */
export let createSunRayPaths = (centerX, centerY, innerRadius, outerRadius, color, width = 2.2) =>
  Array.from(
    {
      length: 8,
    },
    (value7, value8) => {
      let result = (value8 * Math.PI) / 4;
      let result2 = Math.cos(result);
      let result3 = Math.sin(result);
      return `<path d="M${(centerX + result2 * innerRadius).toFixed(2)} ${(centerY + result3 * innerRadius).toFixed(2)}L${(centerX + result2 * outerRadius).toFixed(2)} ${(centerY + result3 * outerRadius).toFixed(2)}" stroke="${color}" stroke-width="${width}"/>`;
    },
  ).join(``);
