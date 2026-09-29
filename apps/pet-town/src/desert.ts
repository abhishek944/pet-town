import type { DesertMode, DesertScene, PreferencesFile } from "./preferences-types";
import { createDesertArt } from "./desert-art";
import { DesertMotion } from "./desert-motion";
import "./desert.css";

let nextId = 0;

export class RendererDesert {
  private readonly scene: HTMLDivElement;
  private readonly id = nextId++;
  private variant: DesertScene = "palm-spring";
  private mode: DesertMode = "golden-dunes";
  private motion!: DesertMotion;
  private active = false;
  private width = -1;
  private height = -1;

  constructor(private readonly root: HTMLElement) {
    this.scene = root.ownerDocument.createElement("div");
    this.scene.className = "desert-scene";
    this.scene.hidden = true;
    this.scene.setAttribute("aria-hidden", "true");
    this.renderArt();
    root.prepend(this.scene);
  }

  setPreferences(preferences: PreferencesFile): void {
    const app = preferences.app;
    const variant =
      app.desertScene === "adobe-outpost" || app.desertScene === "lantern-caravan"
        ? app.desertScene
        : "palm-spring";
    const mode = app.desertMode === "moonlit-oasis" ? "moonlit-oasis" : "golden-dunes";
    if (variant !== this.variant || mode !== this.mode) {
      this.variant = variant;
      this.mode = mode;
      this.renderArt();
    }
    const opacity = app.desertOpacityPercent ?? 36;
    this.scene.style.opacity = String(
      (Number.isFinite(opacity) ? Math.max(0, Math.min(100, opacity)) : 36) / 100,
    );
    this.active = app.stripTheme === "desert";
    this.scene.hidden = !this.active;
    this.refreshBounds();
  }

  advance(elapsedMs: number, reduced: boolean, paused: boolean): void {
    if (!this.active) return;
    this.refreshBounds();
    if (reduced || paused || document.hidden || this.width <= 0 || this.height <= 0) return;
    this.motion.advance(elapsedMs);
  }

  private renderArt(): void {
    this.scene.dataset.scene = this.variant;
    this.scene.dataset.mode = this.mode;
    this.scene.innerHTML = createDesertArt(this.variant, this.mode);
    const svg = this.scene.querySelector<SVGSVGElement>("svg")!;
    for (const node of svg.querySelectorAll<SVGElement>("[id]")) {
      const previous = node.id;
      const scoped = `desert-${this.id}-${previous}`;
      for (const element of svg.querySelectorAll<SVGElement>("*")) {
        for (const attribute of [...element.attributes]) {
          if (attribute.value.includes(`url(#${previous})`)) {
            element.setAttribute(
              attribute.name,
              attribute.value.split(`url(#${previous})`).join(`url(#${scoped})`),
            );
          }
        }
      }
      node.id = scoped;
    }
    this.motion = new DesertMotion(svg, this.mode);
    this.width = -1;
    this.height = -1;
  }

  private refreshBounds(): void {
    const width = this.root.clientWidth;
    const height = this.root.clientHeight;
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    // Uniformly compact edge objects below a 600px-equivalent strip to avoid overlap.
    const verticalScale = height / 290;
    const compact = Math.min(1, width / Math.max(1, 600 * verticalScale));
    const scaleX = (1512 / Math.max(1, width)) * verticalScale * compact;
    for (const group of this.scene.querySelectorAll<SVGGElement>("[data-desert-edge]")) {
      const anchor = group.dataset.desertEdge === "right" ? 1512 : 0;
      const baseline = group.hasAttribute("data-desert-sky") ? 57 : 279;
      group.setAttribute(
        "transform",
        `translate(${anchor} ${baseline}) scale(${scaleX} ${compact}) translate(${-anchor} ${-baseline})`,
      );
    }
    this.motion.setBounds(width, height);
  }
}
