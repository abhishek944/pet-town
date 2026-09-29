import type { SnowMode } from "./preferences-types";
import { cabin, lamp, pine, rock, snowPalette } from "./snow-art-shapes";

export function createSnowArt(mode: SnowMode): string {
  const night = mode === "aurora-night";
  const p = snowPalette(night);
  const composition = `<g data-snow-edge="left">${[
    pine(27, 269, 193, p),
    pine(91, 268, 129, p),
    cabin(180, 261, 0.82, night, p),
  ].join("")}</g><g data-snow-edge="right">${[
    pine(1438, 268, 184, p),
    pine(1499, 270, 143, p),
    rock(1329, 273, 0.8, p),
    lamp(1270, 268, 0.64, night, p),
  ].join("")}</g>`;
  const sky = night
    ? `<g class="aurora">
        <path d="M200 95Q440 -2 700 77T1320 41" fill="none" stroke="url(#aurora)" stroke-width="19" opacity=".32" filter="url(#soft)"/>
        <path d="M260 100Q465 21 701 86T1230 57" fill="none" stroke="#96e3c1" stroke-width="2" opacity=".22"/>
      </g>
      <g data-snow-edge="right"><circle cx="1317" cy="59" r="15" fill="#edf7ff" opacity=".8"/>
      <circle cx="1323" cy="55" r="14" fill="#7192b1"/></g>`
    : '<g data-snow-edge="right"><circle cx="1318" cy="64" r="18" fill="#fff0c7" opacity=".65"/></g>';

  return `<svg viewBox="0 0 1512 290" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="snow-ground" x2="0" y2="1">
        <stop stop-color="${p.snow}"/><stop offset="1" stop-color="${p.shade}"/>
      </linearGradient>
      <linearGradient id="aurora">
        <stop stop-color="#7ddaec" stop-opacity="0"/>
        <stop offset=".35" stop-color="#8bdfbe"/>
        <stop offset=".7" stop-color="#bba4ed"/>
        <stop offset="1" stop-color="#8abddf" stop-opacity="0"/>
      </linearGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    ${sky}
    <path d="M0 254L123 213L229 249L400 219L478 240L610 205L738 245L879 214L1001 244L1171 214L1281 244L1452 205L1512 237V290H0Z" fill="${p.shade}" opacity=".18"/>
    <path d="M0 256Q136 236 284 261T579 257T898 261T1206 257T1512 250V290H0Z" fill="url(#snow-ground)"/>
    <path d="M0 275Q320 268 755 275T1512 274V290H0Z" fill="${p.snow}"/>
    <path d="M0 272Q390 269 755 275T1512 271" fill="none" stroke="${p.shade}" stroke-width="1" opacity=".5"/>
    ${composition}
    <g id="snowflakes"></g>
    <g id="footprints"></g>
  </svg>`;
}
