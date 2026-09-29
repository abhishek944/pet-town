import type { DesertPalette } from "./desert-art-palette";

function path(d: string, fill: string, extra = ""): string {
  return `<path d="${d}" fill="${fill}" ${extra}/>`;
}

function ellipse(x: number, y: number, rx: number, ry: number, color: string, extra = ""): string {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" ${extra}/>`;
}

export function palm(
  x: number,
  y: number,
  scale: number,
  palette: DesertPalette,
  flip = 1,
): string {
  const shapes = [
    "M0-144Q-38-185-81-155Q-31-163 0-139Z",
    "M0-144Q-55-150-84-107Q-47-132 0-139Z",
    "M0-144Q-38-130-42-92Q-20-123 4-141Z",
    "M0-144Q-12-192 22-192Q6-174 5-140Z",
    "M0-144Q48-177 78-143Q43-151 4-139Z",
    "M0-144Q58-142 78-101Q39-127 3-138Z",
    "M0-144Q27-121 18-88Q11-120 0-139Z",
  ];
  const leaves = shapes
    .map((shape, index) => path(shape, index % 2 ? palette.leaf : palette.darkLeaf))
    .join("");
  return (
    `<g transform="translate(${x} ${y}) scale(${scale * flip} ${scale})">` +
    path("M-7 0Q15-58-2-139L7-142Q29-66 8 0Z", palette.wood) +
    path(
      "M-2-12 12-18M2-35 17-40M6-58 20-63M5-81 17-86M2-104 13-108",
      "none",
      `stroke="${palette.bark}" stroke-width="3"`,
    ) +
    leaves +
    ellipse(0, -140, 6, 7, palette.bark) +
    ellipse(8, -137, 5, 6, palette.wood) +
    "</g>"
  );
}

export function stone(x: number, y: number, scale: number, palette: DesertPalette): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})">` +
    path("M-27 0-21-17-6-23 15-20 28 0Z", palette.rock) +
    path("M-21-17-6-23 15-20 2-8Z", palette.highlight) +
    path("M2-8 15-20 28 0H8Z", palette.shadow) +
    "</g>"
  );
}

export function lamp(
  x: number,
  y: number,
  scale: number,
  palette: DesertPalette,
  night: boolean,
): string {
  const glow = night
    ? '<ellipse cx="0" cy="-18" rx="21" ry="25" fill="#ffbd6d" filter="url(#glow)" opacity=".7"/>'
    : "";
  const light = night ? "#ffe0a1" : palette.highlight;
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})">${glow}` +
    `<path d="M-9-2-11-27 0-35 11-27 9-2Z" fill="${palette.wood}"/>` +
    `<path d="M-6-6-7-24 0-28 7-24 6-6Z" fill="${light}"/>` +
    `<path d="M0-28V-6M-8-16H8" stroke="${palette.wood}" stroke-width="2"/>` +
    `<path d="M-4-34v-6q4-6 8 0v6" fill="none" stroke="${palette.wood}" stroke-width="2"/></g>`
  );
}

export function grass(x: number, y: number, scale: number, palette: DesertPalette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0Q-5-20-13-27M1 0Q9-27 4-34M2 0Q15-19 22-22" fill="none" stroke="${palette.leaf}" stroke-width="2"/></g>`;
}

export function spring(
  x: number,
  y: number,
  scale: number,
  palette: DesertPalette,
  night: boolean,
): string {
  const waterLines = night ? "#cfdbed" : "#d3f2d9";
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})">` +
    ellipse(0, 0, 129, 17, palette.water) +
    path(
      "M-119-1Q-60-19 45-12M-94 9Q-6 19 107 4",
      "none",
      `stroke="${palette.highlight}" stroke-width="2" opacity=".6"`,
    ) +
    `<g class="water-lines" stroke="${waterLines}" stroke-width="1.4" opacity=".7"><path d="M-79-2h46m17 9h50m-19-13h53"/></g>` +
    grass(-119, 3, 0.65, palette) +
    grass(115, 4, 0.55, palette) +
    "</g>"
  );
}

export function adobe(
  x: number,
  y: number,
  scale: number,
  palette: DesertPalette,
  night: boolean,
): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})">` +
    path("M-65 0V-83Q-65-90-56-90H50Q58-90 58-80V0Z", palette.rock) +
    path("M-65-82H58V-70H-65Z", palette.highlight) +
    path("M-65 0V-81L-51-74V0Z", palette.shadow) +
    path("M-3 0V-39Q-3-57 13-57Q29-57 29-39V0Z", palette.shadow) +
    path("M-36-48V-59Q-36-70-27-70Q-18-70-18-59V-48Z", night ? "#ffd184" : palette.water) +
    '<path d="M-38-48H-15" stroke="' +
    palette.wood +
    '" stroke-width="4"/>' +
    path("M-80-24-78-42-12-42-9-24Z", palette.fabric) +
    '<path d="M-77-24V0M-13-24V0" stroke="' +
    palette.wood +
    '" stroke-width="3"/>' +
    path("M-63-93H57", "none", `stroke="${palette.highlight}" stroke-width="6"`) +
    lamp(46, -2, 0.65, palette, night) +
    ellipse(-38, -5, 10, 5, palette.wood) +
    "</g>"
  );
}

export function tent(x: number, y: number, scale: number, palette: DesertPalette): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})">` +
    path("M-82 0-12-82 0-91 15-77 83 0Z", palette.fabric) +
    path("M-82 0-12-82 0-91-18 0Z", palette.highlight) +
    path("M-15 0 0-66 21 0Z", palette.shadow) +
    '<path d="M0-92v-13M-82 0-99 4M83 0 100 4" stroke="' +
    palette.wood +
    '" stroke-width="2"/>' +
    '<path d="M-68-5-8-77M64-5 11-75" stroke="' +
    palette.wood +
    '" stroke-width="3" opacity=".5"/>' +
    "</g>"
  );
}
