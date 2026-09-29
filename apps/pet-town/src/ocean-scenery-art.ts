const SVG_NS = "http://www.w3.org/2000/svg";
const FISH_COLORS = ["#e7b16e", "#80c6c2", "#cbd4a1", "#80aebe"];

type Attrs = Record<string, string | number>;

export function addSvgElement<K extends keyof SVGElementTagNameMap>(
  svg: SVGSVGElement,
  parent: SVGElement,
  tag: K,
  attrs: Attrs,
): SVGElementTagNameMap[K] {
  const element = svg.ownerDocument.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value));
  parent.appendChild(element);
  return element;
}

export interface FishArtwork {
  group: SVGGElement;
  index: number;
}

export interface KelpStemArtwork {
  path: SVGPathElement;
  cluster: number;
  stem: number;
}

export interface LighthouseArtwork {
  group: SVGGElement;
  beam: SVGPathElement;
  side: number;
  phase: number;
}

export interface BuoyArtwork {
  group: SVGGElement;
  phase: number;
}

export interface BubbleArtwork {
  circle: SVGCircleElement;
  index: number;
}

export interface ReflectionArtwork {
  path: SVGPathElement;
  index: number;
}

export interface OceanSceneryArtwork {
  fish: FishArtwork[];
  kelp: KelpStemArtwork[];
  bubbles: BubbleArtwork[];
  reflections: ReflectionArtwork[];
  towers: LighthouseArtwork[];
  buoys: BuoyArtwork[];
}

function fishArt(svg: SVGSVGElement, parent: SVGGElement, index: number): FishArtwork {
  const group = addSvgElement(svg, parent, "g", { opacity: 0.56, "aria-hidden": "true" });
  const color = FISH_COLORS[index % FISH_COLORS.length];
  addSvgElement(svg, group, "path", { d: "M-6 0 L-13 -4.5 L-11 4 Z", fill: color });
  addSvgElement(svg, group, "ellipse", { cx: -1, rx: 7.8, ry: 3.6, fill: color });
  addSvgElement(svg, group, "path", {
    d: "M-3 -3 Q0 -7 3 -3 M-2 2 Q1 6 4 2",
    fill: color,
    opacity: 0.66,
  });
  addSvgElement(svg, group, "circle", { cx: 4.8, cy: -0.8, r: 0.75, fill: "#183343" });
  addSvgElement(svg, group, "path", {
    d: "M-4 0 Q0 1.8 4 0",
    fill: "none",
    stroke: "#f4f1df",
    "stroke-width": 0.55,
    opacity: 0.34,
  });
  return { group, index };
}

function lighthouseArt(
  svg: SVGSVGElement,
  parent: SVGGElement,
  side: number,
  phase: number,
): LighthouseArtwork {
  const group = addSvgElement(svg, parent, "g", { "aria-hidden": "true" });
  const beam = addSvgElement(svg, group, "path", { fill: "#f9df91", opacity: 0.055 });
  addSvgElement(svg, group, "ellipse", { cy: 5, rx: 35, ry: 4, fill: "#c5fbff", opacity: 0.09 });
  addSvgElement(svg, group, "path", {
    d: "M-29 0 L-21 -7 L-5 -9 L14 -7 L29 1 L20 6 L-20 6 Z",
    fill: "#334c55",
    stroke: "#83b4b3",
    "stroke-opacity": 0.35,
    "stroke-width": 1.3,
  });
  addSvgElement(svg, group, "path", {
    d: "M-25 -3 Q0 1 25 -3",
    fill: "none",
    stroke: "#9aa491",
    "stroke-width": 2.8,
  });
  addSvgElement(svg, group, "path", {
    d: "M-12 -7 L-8 -46 L8 -46 L12 -7 Z",
    fill: "#d6d8c9",
    stroke: "#718d92",
    "stroke-width": 1,
  });
  addSvgElement(svg, group, "path", {
    d: "M-9 -38 L9 -35 L10 -27 L-10 -30 Z M-11 -18 L11 -15 L12 -8 L-12 -8 Z",
    fill: "#b97867",
  });
  addSvgElement(svg, group, "path", { d: "M-10 -47 H10 V-59 H-10 Z", fill: "#344b58" });
  addSvgElement(svg, group, "rect", {
    x: -7,
    y: -56,
    width: 14,
    height: 6,
    rx: 1,
    fill: "#f4d991",
    opacity: 0.82,
  });
  addSvgElement(svg, group, "path", { d: "M-14 -59 L0 -69 L14 -59 Z", fill: "#bd7663" });
  addSvgElement(svg, group, "path", {
    d: "M0 -69 V-74 M-15 -46 H15 M-13 -50 V-44 M13 -50 V-44",
    fill: "none",
    stroke: "#819ba2",
    "stroke-width": 1.35,
  });
  addSvgElement(svg, group, "path", { d: "M-3 -7 V-14 Q0 -18 3 -14 V-7", fill: "#425761" });
  addSvgElement(svg, group, "circle", { cy: -53, r: 8, fill: "#f9df91", opacity: 0.14 });
  return { group, beam, side, phase };
}

