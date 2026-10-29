import { advanceTrack, type BehaviorMachine } from "./flow-runtime";
import type { RendererScenery } from "./renderer-scenery";
import type { PreferencesFile } from "./preferences-types";
import { travelDistanceFor } from "./renderer-preferences";
import { applyFlowSample, distanceWhileAssetPending } from "./renderer-view";
import { tokenMotionDistance, type TokenMotionState } from "./token-motion";

export interface MotionState {
  x: number;
  direction: -1 | 1;
  maximumX: number;
  behavior: BehaviorMachine;
  packFingerprint: string;
  fallbackAssetUrl: string;
  pendingElapsedMs: number;
  dragging: boolean;
  dragOffsetX: number;
  tokenMotion: TokenMotionState;
}

interface MotionFrame {
  scenery: RendererScenery;
  elapsedMs: number;
  preferences: PreferencesFile | null;
  systemReducedMotion: boolean;
  requestGeometry: () => void;
}

/** Advance assets, behavior and travel in order using the renderer's shared clock. */
export function advanceMotions(
  elements: ReadonlyMap<string, HTMLElement>,
  motions: ReadonlyMap<string, MotionState>,
  frame: MotionFrame,
): void {
  const { scenery, elapsedMs, preferences, systemReducedMotion, requestGeometry } = frame;
  const waveSampler = scenery.sampler();
  for (const [id, element] of elements) {
    const motion = motions.get(id);
    if (!motion || element.classList.contains("retiring")) continue;
    const currentSample = motion.behavior.sample();
    const themedAssetUrl = scenery.assetFor(element, currentSample.state);
    if (motion.dragging) {
      applyFlowSample(
        element,
        currentSample,
        motion.fallbackAssetUrl,
        requestGeometry,
        themedAssetUrl,
      );
      scenery.position(element, motion, waveSampler);
      continue;
    }
    const assetReady = applyFlowSample(
      element,
      currentSample,
      motion.fallbackAssetUrl,
      requestGeometry,
      themedAssetUrl,
    );
    const advance = assetReady
      ? motion.behavior.advance(elapsedMs + motion.pendingElapsedMs, true)
      : {
          distancePx: distanceWhileAssetPending(currentSample, elapsedMs),
          remainingMs: motion.pendingElapsedMs,
          sample: currentSample,
        };
    motion.pendingElapsedMs = advance.remainingMs;
    const distance = scenery.travelDistance(
      travelDistanceFor(
        element,
        tokenMotionDistance(
          motion.tokenMotion,
          advance.distancePx,
          element.dataset.status === "working",
          elapsedMs,
        ),
        preferences,
        systemReducedMotion,
      ),
      element,
    );
    const position = advanceTrack(motion.x, motion.direction, distance, motion.maximumX);
    motion.x = position.x;
    motion.direction = position.direction;
    applyFlowSample(
      element,
      advance.sample,
      motion.fallbackAssetUrl,
      requestGeometry,
      scenery.assetFor(element, advance.sample.state),
    );
    scenery.position(element, motion, waveSampler, distance !== 0 && advance.sample.moving);
  }
}
