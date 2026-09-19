async function decoded(image: HTMLImageElement): Promise<void> {
  if (!image.complete) {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
      };
      const loaded = () => {
        cleanup();
        resolve();
      };
      const failed = () => {
        cleanup();
        reject(new Error("The image could not be displayed."));
      };
      image.addEventListener("load", loaded);
      image.addEventListener("error", failed);
    });
  }
  if (image.naturalWidth <= 0) throw new Error("The image could not be displayed.");
  try {
    await image.decode();
  } catch {
    throw new Error("The image could not be displayed.");
  }
}

export async function showStudioImage(image: HTMLImageElement, source: string): Promise<void> {
  image.hidden = true;
  image.src = source;
  try {
    await decoded(image);
    image.hidden = false;
  } catch (error) {
    image.removeAttribute("src");
    throw error;
  }
}

export async function waitForStudioImages(images: readonly HTMLImageElement[]): Promise<void> {
  await Promise.all(images.map(decoded));
}
