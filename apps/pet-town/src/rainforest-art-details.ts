import {
  BUTTERFLIES,
  FIREFLIES,
  FIREFLY_DELAYS,
  RIPPLE_DELAYS,
  WATERLINE_DELAYS,
  type RainforestPalette,
} from "./rainforest-art-data";
import type { RainforestMode } from "./rainforest-motion";
import { svgGroup, svgNode, svgPath } from "./rainforest-art-shapes";

export function gradients(palette: RainforestPalette): string {
  const soil = svgNode(
    "linearGradient",
    { id: "soil", x2: 0, y2: 1 },
    svgNode("stop", { "stop-color": palette.soilTop }) +
      svgNode("stop", { offset: 1, "stop-color": palette.soilBottom }),
  );
  const stream = svgNode(
    "linearGradient",
    { id: "stream", x2: 0, y2: 1 },
    svgNode("stop", { "stop-color": "#80d5c5", "stop-opacity": 0.7 }) +
      svgNode("stop", { offset: 1, "stop-color": "#26756e", "stop-opacity": 0.85 }),
  );
  const fall = svgNode(
    "linearGradient",
    { id: "fall", x2: 1, y2: 0 },
    svgNode("stop", { "stop-color": "#71c8bc", "stop-opacity": 0.3 }) +
      svgNode("stop", { offset: 0.5, "stop-color": "#cbfff1", "stop-opacity": 0.85 }) +
      svgNode("stop", { offset: 1, "stop-color": "#58ada9", "stop-opacity": 0.4 }),
  );
  const mist = svgNode(
    "radialGradient",
    { id: "mist" },
    svgNode("stop", { "stop-color": palette.mist, "stop-opacity": 0.16 }) +
      svgNode("stop", { offset: 1, "stop-color": palette.mist, "stop-opacity": 0 }),
  );
  return svgNode("defs", {}, soil + stream + fall + mist);
}

export function rainforestTerrain(mode: RainforestMode, palette: RainforestPalette): string {
  const afterRain = mode === "after-rain";
  const ground = afterRain
    ? "M0 171 Q110 145 240 180T520 181T800 181T1090 180T1512 164V240H0Z"
    : "M0 176 Q110 150 240 185T520 186T800 186T1090 185T1512 169V240H0Z";
  const ridge = afterRain
    ? "M0 189Q220 171 430 197T900 192T1512 184"
    : "M0 194Q220 176 430 202T900 197T1512 189";
  return (
    svgPath(ground, { fill: "url(#soil)" }) +
    svgPath(ridge, {
      fill: "none",
      stroke: palette.ridge,
      "stroke-opacity": 0.36,
      "stroke-width": 10,
    })
  );
}

export function rainforestCreek(): string {
  const bank = svgPath("M85 221Q205 183 347 217T720 214T1100 220T1512 209V240H70Z", {
    fill: "url(#stream)",
  });
  const fallRock = svgPath("M73 178l10-62 46-10 25 75Z", { fill: "#446c5c" });
  const waterfall = svgPath("M92 120q18 17 36-1l9 86q-19 11-40 0Z", { fill: "url(#fall)" });
  const lines = WATERLINE_DELAYS.map((delay, index) =>
    svgPath(`M${99 + index * 6} 128q-5 24 0 66`, {
      class: "waterline",
      style: `--delay:-${delay}s`,
      stroke: "#d5fff0",
      "stroke-opacity": 0.45,
      fill: "none",
    }),
  ).join("");
  const ripples = RIPPLE_DELAYS.map((delay, index) =>
    svgPath(`M${100 + index * 94} ${[215, 223, 231][index % 3]}h${20 + (index % 4) * 8}`, {
      class: "ripple",
      style: `--delay:-${delay}s`,
      stroke: "#b7f1d7",
      "stroke-opacity": 0.4,
      "stroke-linecap": "round",
    }),
  ).join("");
  const bridge =
    svgPath("M658 195Q714 162 769 194", {
      stroke: "#836e4c",
      "stroke-width": 13,
      fill: "none",
    }) +
    svgPath("M658 182Q714 149 769 181", {
      stroke: "#baac7e",
      "stroke-width": 3,
      fill: "none",
    }) +
    svgPath("M672 177v15m22-22v13m24-16v13m25-10v15", {
      stroke: "#ab9668",
      "stroke-width": 3,
    });
  return bank + fallRock + waterfall + lines + ripples + bridge;
}

export function rainforestWildlife(mode: RainforestMode): string {
  if (mode === "after-rain") {
    return BUTTERFLIES.map(({ x, y, color, delay }) =>
      svgGroup(
        {
          class: "butterfly",
          style: `--delay:-${delay}s`,
          transform: `translate(${x} ${y})`,
        },
        svgGroup(
          { class: "wings" },
          svgPath("M0 0C-21-25-29 4-2 7C-16 23 0 22 0 4M0 0C21-25 29 4 2 7C16 23 0 22 0 4", {
            fill: color,
          }) + svgPath("M0-5V10", { stroke: "#243c32", "stroke-width": 2 }),
        ),
      ),
    ).join("");
  }
  return FIREFLIES.map(([x, y], index) =>
    svgGroup(
      {
        class: "firefly",
        style: `--delay:-${FIREFLY_DELAYS[index]}s`,
      },
      svgNode("circle", { cx: x, cy: y, r: 9, fill: "url(#mist)" }) +
        svgNode("circle", { cx: x, cy: y, r: 1.5, fill: "#d7f9a5" }),
    ),
  ).join("");
}

export function rainforestToucan(): string {
  return svgGroup(
    { transform: "translate(1428 103)" },
    svgPath("M-10 9q-16 23 3 29l13-7 3-18Z", { fill: "#182f2c" }) +
      svgNode("ellipse", { cx: 1, cy: 16, rx: 6, ry: 10, fill: "#eee4b3" }) +
      svgPath("M3 3Q43-3 40 16L3 14Z", { fill: "#edb259" }) +
      svgPath("M29 4q15 0 11 12H28Z", { fill: "#c77545" }) +
      svgNode("circle", { cx: -1, cy: 7, r: 2, fill: "#eef9d1" }),
  );
}

export function rainforestMist(): string {
  return svgGroup(
    { class: "mist" },
    svgNode("ellipse", { cx: 415, cy: 184, rx: 245, ry: 22, fill: "url(#mist)" }) +
      svgNode("ellipse", { cx: 1120, cy: 188, rx: 280, ry: 19, fill: "url(#mist)" }),
  );
}
