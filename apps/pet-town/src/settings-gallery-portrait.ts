import { behaviorPackForCharacter } from "./character-packs";
import { previewAnimations } from "./settings-preview";
import { loadImageSource, waitForImage } from "./image-source";

/** Draw one static portrait, then release its temporary animated source. */
export async function drawPortrait(
  image: HTMLImageElement,
  petId: string,
  signal: AbortSignal,
): Promise<void> {
  const canvas = document.createElement("canvas");
  let source: HTMLImageElement | undefined;
  try {
    const options = previewAnimations(behaviorPackForCharacter(petId));
    const animation = options.find((item) => item.locomotion) ?? options[0];
    if (!animation) throw new Error("No preview animation");
    source = await loadImageSource(animation.assetUrl, signal);
    if (signal.aborted || !image.isConnected)
      throw new DOMException("Portrait canceled", "AbortError");
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not draw preview");
    context.drawImage(source, 0, 0);
    const portrait = canvas.toDataURL("image/png");
    source.removeAttribute("src");
    source = undefined;
    canvas.width = 0;
    canvas.height = 0;
    await waitForImage(image, { source: portrait, signal });
    if (!signal.aborted && image.isConnected) image.dataset.ready = "true";
  } catch (error) {
    if (signal.aborted || !image.isConnected) throw error;
    const fallback = document.createElement("span");
    fallback.className = "portrait-error";
    fallback.textContent = "Preview unavailable";
    image.replaceWith(fallback);
  } finally {
    source?.removeAttribute("src");
    canvas.width = 0;
    canvas.height = 0;
  }
}
