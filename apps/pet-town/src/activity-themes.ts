import { createCoasterProps } from "./activity-coaster-art";
import { createActivitySceneSvg, scopeSvg } from "./activity-scene-art";
import { isActivityTheme, type CoasterMode, type PreferencesFile } from "./preferences-types";
import { applyMotionPosition, type PositionedMotion } from "./renderer-layout";
import { applyActivityPlacement, activityAssetFor, clearActivityPlacement } from "./activity-pet";
import { freezeActivityFrame, freezePetFrame, unfreezePetFrame } from "./pet-freeze";
import { CITIZEN_TRACK_WIDTH, refreshCitizenLabelPosition } from "./renderer-view";
import "./activity-themes.css";

let nextId = 0;
function bounded(value: number | undefined, fallback: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value!))) : fallback;
}

/** Activity presentation shares the village clock and never changes flow visibility or agent state. */
export class RendererActivities {
  private readonly scene: HTMLDivElement;
  private readonly id = nextId++;
  private theme = "";
  private mode: CoasterMode = "low-rolling";
  private preferences: PreferencesFile | null = null;
  private reduced = false;
  private paused = false;
  private rail: { x: number; y: number }[] = [];
  private propsId = 0;
  // Four coaster variants: reuse stock roots, never actor props.
  private readonly sceneArt = new Map<string, SVGSVGElement>();
  constructor(private readonly root: HTMLElement) {
    this.scene = root.ownerDocument.createElement("div");
    this.scene.className = "activity-scene";
    this.scene.hidden = true;
    this.scene.setAttribute("aria-hidden", "true");
    root.prepend(this.scene);
  }

  setPreferences(preferences: PreferencesFile): void {
    this.preferences = preferences;
    const theme = isActivityTheme(preferences.app.stripTheme) ? preferences.app.stripTheme : "";
    const mode = preferences.app.coasterMode ?? "low-rolling";
    if (theme !== this.theme || mode !== this.mode) {
      this.theme = theme;
      this.mode = mode;
      const key = theme === "rollercoaster" ? `${theme}:${mode}` : theme;
      let svg = this.sceneArt.get(key);
      if (theme && !svg) {
        svg = createActivitySceneSvg(this.root.ownerDocument, theme, mode, `activity-${this.id}`);
        if (this.sceneArt.size < 4) this.sceneArt.set(key, svg);
      }
      if (this.scene.firstElementChild !== svg) this.scene.replaceChildren(...(svg ? [svg] : []));
      this.readRail();
    }
    this.scene.hidden = !theme;
    this.root.dataset.coasterMode = mode;
    const height = bounded(preferences.app.coasterHeightPx, 88, 50, 146);
    this.scene.style.setProperty(
      "--coaster-height-scale",
      String(theme === "rollercoaster" ? height / 88 : 1),
    );
  }

  advance(_elapsedMs: number, reduced: boolean, paused: boolean): void {
    this.reduced = reduced;
    this.paused = paused;
  }

  get active(): boolean {
    return Boolean(this.theme);
  }

  assetFor(element: HTMLElement): string | null {
    return activityAssetFor(this.theme, element);
  }

  travelDistance(distance: number, element: HTMLElement): number {
    if (element.dataset.agentSource === "orchestrator") return distance;
    if (
      this.theme === "rollercoaster" &&
      ["blocked", "done"].includes(element.dataset.status ?? "")
    )
      return 0;
    return distance;
  }

  position(element: HTMLElement, motion: PositionedMotion): void {
    if (!this.theme || element.dataset.agentSource === "orchestrator") {
      element.querySelector(".activity-props")?.remove();
      clearActivityPlacement(element); // Clear a left activity theme's sprite translation.
      delete element.dataset.activityTheme;
      return;
    }
    const themeChanged = element.dataset.activityTheme !== this.theme;
    element.dataset.activityTheme = this.theme;
    const scale = (Number.parseFloat(element.style.getPropertyValue("--citizen-size")) || 44) / 44;
    const sizeChanged = element.style.getPropertyValue("--activity-scale") !== String(scale);
    element.style.setProperty("--activity-scale", String(scale));
    const state = element.dataset.status ?? "unknown";
    const dedicated = applyActivityPlacement(this.theme, element, state);
    const key = `${this.theme}:${this.mode}:${state}:${dedicated}`;
    let props = element.querySelector<HTMLElement>(".activity-props");
    if (props?.dataset.key !== key) {
      props?.remove();
      props = this.root.ownerDocument.createElement("span");
      props.className = "activity-props";
      props.dataset.key = key;
      props.setAttribute("aria-hidden", "true");
      const art = createCoasterProps(state, this.mode);
      props.innerHTML = scopeSvg(art, `activity-${this.id}-pet-${this.propsId++}`);
      element.append(props);
    }
    const hovered = element.querySelector(".pet:hover") !== null;
    const pauseOnHover = Boolean(
      this.preferences?.pets[element.dataset.characterId ?? ""]?.motion.pauseOnHover,
    );
    const frozen = this.reduced || this.paused || document.hidden || (hovered && pauseOnHover);
    if (freezeActivityFrame(frozen, state, dedicated)) freezePetFrame(element);
    else unfreezePetFrame(element);
    if (this.theme === "rollercoaster" && (themeChanged || sizeChanged))
      refreshCitizenLabelPosition(element);
    const centerX = motion.x + CITIZEN_TRACK_WIDTH / 2;
    const railY = this.railHeight(centerX);
    const offset =
      railY - (this.root.clientHeight - 14) + (this.mode === "cloudline" ? 50 * scale : 0);
    // Existing citizen bottom is 4px; only labels consume this viewport-space anchor.
    element.style.setProperty(
      "--coaster-citizen-bottom-y",
      `${this.root.clientHeight - 4 + offset}px`,
    );
    applyMotionPosition(element, motion, offset, 0);
  }

  private readRail(): void {
    this.rail = [];
    const path = this.scene.querySelector<SVGPathElement>("[data-activity-rail]");
    if (!path) return;
    const length = path.getTotalLength();
    // Bounded lookup rebuilt only on art changes; avoid per-pet DOM path queries each frame.
    for (let i = 0; i <= 128; i++) {
      const point = path.getPointAtLength((length * i) / 128);
      this.rail.push({ x: point.x, y: point.y });
    }
  }

  private railHeight(x: number): number {
    const normalized = (x / Math.max(1, this.root.clientWidth)) * 1280;
    const right = this.rail.findIndex((point) => point.x >= normalized);
    const a = this.rail[Math.max(0, right - 1)] ?? { x: 0, y: 240 };
    const b = this.rail[right < 0 ? this.rail.length - 1 : right] ?? a;
    const t = Math.max(0, Math.min(1, (normalized - a.x) / Math.max(1, b.x - a.x)));
    const height = this.root.clientHeight;
    const y = (a.y + (b.y - a.y) * t) * (height / 290);
    // Same bottom-anchored affine map as the scenery SVG; actors/props never stretch.
    const scale = bounded(this.preferences?.app.coasterHeightPx, 88, 50, 146) / 88;
    return height + (y - height) * scale;
  }
}
