import { effectivePetTheme, oceanStateUrl } from "./ocean-assets";
import type { HerdrState } from "./flow-types";
import { normalizeHerdrState } from "./flow-utils";
import {
  advanceOceanWater,
  createOceanWater,
  oceanWaveSampler,
  updateOceanWater,
  updateOceanWakes,
} from "./ocean-water";
import { freezePetFrame, unfreezePetFrame } from "./pet-freeze";
import type { PreferencesFile } from "./preferences-types";
import { applyMotionPosition, type PositionedMotion } from "./renderer-layout";
import { CITIZEN_TRACK_WIDTH } from "./renderer-view";

type Elements = ReadonlyMap<string, HTMLElement>;
type Motions = ReadonlyMap<string, PositionedMotion>;
type Sampler = ((x: number) => number) | null;

/** Ocean presentation only; the village still owns agent state, movement and its single clock. */
export class RendererOcean {
  private readonly water = createOceanWater();
  private preferences: PreferencesFile | null = null;
  private reduced = false;
  private paused = false;

  constructor(private readonly root: HTMLElement) {
    root.prepend(this.water);
  }

  setPreferences(preferences: PreferencesFile): void {
    this.preferences = preferences;
    const app = preferences.app;
    this.root.dataset.stripTheme = app.stripTheme;
    this.root.style.setProperty("--ocean-citizen-bottom", `${app.oceanWaterlineHeightPx - 6}px`);
    updateOceanWater(
      this.water,
      app.stripTheme,
      app.oceanOpacityPercent,
      app.oceanWaterlineHeightPx,
    );
  }

  advance(elapsedMs: number, reduced: boolean): boolean {
    this.reduced = reduced;
    return advanceOceanWater(this.water, elapsedMs, reduced);
  }

  setReduced(reduced: boolean, elements: Elements, motions: Motions): void {
    this.advance(0, reduced);
    this.positionAll(elements, motions);
  }

  setPaused(paused: boolean, elements: Elements, motions: Motions): void {
    this.paused = paused;
    this.water.classList.toggle("is-paused", paused);
    this.positionAll(elements, motions);
  }

  private positionAll(elements: Elements, motions: Motions): void {
    const sampler = this.sampler();
    for (const [id, element] of elements) {
      const motion = motions.get(id);
      if (motion) this.position(element, motion, sampler);
    }
  }

  assetFor(
    element: HTMLElement,
    state: HerdrState = normalizeHerdrState(element.dataset.status ?? ""),
  ): string | null {
    const id = element.dataset.characterId ?? "";
    if (effectivePetTheme(this.preferences, id) !== "ocean") return null;
    // The Mayor's idle, done and unknown flows remain visible and use its walking clip.
    const rowing =
      element.dataset.agentSource === "orchestrator" &&
      (state === "idle" || state === "done" || state === "unknown");
    return oceanStateUrl(id, rowing ? "working" : state);
  }

  sampler(): Sampler {
    return this.preferences?.app.stripTheme === "ocean" ? oceanWaveSampler(this.water) : null;
  }

  position(element: HTMLElement, motion: PositionedMotion, sampler: Sampler): void {
    const x = motion.x + CITIZEN_TRACK_WIDTH / 2;
    const slope = sampler ? (sampler(x + 3) - sampler(x - 3)) / 6 : 0;
    const ocean = Boolean(this.assetFor(element));
    const pitch =
      this.reduced || !ocean ? 0 : Math.max(-11, Math.min(11, (Math.atan(slope) * 180) / Math.PI));
    applyMotionPosition(element, motion, sampler?.(x) ?? 0, pitch);
    if (this.paused || (this.reduced && ocean)) freezePetFrame(element);
    else unfreezePetFrame(element);
  }

  updateWakes(elements: Elements, motions: Motions, fallbackSize: number): void {
    if (this.preferences?.app.stripTheme !== "ocean") return;
    const boats = [...elements].flatMap(([id, element]) => {
      const motion = motions.get(id);
      if (
        !motion ||
        element.hidden ||
        element.classList.contains("retiring") ||
        !this.assetFor(element)
      )
        return [];
      const size =
        Number.parseFloat(element.style.getPropertyValue("--citizen-size")) || fallbackSize;
      return [{ x: motion.x + CITIZEN_TRACK_WIDTH / 2, width: size }];
    });
    updateOceanWakes(this.water, boats);
  }
}
