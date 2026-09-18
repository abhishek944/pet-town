import { advanceTrack, BehaviorMachine, remapTrackPosition, type CompiledBehaviorPack } from "./flow-runtime";
import { behaviorPackForCharacter } from "./character-packs";
import { citizenSize, type CitizenState } from "./village";
import { freezePetFrame, unfreezePetFrame } from "./pet-freeze";
import type { PreferencesFile } from "./preferences-types";
import { applyMotionPosition, collectHitRegions } from "./renderer-layout";
import { resolveLabelOverlaps } from "./renderer-labels";
import { applyCitizenPreferences, shouldHideCompleted, shouldHideCompletedElement, travelDistanceFor } from "./renderer-preferences";
import { applyFlowSample, CITIZEN_TRACK_WIDTH, createCitizenElement, distanceWhileAssetPending, type HitRegion, motionSeed, refreshCitizenLabelPosition, SUSPENSION_GAP_MS, updateCitizenElement } from "./renderer-view";
import { setPreferenceHidden } from "./renderer-visibility";
export type { HitRegion } from "./renderer-view";
interface MotionState {
  x: number; direction: -1 | 1; maximumX: number;
  behavior: BehaviorMachine; packFingerprint: string; fallbackAssetUrl: string;
  pendingElapsedMs: number; dragging: boolean; dragOffsetX: number;
}
export class VillageRenderer {
  private readonly elements = new Map<string, HTMLElement>();
  private readonly motions = new Map<string, MotionState>();
  private currentCitizenSize = 44; private currentWidth = window.innerWidth;
  private lastTimestamp = 0; private logicalRemainderMs = 0;
  private lastHitRegionUpdate = 0;
  private preferences: PreferencesFile | null = null; private paused = false;
  private systemReducedMotion = false;
  constructor(
    private readonly root: HTMLElement,
    private readonly updateHitRegions: (regions: HitRegion[]) => void = () => {},
    private readonly behaviorPackForCitizen: (citizen: CitizenState) => CompiledBehaviorPack = (citizen) => behaviorPackForCharacter(citizen.sprite),
  ) { window.requestAnimationFrame(this.animate); }
  render(citizens: ReadonlyMap<string, CitizenState>, width: number): void {
    const ordered = [...citizens.values()].sort((left, right) => left.id.localeCompare(right.id));
    this.currentWidth = width;
    const liveIds = new Set(ordered.map((citizen) => citizen.id));
    for (const [id, element] of this.elements) {
      if (!liveIds.has(id)) {
        element.dispatchEvent(new Event("citizen-hidden", { bubbles: true }));
        element.remove();
        this.elements.delete(id);
        this.motions.delete(id);
      }
    }
    const maximumX = Math.max(0, width - CITIZEN_TRACK_WIDTH);
    for (const citizen of ordered) {
      const pack = this.behaviorPackForCitizen(citizen);
      const fallbackAssetUrl = Object.values(pack.clips)
        .find((clip) => clip.assetUrl)?.assetUrl ?? "";
      let element = this.elements.get(citizen.id);
      let motion = this.motions.get(citizen.id);
      if (!element) {
        element = createCitizenElement();
        this.root.append(element);
        this.elements.set(citizen.id, element);
      }
      if (!motion || motion.packFingerprint !== pack.fingerprint) {
        const seed = motionSeed(citizen.id);
        motion = {
          x: motion?.x ?? maximumX * (((seed >>> 16) % 1_000) / 1_000),
          direction: motion?.direction ?? ((seed & 1) === 0 ? 1 : -1),
          maximumX: motion?.maximumX ?? maximumX,
          behavior: new BehaviorMachine(pack, citizen.id, citizen.status),
          packFingerprint: pack.fingerprint,
          fallbackAssetUrl,
          pendingElapsedMs: 0,
          dragging: false,
          dragOffsetX: 0,
        };
        this.motions.set(citizen.id, motion);
      } else {
        motion.fallbackAssetUrl = fallbackAssetUrl;
      }
      updateCitizenElement(element, citizen);
      setPreferenceHidden(element, shouldHideCompleted(citizen, this.preferences), this.refreshGeometry);
      applyCitizenPreferences(element, this.currentCitizenSize, this.preferences);
      refreshCitizenLabelPosition(element);
      if (maximumX !== motion.maximumX) {
        motion.x = remapTrackPosition(motion.x, motion.maximumX, maximumX);
        motion.maximumX = maximumX;
      }
      if (motion.behavior.setStatus(citizen.status)) motion.pendingElapsedMs = 0;
      applyFlowSample(element, motion.behavior.advance(0).sample,
        motion.fallbackAssetUrl, this.refreshGeometry);
      this.applyDirectionAndPosition(element, motion);
    }
    this.refreshGeometry();
  }
  private readonly animate = (timestamp: number): void => {
    const frameGap = this.lastTimestamp === 0 ? 0 : timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    const shouldPause = document.hidden || frameGap > SUSPENSION_GAP_MS;
    const logicalElapsed = shouldPause ? 0 : Math.max(0, frameGap) + this.logicalRemainderMs;
    const elapsedMs = Math.floor(logicalElapsed);
    this.logicalRemainderMs = shouldPause ? 0 : logicalElapsed - elapsedMs;
    if (this.paused) {
      for (const element of this.elements.values()) freezePetFrame(element);
      window.requestAnimationFrame(this.animate);
      return;
    }
    for (const [id, element] of this.elements) {
      const motion = this.motions.get(id);
      if (!motion || element.classList.contains("retiring")) continue;
      const currentSample = motion.behavior.sample();
      if (motion.dragging) {
        applyFlowSample(element, currentSample, motion.fallbackAssetUrl, this.refreshGeometry);
        this.applyDirectionAndPosition(element, motion);
        continue;
      }
      const assetReady = applyFlowSample(element, currentSample, motion.fallbackAssetUrl, this.refreshGeometry);
      const advance = assetReady
        ? motion.behavior.advance(elapsedMs + motion.pendingElapsedMs, true)
        : {
            distancePx: distanceWhileAssetPending(currentSample, elapsedMs),
            remainingMs: motion.pendingElapsedMs,
            sample: currentSample,
          };
      motion.pendingElapsedMs = advance.remainingMs;
      const distance = travelDistanceFor(element, advance.distancePx, this.preferences, this.systemReducedMotion);
      const position = advanceTrack(motion.x, motion.direction, distance, motion.maximumX);
      motion.x = position.x;
      motion.direction = position.direction;
      applyFlowSample(element, advance.sample, motion.fallbackAssetUrl, this.refreshGeometry);
      this.applyDirectionAndPosition(element, motion);
    }
    if (timestamp - this.lastHitRegionUpdate >= 160) {
      this.lastHitRegionUpdate = timestamp;
      this.publishHitRegions();
    }
    window.requestAnimationFrame(this.animate);
  };
  refreshPreferenceVisibility(citizens: ReadonlyMap<string, CitizenState>): void {
    for (const [id, element] of this.elements) { const citizen = citizens.get(id);
      if (citizen) setPreferenceHidden(element, shouldHideCompleted(citizen, this.preferences), this.refreshGeometry); }
  }
  setPreferences(preferences: PreferencesFile): void {
    this.preferences = preferences;
    for (const element of this.elements.values()) {
      setPreferenceHidden(element, shouldHideCompletedElement(element, this.preferences), this.refreshGeometry);
      applyCitizenPreferences(element, this.currentCitizenSize, this.preferences);
      refreshCitizenLabelPosition(element);
    }
    this.refreshGeometry();
  }
  setSystemReducedMotion(reduced: boolean): void { this.systemReducedMotion = reduced; }
  setPaused(paused: boolean): void {
    this.paused = paused;
    this.lastTimestamp = 0;
    for (const element of this.elements.values()) { if (paused) freezePetFrame(element); else unfreezePetFrame(element); }
    this.publishHitRegions();
  }
  actionsFor(id: string): Array<{ id: string; label: string }> {
    const actions = this.motions.get(id)?.behavior.pack.actions ?? {};
    return Object.entries(actions).map(([actionId, action]) => ({ id: actionId, label: action.label })); }
  startAction(id: string, actionId: string): boolean {
    const motion = this.motions.get(id);
    if (this.paused || !motion || motion.dragging) return false;
    const started = motion.behavior.startAction(actionId);
    if (started) motion.pendingElapsedMs = 0; return started; }
  beginDrag(id: string, clientX: number): boolean {
    const motion = this.motions.get(id);
    if (this.paused || !motion) return false;
    motion.dragging = true;
    motion.dragOffsetX = clientX - motion.x;
    this.publishHitRegions();
    return true;
  }
  moveDrag(id: string, clientX: number): void {
    const motion = this.motions.get(id);
    const element = this.elements.get(id);
    if (!motion || !element || !motion.dragging) return;
    motion.x = Math.max(0, Math.min(motion.maximumX, clientX - motion.dragOffsetX));
    this.applyDirectionAndPosition(element, motion);
    this.publishHitRegions();
  }
  endDrag(id: string): void {
    const motion = this.motions.get(id);
    if (!motion) return;
    motion.dragging = false;
    this.publishHitRegions(); }
  refreshHitRegions(): void { this.publishHitRegions(); }
  private applyDirectionAndPosition(element: HTMLElement, motion: MotionState): void { applyMotionPosition(element, motion); }
  private readonly refreshGeometry = (): void => {
    const visibleCount = [...this.elements.values()].filter((element) => !element.hidden).length;
    const size = citizenSize(visibleCount, this.currentWidth, 77);
    if (size !== this.currentCitizenSize) {
      this.currentCitizenSize = size;
      this.root.style.setProperty("--citizen-size", `${size}px`);
      for (const element of this.elements.values()) {
        applyCitizenPreferences(element, size, this.preferences);
        refreshCitizenLabelPosition(element);
      }
    }
    this.publishHitRegions();
  };
  private readonly publishHitRegions = (): void => {
    if (this.paused) { this.updateHitRegions([]); return; }
    const dragging = [...this.motions.values()].some((motion) => motion.dragging);
    resolveLabelOverlaps(this.elements.values()); this.updateHitRegions(
      collectHitRegions(this.root, this.elements.values(), dragging));
  };
}
