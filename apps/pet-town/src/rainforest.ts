import "./rainforest.css";
import { createRainforestArt } from "./rainforest-art";
import type { PreferencesFile } from "./preferences-types";
import {
  advanceInsects,
  boundsFor,
  createInsects,
  type InsectBounds,
  type RainforestMode,
} from "./rainforest-motion";

let nextSceneId = 0;

function scopedArtwork(art: string, sceneId: number): string {
  const prefix = `rainforest-${sceneId}`;
  let result = art;
  for (const name of ["soil", "stream", "fall", "mist"]) {
    result = result
      .split(`id="${name}"`)
      .join(`id="${prefix}-${name}"`)
      .split(`url(#${name})`)
      .join(`url(#${prefix}-${name})`);
  }
  return result;
}

/** Rainforest presentation only; the village owns pets, labels and the animation clock. */
export class RendererRainforest {
  private readonly scene: HTMLDivElement;
  private readonly sceneId = nextSceneId++;
  private mode: RainforestMode = "after-rain";
  private insects: ReturnType<typeof createInsects> = [];
  private bounds: InsectBounds = boundsFor(this.mode, 0, 0, 0);
  private width = -1;
  private height = -1;
  private active = false;
  private reduced = false;
  private paused = false;

  constructor(private readonly root: HTMLElement) {
    this.scene = root.ownerDocument.createElement("div");
    this.scene.className = "rainforest-scene is-frozen";
    this.scene.hidden = true;
    this.scene.setAttribute("aria-hidden", "true");
    this.renderMode(this.mode);
    root.prepend(this.scene);
  }

  setPreferences(preferences: PreferencesFile): void {
    const app = preferences?.app;
    const mode: RainforestMode = app?.rainforestMode === "firefly" ? "firefly" : "after-rain";
    if (mode !== this.mode) this.renderMode(mode);
    const opacity = app?.rainforestOpacityPercent ?? 36;
    this.scene.style.opacity = String(
      (Number.isFinite(opacity) ? Math.max(0, Math.min(100, opacity)) : 36) / 100,
    );
    this.active = app?.stripTheme === "rainforest";
    this.scene.hidden = !this.active;
    this.refreshBounds(true);
    this.updateFreezeState();
  }

  advance(elapsedMs: number, reduced: boolean, paused: boolean): void {
    this.reduced = reduced;
    this.paused = paused;
    this.refreshBounds(false);
    this.updateFreezeState();
    if (this.isFrozen() || elapsedMs <= 0) return;
    advanceInsects(this.insects, elapsedMs, this.bounds, true);
  }

  private renderMode(mode: RainforestMode): void {
    this.mode = mode;
    this.scene.dataset.mode = mode;
    this.scene.innerHTML = scopedArtwork(createRainforestArt(mode), this.sceneId);
    const svg = this.scene.querySelector<SVGSVGElement>("svg");
    this.insects = svg ? createInsects(svg, mode) : [];
    this.bounds = boundsFor(
      mode,
      Math.max(0, this.width),
      Math.max(0, this.height),
      this.insects.length,
    );
    advanceInsects(this.insects, 0, this.bounds, false);
  }

  private refreshBounds(force: boolean): void {
    const width = Math.max(0, this.root.clientWidth);
    const height = Math.max(0, this.root.clientHeight);
    if (!force && width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.bounds = boundsFor(this.mode, width, height, this.insects.length);
    advanceInsects(this.insects, 0, this.bounds, false);
  }

  private isFrozen(): boolean {
    return this.reduced || this.paused || !this.active || this.width < 1 || this.height < 1;
  }

  private updateFreezeState(): void {
    this.scene.classList.toggle("is-frozen", this.isFrozen());
  }
}
