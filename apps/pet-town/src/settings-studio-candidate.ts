import { invoke } from "@tauri-apps/api/core";

export type AnimationFramesView = { animationId: string; role: string; dataUrls: string[] };

export function loadPartialFrames(
  draftId: string,
  animationId: string,
): Promise<AnimationFramesView | null> {
  return invoke("get_pet_animation_candidate", {
    request: { draftId, animationId },
  });
}
