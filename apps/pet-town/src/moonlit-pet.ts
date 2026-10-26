import climbPreviewUrl from "./moonlit-assets/cat-climb.apng?url";
import type { CompiledClip } from "./flow-types";
import {
  behaviorPackForCharacter,
  bundledBehaviorPackForCharacter,
  isSystemPet,
} from "./character-packs";

interface ClimbingArt {
  frameDurationMs: number;
  grips: [number, number][];
  restFrame: number;
  foot: [number, number];
}

const metadata = import.meta.glob<ClimbingArt>("./moonlit-assets/climbers/*/climb.json", {
  eager: true,
  import: "default",
});
const previews = import.meta.glob<string>("./moonlit-assets/climbers/*/climb.apng", {
  eager: true,
  import: "default",
  query: "?url",
});
const images = import.meta.glob(
  ["./moonlit-assets/*.png", "./moonlit-assets/climbers/*/frame-*.png"],
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

/** Separate from the existing exact-nine activity sidecar format. */
export function bundledCanopyPet(id: string): boolean {
  return isSystemPet(id) && behaviorPackForCharacter(id) === bundledBehaviorPackForCharacter(id);
}

function climbingArt(id: string): ClimbingArt | undefined {
  return metadata[`./moonlit-assets/climbers/${id}/climb.json`];
}

export function hasClimbingArt(id: string): boolean {
  return bundledCanopyPet(id) && (id === "cat" || Boolean(climbingArt(id)));
}

export function climbingFrame(frame: number, id = "cat"): string {
  const number = String(frame + 1).padStart(2, "0");
  return images[
    id === "cat"
      ? `./moonlit-assets/cat-climb-${number}.png`
      : `./moonlit-assets/climbers/${id}/frame-${number}.png`
  ];
}

export function climbingGrip(id: string, frame: number): readonly [number, number] {
  return climbingArt(id)?.grips[frame] ?? CLIMB_GRIPS[frame];
}

export function climbingRestFrame(id: string): number {
  return climbingArt(id)?.restFrame ?? 3;
}

export function climbingFoot(id: string): number {
  return climbingArt(id)?.foot[1] ?? 402 / 512;
}

export function canopyPerch(id: string): string | null {
  return bundledCanopyPet(id) ? (images[`./moonlit-assets/${id}-perch.png`] ?? null) : null;
}

/** Settings previews use the accepted APNG; live playback uses the shared-clock PNGs. */
export function canopyPreviewPose(id: string, state: string): CompiledClip | null {
  const supported = hasClimbingArt(id);
  const assetUrl = supported
    ? state === "working"
      ? id === "cat"
        ? climbPreviewUrl
        : previews[`./moonlit-assets/climbers/${id}/climb.apng`]
      : climbingFrame(climbingRestFrame(id), id)
    : canopyPerch(id);
  if (!assetUrl) return null;
  return {
    name: `canopy:${state}`,
    durationMs: (climbingArt(id)?.frameDurationMs ?? 150) * 6,
    role: "stationary",
    assetPath: supported ? `${id}-climb.apng` : `${id}-perch.png`,
    assetUrl,
    holdAssetPath: null,
    holdAssetUrl: null,
    sourceFacing: "right",
    mirror: false,
    scale: supported ? 84 / 44 : 64 / 44,
  };
}

// Measured top-paw contacts in the accepted 512px cells. The vine's near edge
// meets the paw; frame04 is a crouch, never substituted for descent artwork.
export const CLIMB_GRIPS = [
  [426 / 512, 95 / 512],
  [436 / 512, 80 / 512],
  [432 / 512, 86 / 512],
  [414 / 512, 212 / 512],
  [429 / 512, 80 / 512],
  [436 / 512, 83 / 512],
] as const;
