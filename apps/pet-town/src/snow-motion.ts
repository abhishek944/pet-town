const SVG_NS = "http://www.w3.org/2000/svg";

/** All snowfall and ambient motion advance only from the village's clock. */
export class SnowMotion {
  private readonly flakes: SVGCircleElement[];
  private readonly aurora: SVGGElement | null;
  private readonly chimney: SVGGElement | null;
  private width = 0;
  private height = 0;
  private seconds = 0;

  constructor(
    private readonly group: SVGGElement,
    svg: SVGSVGElement,
  ) {
    this.aurora = svg.querySelector(".aurora");
    this.chimney = svg.querySelector(".chimney");
    this.flakes = Array.from({ length: 36 }, (_, i) => {
      const node = group.ownerDocument.createElementNS(SVG_NS, "circle");
      node.setAttribute("r", String(0.7 + (i % 3) * 0.45));
      node.setAttribute("fill", "#f0faff");
      node.setAttribute("opacity", String(0.35 + (i % 4) * 0.14));
      group.append(node);
      return node;
    });
  }

  setBounds(width: number, height: number): void {
    this.width = Math.max(0, width);
    this.height = Math.max(0, height);
    this.group.setAttribute(
      "transform",
      `scale(${1512 / Math.max(1, width)} ${290 / Math.max(1, height)})`,
    );
    const count = width < 420 ? 10 : width < 800 ? 18 : 36;
    this.flakes.forEach((flake, i) => {
      flake.style.display = i < count ? "" : "none";
    });
    this.draw();
  }

  advance(elapsedMs: number): void {
    this.seconds += elapsedMs / 1_000;
    this.draw();
  }

  private draw(): void {
    if (this.width < 1 || this.height < 1) return;
    for (let i = 0; i < this.flakes.length; i += 1) {
      const flake = this.flakes[i];
      if (flake.style.display === "none") continue;
      const x = (((i * 137 + 23) % 1512) / 1512) * this.width;
      const y = (((i * 53 + 19) % 264) / 290) * this.height;
      const drift = this.seconds * (1.1 + (i % 3) * 0.35) + Math.sin(this.seconds * 0.45 + i) * 4;
      flake.setAttribute("cx", String((x + drift + this.width) % this.width));
      flake.setAttribute(
        "cy",
        String(((y + this.seconds * (9 + (i % 7) * 1.3)) % (this.height + 6)) - 3),
      );
    }
    if (this.aurora) {
      this.aurora.style.opacity = String(0.78 + Math.cos((this.seconds * Math.PI) / 12) * 0.22);
      this.aurora.setAttribute(
        "transform",
        `translate(0 ${Math.sin((this.seconds * Math.PI) / 12) * -6})`,
      );
    }
    if (this.chimney) {
      const phase = (1 - Math.cos((this.seconds * Math.PI) / 6)) / 2;
      this.chimney.setAttribute("transform", `translate(${phase * 4} ${phase * -6})`);
      this.chimney.style.opacity = String(1 - phase * 0.85);
    }
  }
}
