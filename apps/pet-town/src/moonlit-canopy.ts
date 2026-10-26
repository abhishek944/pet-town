import acceptedArt from "./moonlit-assets/canopy.svg?raw";
import {
  canopyPerch,
  climbingFrame,
  climbingGrip,
  climbingFoot,
  climbingRestFrame,
  hasClimbingArt,
} from "./moonlit-pet";
import { freezePetFrame, unfreezePetFrame } from "./pet-freeze";
import { preferencesFor } from "./renderer-preferences";
import type { PositionedMotion } from "./renderer-layout";
import type { PreferencesFile } from "./preferences-types";
import "./moonlit-canopy.css";

/** Fixed CSS-pixel amplitude at every display height. */
export function canopyOffset(y: number): number {
  return 8 * Math.sin(y / 93) + 1.76 * Math.sin(y / 39);
}

export function canopyLayout(height: number): { top: number; height: number; span: number } {
  // Scenery fills the native work area; endpoint clearance belongs to the pets,
  // not the decorative vine. Interview-card margins must not become screen gaps.
  const sceneHeight = Math.max(0, height);
  return { top: 0, height: sceneHeight, span: Math.max(0, sceneHeight - 137) };
}

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
    const resting = [...elements]
      .flatMap(([id, element]) => {
        const motion = motions.get(id);
        return motion && !motion.dragging && !element.hidden && !this.climbing(element)
          ? [{ element, motion }]
          : [];
      })
      .sort(
        (a, b) =>
          a.motion.x - b.motion.x ||
          (a.element.dataset.agentId ?? "").localeCompare(b.element.dataset.agentId ?? ""),
      );
    if (resting.length < 2) return;
    const span = this.span();
    const largest = Math.max(
      ...resting.map(({ element }) =>
        Math.max(
          Number.parseFloat(element.style.getPropertyValue("--canopy-size")) || 64,
          element.querySelector<HTMLElement>(".project")?.offsetHeight ?? 0,
        ),
      ),
    );
    const gap = Math.min(largest + 6, span / (resting.length - 1));
    for (let i = 1; i < resting.length; i++) {
      resting[i].motion.x = Math.max(resting[i].motion.x, resting[i - 1].motion.x + gap);
    }
    for (let i = resting.length - 1; i >= 0; i--) {
      resting[i].motion.x = Math.min(resting[i].motion.x, span - (resting.length - 1 - i) * gap);
    }
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
    const layout = canopyLayout(this.root.clientHeight);
    const climbing = this.climbing(element);
    const supported = this.supported(element);
    const frame = this.frame(element);
    const baseSize = Number.parseFloat(element.style.getPropertyValue("--citizen-size")) || 44;
    const labelWidth = element.querySelector<HTMLElement>(".project")?.offsetWidth ?? 70;
    const size = Math.min(
      baseSize * (supported ? 84 / 44 : 64 / 44),
      Math.max(8, (this.root.clientWidth - 72 - labelWidth) / 0.86),
    );
    const y = layout.top + 45 + layout.span - motion.x;
    const characterId = element.dataset.characterId ?? "";
    const grip = climbingGrip(characterId, frame);
    const contactY = y + (92 - size) / 2 + size * grip[1];
    const vineX = this.root.clientWidth - 54 + canopyOffset(contactY - layout.top);
    const x = climbing ? vineX - size * grip[0] : vineX - 134;
    element.dataset.canopyPose = supported ? "climb" : "perch";
    element.dataset.canopyBundled = String(Boolean(this.assetFor(element)));
    element.style.setProperty("--canopy-size", `${size}px`);
    const fade = climbing ? Math.min(1, motion.x / 26, (layout.span - motion.x) / 26) : 1;
    element.style.setProperty("--canopy-fade", String(Math.max(0, fade)));
    const actorX = Math.max(8 + labelWidth, x);
    element.style.transform = `translate(${actorX.toFixed(2)}px, ${y.toFixed(2)}px)`;
    element.classList.toggle("direction-right", true);
    element.classList.toggle("direction-left", false);
    const label = element.querySelector<HTMLElement>(".project");
    if (label) {
      const status = element.dataset.status ?? "unknown";
      label.dataset.canopyStatus = status.charAt(0).toUpperCase() + status.slice(1);
    }
    const pet = element.querySelector<HTMLImageElement>("img.pet");
    // Theme owns its genuine pose scale/facing; extensions keep their own clip art.
    if (pet && this.assetFor(element)) pet.style.setProperty("--clip-scale", "1");
    let nook = element.querySelector<SVGElement>(".canopy-nook");
    if (!climbing && !nook) {
      nook = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      nook.classList.add("canopy-nook");
      nook.setAttribute("viewBox", "0 0 94 26");
      nook.setAttribute("aria-hidden", "true");
      nook.innerHTML =
        '<path d="M0 8Q40 -5 94 10Q52 32 0 8Z" fill="#6d8d60"/><path d="M6 10L88 11" stroke="#a4b48c" stroke-width="2"/>';
      element.prepend(nook);
    }
    if (nook) {
      nook.style.display = climbing ? "none" : "";
      nook.style.top = `${supported ? 41 + size * (climbingFoot(characterId) - 0.5) : 33 + size / 2}px`;
      const nookScale = Math.min(1, size / 64);
      nook.style.width = `${152 * nookScale}px`;
      nook.style.height = `${26 * nookScale}px`;
      nook.style.left = `${nookScale === 1 ? this.root.clientWidth - 210 - actorX : -20 * nookScale}px`;
    }
    const frozen =
      this.paused ||
      this.reduced ||
      document.hidden ||
      (preferencesFor(element, this.preferences).motion.pauseOnHover &&
        element.querySelector(".pet:hover") !== null);
    // Bundled Canopy PNGs already hold their exact shared-clock pose. Avoid a
    // canvas copy: browser image downsampling preserves the accepted soft edges.
    if (frozen && !this.assetFor(element)) freezePetFrame(element);
    else unfreezePetFrame(element);
  }
}
