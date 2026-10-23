import { waitForImage } from "./image-source";

export async function showStudioImage(image: HTMLImageElement, source: string): Promise<void> {
  image.hidden = true;
  const ready = waitForImage(image, { source });
  try {
    await ready;
    image.hidden = false;
  } catch (error) {
    image.removeAttribute("src");
    throw error;
  }
}

export async function waitForStudioImages(images: readonly HTMLImageElement[]): Promise<void> {
  await Promise.all(images.map((image) => waitForImage(image)));
}