function buoyArt(svg: SVGSVGElement, parent: SVGGElement, phase: number): BuoyArtwork {
  const group = addSvgElement(svg, parent, "g", { "aria-hidden": "true" });
  addSvgElement(svg, group, "ellipse", { cy: 2, rx: 10, ry: 2, fill: "#d9fcfb", opacity: 0.18 });
  addSvgElement(svg, group, "path", { d: "M-4 0 L-2 -11 H2 L4 0 Z", fill: "#c88d70" });
  addSvgElement(svg, group, "path", { d: "M-3 -6 H3", stroke: "#e7e2cf", "stroke-width": 2.7 });
  addSvgElement(svg, group, "path", { d: "M0 -11 V-19", stroke: "#92aaa7", "stroke-width": 1 });
  addSvgElement(svg, group, "circle", { cy: -19, r: 1.3, fill: "#e9d39d" });
  return { group, phase };
}

export function createOceanSceneryArtwork(
  svg: SVGSVGElement,
  underwater: SVGGElement,
  landmarks: SVGGElement,
): OceanSceneryArtwork {
  const life = addSvgElement(svg, underwater, "g", {
    "aria-hidden": "true",
    "pointer-events": "none",
  });
  const kelpLayer = addSvgElement(svg, life, "g", { opacity: 0.22 });
  const reflectionLayer = addSvgElement(svg, life, "g", {});
  const fishLayer = addSvgElement(svg, life, "g", {});
  const bubbleLayer = addSvgElement(svg, life, "g", {});
  const propLayer = addSvgElement(svg, landmarks, "g", {
    "aria-hidden": "true",
    "pointer-events": "none",
  });
  const fish = Array.from({ length: 12 }, (_, index) => fishArt(svg, fishLayer, index));
  const kelp: KelpStemArtwork[] = [];
  for (let cluster = 0; cluster < 5; cluster++) {
    for (let stem = 0; stem < 4; stem++) {
      const path = addSvgElement(svg, kelpLayer, "path", {
        fill: "none",
        stroke: stem % 2 ? "#81bdb2" : "#50a7a1",
        "stroke-width": 3.2,
        "stroke-linecap": "round",
        opacity: 0.88,
      });
      kelp.push({ path, cluster, stem });
    }
  }
  const bubbles = Array.from({ length: 14 }, (_, index) => ({
    circle: addSvgElement(svg, bubbleLayer, "circle", {
      fill: "none",
      stroke: "#a2dfdf",
      "stroke-width": 0.7,
      opacity: 0.35,
    }),
    index,
  }));
  const reflections = Array.from({ length: 28 }, (_, index) => ({
    path: addSvgElement(svg, reflectionLayer, "path", {
      fill: "none",
      stroke: "#c5fbff",
      "stroke-width": index % 3 ? 1 : 1.4,
      "stroke-linecap": "round",
    }),
    index,
  }));
  const towers = [lighthouseArt(svg, propLayer, 1, 0.4), lighthouseArt(svg, propLayer, -1, 1.7)];
  const buoys = [buoyArt(svg, propLayer, 0.8), buoyArt(svg, propLayer, 2.1)];
  return { fish, kelp, bubbles, reflections, towers, buoys };
}
