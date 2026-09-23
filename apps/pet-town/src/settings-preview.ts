import type { CompiledBehaviorPack, CompiledClip } from "./flow-types";

export interface PreviewAnimationOption {
  id: string;
  label: string;
  assetUrl: string;
  scale: number;
  locomotion: boolean;
}

function readableName(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function option(
  id: string,
  label: string,
  clip: CompiledClip,
  locomotion: boolean,
): PreviewAnimationOption | null {
  if (!clip.assetUrl) return null;
  return {
    id,
    label,
    assetUrl: clip.assetUrl,
    scale: clip.scale,
    locomotion,
  };
}

export function selectedPreviewAnimationId(
  options: readonly PreviewAnimationOption[],
  preferred?: string,
): string {
  if (preferred && options.some((item) => item.id === preferred)) return preferred;
  return options.find((item) => item.locomotion)?.id ?? options[0]?.id ?? "";
}

export function previewAnimations(pack: CompiledBehaviorPack): PreviewAnimationOption[] {
  const result: PreviewAnimationOption[] = [];
  for (const [clipName, clip] of Object.entries(pack.clips)) {
    const walking = Object.values(pack.stateAssignments).some(
      (assignment) =>
        assignment.visible && assignment.animation === clipName && assignment.action === "walking",
    );
    const item = option(`clip:${clipName}`, readableName(clipName), clip, walking);
    if (item) result.push(item);
  }
  return result;
}
