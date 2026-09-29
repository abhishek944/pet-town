import type { PreferencesFile, SnowMode } from "./preferences-types";
import type { PositionedMotion } from "./renderer-layout";
import { createSnowArt } from "./snow-art";
import { SnowFootprints } from "./snow-footprints";
import { SnowMotion } from "./snow-motion";
import "./snow.css";

let nextSceneId = 0;

export class RendererSnowy {
  private readonly scene: HTMLDivElement;
  private readonly sceneId = nextSceneId++;
  private mode: SnowMode = "fresh-snow";
  private particles!: SnowMotion;
  private footprints!: SnowFootprints;
  private width = -1;
  private height = -1;
  private active = false;
  private frozen = true;

  constructor(private readonly root: HTMLElement) {
    this.scene = root.ownerDocument.createElement("div");
    this.scene.className = "snow-scene";
    this.scene.hidden = true;
    this.scene.setAttribute("aria-hidden", "true");
    this.renderMode(this.mode);
    root.prepend(this.scene);
  }

  setPreferences(preferences: PreferencesFile): void {
    const app = preferences.app;
    const mode = app.snowMode === "aurora-night" ? "aurora-night" : "fresh-snow";
    if (mode !== this.mode) this.renderMode(mode);
    const opacity = app.snowOpacityPercent ?? 36;
    this.scene.style.opacity = String(
      (Number.isFinite(opacity) ? Math.max(0, Math.min(100, opacity)) : 36) / 100,
    );
    const active = app.stripTheme === "snowy";
    if (active !== this.active) this.footprints.setBounds(this.width, this.height);
    this.active = active;
    this.scene.hidden = !active;
    this.footprints.resetTracking();
    this.refreshBounds();
  }

  advance(elapsedMs: number, reduced: boolean, paused: boolean): void {
    this.refreshBounds();
    const frozen = reduced || paused || !this.active || this.width < 1 || this.height < 1;
    if (frozen !== this.frozen) this.footprints.resetTracking();
    this.frozen = frozen;
    if (frozen || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
    this.particles.advance(elapsedMs);
    this.footprints.age(elapsedMs);
  }

  // Undefined is a presentation refresh; false is a real stationary animation tick.
  observeWalk(element: HTMLElement, motion: PositionedMotion, walking?: boolean): void {
    if (!this.active) return;
    const pet = element.querySelector<HTMLImageElement>("img.pet");
    const eligible =
      !this.frozen &&
      !motion.dragging &&
      !element.hidden &&
      !element.classList.contains("retiring") &&
      !!pet &&
      !pet.hidden &&
      pet.complete &&
      pet.naturalWidth > 0 &&
      pet.classList.contains("flow-moving") &&
      !["idle", "unknown", "blocked", "done"].includes(element.dataset.status ?? "");
    const size = Number.parseFloat(element.style.getPropertyValue("--citizen-size")) || 44;
    const clipScale = Number.parseFloat(pet?.style.getPropertyValue("--clip-scale") ?? "") || 1;
    const scale = (size * clipScale) / 52;
    if (eligible && walking === undefined) {
      this.footprints.synchronize(element, motion.x);
      return;
    }
    this.footprints.sample(
      element,
      motion.x,
      motion.direction,
      scale,
      eligible && walking === true,
      () => {
        const image = pet!.getBoundingClientRect();
        const root = this.root.getBoundingClientRect();
        return {
          x: image.left + image.width / 2 - root.left,
          y:
            image.bottom -
            root.top -
            pet!.offsetHeight * Number(pet!.dataset.visibleBottomRatio ?? 0),
        };
      },
    );
  }

  private renderMode(mode: SnowMode): void {
    this.mode = mode;
    this.scene.dataset.mode = mode;
    this.scene.innerHTML = createSnowArt(mode);
    const svg = this.scene.querySelector<SVGSVGElement>("svg")!;
    // Capture groups before scoping all IDs, including gradients used by Settings previews.
    const flakes = svg.querySelector<SVGGElement>("#snowflakes")!;
    const prints = svg.querySelector<SVGGElement>("#footprints")!;
    for (const node of svg.querySelectorAll<SVGElement>("[id]")) {
      const oldId = node.id;
      const id = `snow-${this.sceneId}-${oldId}`;
      for (const reference of svg.querySelectorAll<SVGElement>("*")) {
        for (const attribute of [...reference.attributes]) {
          if (attribute.value.includes(`url(#${oldId})`)) {
            reference.setAttribute(
              attribute.name,
              attribute.value.split(`url(#${oldId})`).join(`url(#${id})`),
            );
          }
        }
      }
      node.id = id;
    }
    this.particles = new SnowMotion(flakes, svg);
    this.footprints = new SnowFootprints(prints, mode);
    this.width = -1;
    this.height = -1;
  }

  private refreshBounds(): void {
    const width = Math.max(0, this.root.clientWidth);
    const height = Math.max(0, this.root.clientHeight);
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.particles.setBounds(width, height);
    this.footprints.setBounds(width, height);
    // Keep edge artwork proportional as the terrain stretches across the strip.
    const scaleX = (1512 / Math.max(1, width)) * (height / 290);
    for (const group of this.scene.querySelectorAll<SVGGElement>("[data-snow-edge]")) {
      group.setAttribute(
        "transform",
        group.dataset.snowEdge === "right"
          ? `translate(1512 0) scale(${scaleX} 1) translate(-1512 0)`
          : `scale(${scaleX} 1)`,
      );
    }
  }
}
