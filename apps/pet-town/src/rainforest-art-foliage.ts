import {
  EDGE_LEAVES,
  FLOWER_X,
  PLANT_DELAYS,
  PLANT_LAYOUT,
  type LeafShade,
  type PlantLayout,
  type RainforestPalette,
} from "./rainforest-art-data";
import { svgGroup, svgNode, svgPath } from "./rainforest-art-shapes";

const LEAF = "M0 0 C-33 -18 -34 -57 0 -88 C34 -57 33 -18 0 0Z";
const LEAF_VEINS = "M0 0V-78M0-24L-15-40M0-40L15-55M0-51L-10-65";
const FAN_ROTATIONS = [-32, 8, 48] as const;
const SPREAD_ROTATIONS = [-42, -2, 38] as const;
const PETALS = [
  [6, 0, 0],
  [1.8541019662497, 5.70633909777092, 72],
  [-4.8541019662497, 3.52671151375483, 144],
  [-4.8541019662497, -3.52671151375483, 216],
  [1.8541019662497, -5.70633909777092, 288],
] as const;

function leaf(fill: string): string {
  return (
    svgPath(LEAF, { fill }) +
    svgPath(LEAF_VEINS, {
      fill: "none",
      stroke: "#d5e9ac",
      "stroke-opacity": 0.22,
      "stroke-width": 1.5,
    })
  );
}

function foliagePalm(palette: RainforestPalette, transform: string): string {
  const trunk = svgPath("M-4 208C-4 154 22 90 7 4L33 0C30 93 35 140 15 203L53 222Z", {
    fill: palette.trunk,
  });
  const spine = svgPath("M12 195Q33 146 19 23", {
    stroke: palette.bark,
    "stroke-width": 6,
    fill: "none",
  });
  const branches = svgPath("M20 58Q60 38 102 49M15 90Q-11 53-35 49", {
    fill: "none",
    stroke: palette.trunk,
    "stroke-width": 12,
  });
  const vine = svgPath("M95 43q-15 20 0 43t-8 41", {
    class: "vine",
    fill: "none",
    stroke: palette.bark,
    "stroke-width": 3,
  });
  return svgGroup({ transform }, trunk + spine + branches + vine);
}

function edgeLeaf(
  x: number,
  y: number,
  angle: number,
  scale: string,
  shade: LeafShade,
  palette: RainforestPalette,
): string {
  const fill =
    shade === "dark" ? palette.leafDark : shade === "mid" ? palette.leafMid : palette.leafBright;
  return svgGroup(
    { transform: `translate(${x} ${y}) rotate(${angle}) scale(${scale})` },
    leaf(fill),
  );
}

export function edgeFoliage(palette: RainforestPalette): string {
  const left = EDGE_LEAVES.map(([x, y, angle, scale, shade]) =>
    edgeLeaf(x, y, angle, scale, shade, palette),
  ).join("");
  const right = EDGE_LEAVES.map(([x, y, angle, scale, shade]) =>
    edgeLeaf(1516 - x, y, -angle, scale, shade, palette),
  ).join("");
  return (
    foliagePalm(palette, "translate(40 0) scale(1 1)") +
    left +
    foliagePalm(palette, "translate(1476 0) scale(-1 1)") +
    right
  );
}

function fern(color: string): string {
  const stem = svgPath("M0 0Q-8-42 8-72", {
    stroke: color,
    fill: "none",
    "stroke-width": 2,
  });
  const pairedLeaves = Array.from({ length: 7 }, (_, index) => {
    const rise = 8 + 9 * index;
    const spread = (26 - 2.8 * index).toFixed(1);
    return svgPath(
      `M0 -${rise}Q-${spread} -${rise - 3} -${spread} -${rise + 14}Q-8 -${rise + 13} 0 -${rise}` +
        `M0 -${rise}Q${spread} -${rise - 1} ${spread} -${rise + 15}Q8 -${rise + 12} 0 -${rise}`,
      { fill: color },
    );
  }).join("");
  return stem + pairedLeaves;
}

function leafPlant(item: PlantLayout, palette: RainforestPalette): string {
  const rotations = item.kind === "leaf-fan" ? FAN_ROTATIONS : SPREAD_ROTATIONS;
  const colors = [palette.leafMid, palette.leafBright, palette.leafDark];
  return rotations
    .map((angle, index) =>
      svgGroup(
        {
          transform: `translate(${item.x} 222) rotate(${angle}) scale(${item.scale})`,
        },
        leaf(colors[index]),
      ),
    )
    .join("");
}

function plant(item: PlantLayout, index: number, palette: RainforestPalette): string {
  const style = `--delay:-${PLANT_DELAYS[index]}s;transform-origin:${item.x}px 222px`;
  const content =
    item.kind === "fern"
      ? svgGroup(
          { transform: `translate(${item.x} 222) scale(${item.scale})` },
          fern(palette.leafBright),
        )
      : leafPlant(item, palette);
  return svgGroup({ class: "plant", style }, content);
}

export function rainforestPlants(palette: RainforestPalette): string {
  return PLANT_LAYOUT.map((item, index) => plant(item, index, palette)).join("");
}

export function rainforestFlowers(palette: RainforestPalette): string {
  return FLOWER_X.map((x) => {
    const stem = svgPath(`M${x} 225v-22`, { stroke: palette.leafBright, "stroke-width": 2 });
    const petals = PETALS.map(([dx, dy, angle]) => {
      const cx = x + dx;
      const cy = 205 + dy;
      return svgNode("ellipse", {
        cx,
        cy,
        rx: 5,
        ry: 8,
        transform: `rotate(${angle} ${cx} ${cy})`,
        fill: palette.blossom,
      });
    }).join("");
    const center = svgNode("circle", { cx: x, cy: 205, r: 3, fill: "#f4dba0" });
    return stem + petals + center;
  }).join("");
}
