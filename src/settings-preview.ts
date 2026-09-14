import type { CompiledBehaviorPack, CompiledClip, FlowNode } from "./flow-types";

export interface PreviewAnimationOption {
  id: string;
  label: string;
  assetUrl: string;
  scale: number;
  locomotion: boolean;
}

function firstClip(node: FlowNode): string | null {
  if (node.type === "play" || node.type === "move") return node.clip;
  if (node.type === "sequence") {
    for (const step of node.steps) {
      const clip = firstClip(step);
      if (clip) return clip;
    }
  }
  if (node.type === "choose") {
    for (const choice of node.choices) {
      const clip = firstClip(choice.flow);
      if (clip) return clip;
    }
  }
  if (node.type === "repeat" || node.type === "loop") return firstClip(node.flow);
  return null;
}

function readableName(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function option(id: string, label: string, clip: CompiledClip): PreviewAnimationOption | null {
  if (!clip.assetUrl) return null;
  return {
    id,
    label,
    assetUrl: clip.assetUrl,
    scale: clip.scale,
    locomotion: clip.role === "locomotion",
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
  const usedAssets = new Set<string>();
  for (const [actionId, action] of Object.entries(pack.actions)) {
    const clipName = firstClip(action.flow);
    const clip = clipName ? pack.clips[clipName] : undefined;
    const item = clip ? option(`action:${actionId}`, action.label, clip) : null;
    if (item && !usedAssets.has(item.assetUrl)) {
      result.push(item);
      usedAssets.add(item.assetUrl);
    }
  }
  for (const [clipName, clip] of Object.entries(pack.clips)) {
    const item = option(`clip:${clipName}`, readableName(clipName), clip);
    if (item && !usedAssets.has(item.assetUrl)) {
      result.push(item);
      usedAssets.add(item.assetUrl);
    }
  }
  return result;
}
