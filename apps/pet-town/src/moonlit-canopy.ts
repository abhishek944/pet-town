import acceptedArt from "./moonlit-assets/canopy.svg?raw";
import { canopyPerch, climbingFrame, climbingRestFrame, hasClimbingArt } from "./moonlit-pet";
import { unfreezePetFrame } from "./pet-freeze";
import { canopyLayout, canopyOffset, settleCanopyNooks } from "./moonlit-layout";
import { positionCanopyPet } from "./moonlit-pose";
export { canopyLayout, canopyOffset } from "./moonlit-layout";
import { preferencesFor } from "./renderer-preferences";
import type { PositionedMotion } from "./renderer-layout";
import type { PreferencesFile } from "./preferences-types";
import "./moonlit-canopy.css";

interface PoseClock {
  elapsed: number;
}
let canopyInstance = 0;

/** Canopy presentation only. VillageRenderer owns agents, travel and the only rAF. */
export class RendererMoonlit {
  private readonly scene = document.createElement("div");
  private readonly clocks = new WeakMap<HTMLElement, PoseClock>();
  private preferences: PreferencesFile | null = null;
  private reduced = false;
  private paused = false;
  private time = 0;
  private sceneHeight = 0;
  active = false;

  constructor(private readonly root: HTMLElement) {
    this.scene.className = "moonlit-scene";
    this.scene.setAttribute("aria-hidden", "true");
    const prefix = `canopy-${++canopyInstance}-`;
    this.scene.innerHTML = acceptedArt
      .replace(/id="(bark|glow|vine)"/g, `id="${prefix}$1"`)
      .replace(/url\(#(bark|glow|vine)\)/g, `url(#${prefix}$1)`);
    root.prepend(this.scene);
    this.scene.hidden = true;
  }

  setPreferences(preferences: PreferencesFile): void {
    this.preferences = preferences;
    this.active = preferences.app.stripTheme === "canopy";
    this.root.style.setProperty(
      "--canopy-opacity",
      String((preferences.app.canopyOpacityPercent ?? 100) / 100),
    );
    this.scene.hidden = !this.active;
    this.layout();
  }

  private layout(): void {
    if (!this.active) return;
    const layout = canopyLayout(this.root.clientHeight);
    this.scene.style.top = `${layout.top}px`;
    this.scene.style.height = `${layout.height}px`;
    if (layout.height === this.sceneHeight) return;
    this.sceneHeight = layout.height;
    const path = Array.from({ length: 121 }, (_, i) => {
      const y = 8 + (i / 120) * (layout.height - 13);
      return `${i ? "L" : "M"}${(136 + canopyOffset(y)).toFixed(2)} ${((y * 565) / layout.height).toFixed(2)}`;
    }).join(" ");
    this.scene
      .querySelectorAll(
        'svg > path[stroke-width="13"], svg > path[stroke-width="8"], svg > path[stroke-width="1.2"]',
      )
      .forEach((node) => node.setAttribute("d", path));
    this.scene.querySelector("svg")?.setAttribute("preserveAspectRatio", "none");
  }

  span(): number {
    return canopyLayout(this.root.clientHeight).span;
  }

  advance(elapsedMs: number, reduced: boolean, paused: boolean): void {
    this.reduced = reduced;
    this.paused = paused;
    if (!this.active) return;
    this.layout();
    if (paused || reduced || !elapsedMs) return;
    this.time += elapsedMs;
    // Only the eight accepted firefly glows move; no independent CSS clock.
    this.scene.querySelectorAll("svg > circle").forEach((node, i) => {
      const phase = this.time / 3000 + Math.floor(i / 2) * 1.7;
      node.setAttribute(
        "transform",
        `translate(${Math.sin(phase) * 2} ${Math.cos(phase * 0.8) * 1.5})`,
      );
    });
  }

  advancePet(element: HTMLElement, elapsedMs: number): void {
    if (
      !this.active ||
      !this.climbing(element) ||
      this.paused ||
      this.reduced ||
      document.hidden ||
      element.hidden
    )
      return;
    if (
      preferencesFor(element, this.preferences).motion.pauseOnHover &&
      element.querySelector(".pet:hover")
    )
      return;
    const clock = this.clocks.get(element) ?? { elapsed: 0 };
    clock.elapsed += elapsedMs;
    this.clocks.set(element, clock);
  }

  private supported(element: HTMLElement): boolean {
    return (
      element.dataset.agentSource !== "orchestrator" &&
      hasClimbingArt(element.dataset.characterId ?? "")
    );
  }

  private climbing(element: HTMLElement): boolean {
    return this.supported(element) && element.dataset.status === "working";
  }

  private frame(element: HTMLElement): number {
    return this.climbing(element)
      ? Math.floor((this.clocks.get(element)?.elapsed ?? 0) / 150) % 6
      : climbingRestFrame(element.dataset.characterId ?? "");
  }

  assetFor(element: HTMLElement): string | null {
    if (!this.active || element.dataset.agentSource === "orchestrator") return null;
    return this.supported(element)
      ? climbingFrame(this.frame(element), element.dataset.characterId)
      : canopyPerch(element.dataset.characterId ?? "");
  }

  travelDistance(distance: number, element: HTMLElement): number {
    return this.climbing(element) && !element.hidden ? distance : 0;
  }

  move(motion: PositionedMotion, distance: number): void {
    const span = this.span();
    if (!span || !distance) return;
    const y = 45 + span - motion.x;
    const slope = (canopyOffset(y + 1) - canopyOffset(y - 1)) / 2;
    // Integrate the mild route's arc length rather than accelerating on bends.
    motion.x = (motion.x + distance / Math.hypot(1, slope)) % span;
    motion.direction = 1;
  }

  /** Pack nearby resting nooks without resetting any ascending agent's progress. */
  settleNooks(
    elements: ReadonlyMap<string, HTMLElement>,
    motions: ReadonlyMap<string, PositionedMotion>,
  ): void {
    if (!this.active) return;
    settleCanopyNooks(elements, motions, this.span(), (element) => this.climbing(element));
  }

  position(element: HTMLElement, motion: PositionedMotion): void {
    if (!this.active) {
      if (element.dataset.canopyPose) {
        delete element.dataset.canopyPose;
        delete element.dataset.canopyBundled;
        element.style.removeProperty("--canopy-size");
        element.style.removeProperty("--canopy-fade");
        element.querySelector(".canopy-nook")?.remove();
        unfreezePetFrame(element);
      }
      return;
    }
    positionCanopyPet(this.root, element, motion, {
      climbing: this.climbing(element),
      supported: this.supported(element),
      frame: this.frame(element),
      assetUrl: this.assetFor(element),
      paused: this.paused,
      reduced: this.reduced,
      preferences: this.preferences,
    });
  }
}
