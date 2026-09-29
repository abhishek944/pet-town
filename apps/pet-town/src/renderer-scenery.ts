import { RendererOcean } from "./renderer-ocean";
import { RendererRainforest } from "./rainforest";
import { RendererSnowy } from "./snow";
import type { PreferencesFile } from "./preferences-types";
import type { HerdrState } from "./flow-types";
import type { PositionedMotion } from "./renderer-layout";
import "./renderer-forest.css";

type Elements = ReadonlyMap<string, HTMLElement>;
type Motions = ReadonlyMap<string, PositionedMotion>;

/** Presentation facade: all scenery shares the village clock, never agent state. */
export class RendererScenery {
  private readonly ocean: RendererOcean;
  private readonly forest: RendererRainforest;
  private readonly snow: RendererSnowy;
  private reduced = false;
  private paused = false;

  constructor(root: HTMLElement) {
    this.ocean = new RendererOcean(root);
    this.forest = new RendererRainforest(root);
    this.snow = new RendererSnowy(root);
  }

  setPreferences(preferences: PreferencesFile): void {
    this.ocean.setPreferences(preferences);
    this.forest.setPreferences(preferences);
    this.forest.advance(0, this.reduced, this.paused);
    this.snow.setPreferences(preferences);
    this.snow.advance(0, this.reduced, this.paused);
  }

  advance(elapsedMs: number, reduced: boolean): boolean {
    this.reduced = reduced;
    this.forest.advance(elapsedMs, reduced, this.paused || document.hidden);
    this.snow.advance(elapsedMs, reduced, this.paused || document.hidden);
    return this.ocean.advance(elapsedMs, reduced);
  }

  setReduced(reduced: boolean, elements: Elements, motions: Motions): void {
    this.reduced = reduced;
    this.forest.advance(0, reduced, this.paused);
    this.snow.advance(0, reduced, this.paused);
    this.ocean.setReduced(reduced, elements, motions);
  }

  setPaused(paused: boolean, elements: Elements, motions: Motions): void {
    this.paused = paused;
    this.forest.advance(0, this.reduced, paused);
    this.snow.advance(0, this.reduced, paused);
    this.ocean.setPaused(paused, elements, motions);
  }

  assetFor(element: HTMLElement, state?: HerdrState): string | null {
    return this.ocean.assetFor(element, state);
  }

  sampler(): ((x: number) => number) | null {
    return this.ocean.sampler();
  }

  position(
    element: HTMLElement,
    motion: PositionedMotion,
    sampler: ((x: number) => number) | null,
    walking?: boolean,
  ): void {
    this.ocean.position(element, motion, sampler);
    this.snow.observeWalk(element, motion, walking);
  }

  updateWakes(elements: Elements, motions: Motions, fallbackSize: number): void {
    this.ocean.updateWakes(elements, motions, fallbackSize);
  }
}
