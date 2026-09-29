import type { DesertMode } from "./preferences-types";

const NS = "http://www.w3.org/2000/svg";

/** Fixed wind ribbons and grains; only the village clock advances this scene. */
export class DesertMotion {
  private readonly ribbons: SVGPathElement[];
  private readonly grains: SVGEllipseElement[];
  private readonly ripples: SVGGElement[];
  private width = 0;
  private height = 0;
  private seconds = 0;

  constructor(
    private readonly svg: SVGSVGElement,
    mode: DesertMode,
  ) {
    const night = mode === "moonlit-oasis";
    const sand = svg.querySelector<SVGGElement>("[data-desert-sand]")!;
    const dust = svg.querySelector<SVGGElement>("[data-desert-dust]")!;
    this.ribbons = Array.from({ length: 5 }, (_, i) => {
      const ribbon = svg.ownerDocument.createElementNS(NS, "path");
      ribbon.setAttribute("d", "M-120 1Q-42-9 22-4T140-2Q60 2 5 0T-120 1Z");
      ribbon.setAttribute("fill", night ? "#c7d5df" : "#ffe0a8");
      ribbon.setAttribute("stroke", night ? "#cad7df" : "#ffe5b7");
      ribbon.setAttribute("stroke-width", ".6");
      ribbon.dataset.sandRibbon = String(i);
      sand.append(ribbon);
      return ribbon;
    });
    this.grains = Array.from({ length: 24 }, (_, i) => {
      const grain = svg.ownerDocument.createElementNS(NS, "ellipse");
      grain.setAttribute("rx", String(0.9 + (i % 2) * 0.5));
      grain.setAttribute("ry", ".65");
      grain.setAttribute("fill", night ? "#d2c5b1" : "#f8d8a3");
      dust.append(grain);
      return grain;
    });
    this.ripples = [...svg.querySelectorAll<SVGGElement>(".water-lines")];
  }

  setBounds(width: number, height: number): void {
    this.width = width;
    this.height = height;
    for (const group of this.svg.querySelectorAll<SVGGElement>(
      "[data-desert-sand], [data-desert-dust]",
    )) {
      group.setAttribute(
        "transform",
        `scale(${1512 / Math.max(1, width)} ${290 / Math.max(1, height)})`,
      );
    }
    this.draw();
  }

  advance(elapsedMs: number): void {
    if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
    this.seconds += Math.min(80, elapsedMs) / 1000;
    this.draw();
  }

  private draw(): void {
    if (this.width <= 0 || this.height <= 0) return;
    const t = this.seconds;
    const band = Math.min(55, this.height * 0.25);
    this.ribbons.forEach((node, i) => {
      const span = this.width + 360;
      const x = (((i * span) / 5 + t * (19 + i * 3)) % span) - 180;
      const y = this.height - 9 - ((i % 3) * band) / 3 + Math.sin(t * 0.55 + i) * 2;
      node.setAttribute(
        "transform",
        `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${0.8 + i * 0.07} 1)`,
      );
      node.style.opacity = String(0.18 + 0.07 * Math.sin(t * 0.4 + i));
    });
    this.grains.forEach((node, i) => {
      const x =
        ((((i * 173 + 68) / 1512) * this.width + t * (12 + (i % 5) * 4)) % (this.width + 24)) - 12;
      const y = this.height - 9 - ((i * 13) % band) + Math.sin(t * 0.7 + i) * 2;
      node.setAttribute("cx", x.toFixed(2));
      node.setAttribute("cy", y.toFixed(2));
      node.style.opacity = String(0.34 + 0.14 * Math.sin(t * 0.5 + i));
    });
    for (const ripple of this.ripples) {
      ripple.setAttribute("transform", `translate(${(Math.sin(t * 0.65) * 3).toFixed(2)} 0)`);
      ripple.style.opacity = String(0.6 + Math.cos(t * 0.65) * 0.1);
    }
  }
}
