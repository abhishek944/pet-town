import type { CapabilityId } from "@pet-village/core";
import type { AnimationAsset } from "./pets";

function frameKeyframes(frames: number): Keyframe[] {
  if (frames <= 1) return [{ backgroundPosition: "0% 0" }];
  const keyframes = Array.from({ length: frames }, (_, index) => ({
    backgroundPosition: `${(index / (frames - 1)) * 100}% 0`,
    offset: index / frames,
    easing: "steps(1, end)",
  }));
  keyframes.push({ backgroundPosition: "100% 0", offset: 1, easing: "steps(1, end)" });
  return keyframes;
}

export function startSpritePreview(
  preview: HTMLElement,
  asset: AnimationAsset,
  reducedMotion: boolean,
): void {
  preview.getAnimations().forEach((animation) => animation.cancel());
  if (reducedMotion) return;
  preview.animate(frameKeyframes(asset.frames), {
    duration: asset.frames * asset.frameDuration,
    iterations: Infinity,
  });
}

export async function runStudioInteractionPreview(
  container: HTMLElement,
  preview: HTMLElement,
  asset: AnimationAsset,
  capability: CapabilityId,
  reducedMotion: boolean,
): Promise<void> {
  preview.getAnimations().forEach((animation) => animation.cancel());
  const duration = Math.min(asset.frames * asset.frameDuration, 1_500);
  const animations: Animation[] = [];
  if (!reducedMotion)
    animations.push(preview.animate(frameKeyframes(asset.frames), { duration, iterations: 1 }));
  const transforms: Partial<Record<CapabilityId, Keyframe[]>> = {
    walk: [
      { transform: "translateX(-28px)" },
      { transform: "translateX(28px)" },
      { transform: "translateX(0)" },
    ],
    wave: [
      { transform: "rotate(-4deg)" },
      { transform: "rotate(4deg)" },
      { transform: "rotate(0)" },
    ],
    sleep: [{ transform: "scale(1)" }, { transform: "scale(.94)" }, { transform: "scale(1)" }],
    dance: [
      { transform: "translateX(-18px) rotate(-5deg)" },
      { transform: "translateX(18px) rotate(5deg)" },
      { transform: "none" },
    ],
  };
  const choreography = transforms[capability];
  if (!reducedMotion && choreography)
    animations.push(preview.animate(choreography, { duration, iterations: 1 }));
  const prop =
    capability === "throw" || capability === "catch" ? document.createElement("i") : null;
  if (prop) {
    prop.className = "studio-ball";
    prop.setAttribute("aria-hidden", "true");
    container.append(prop);
    const travel = capability === "throw" ? ["-18px", "150px"] : ["150px", "-18px"];
    animations.push(
      prop.animate(
        [{ transform: `translateX(${travel[0]})` }, { transform: `translateX(${travel[1]})` }],
        { duration: reducedMotion ? 250 : duration, iterations: 1 },
      ),
    );
  }
  if (animations.length === 0)
    animations.push(preview.animate([{ opacity: 0.7 }, { opacity: 1 }], { duration: 250 }));
  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  prop?.remove();
  if (preview.isConnected) startSpritePreview(preview, asset, reducedMotion);
}
