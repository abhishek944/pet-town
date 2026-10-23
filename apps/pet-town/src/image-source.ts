/** Wait for an image without entering WebKit's explicit asynchronous decode path. */
export function waitForImage(
  image: HTMLImageElement,
  { signal, source }: { signal?: AbortSignal; source?: string } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      image.removeEventListener("load", loaded);
      image.removeEventListener("error", failed);
      signal?.removeEventListener("abort", aborted);
    };
    const loaded = () => {
      cleanup();
      if (image.naturalWidth > 0 && image.naturalHeight > 0) resolve();
      else reject(new Error("The image could not be displayed."));
    };
    const failed = () => {
      cleanup();
      reject(new Error("The image could not be displayed."));
    };
    const aborted = () => {
      cleanup();
      reject(new DOMException("Image loading canceled", "AbortError"));
    };
    if (signal?.aborted) {
      aborted();
      return;
    }
    image.addEventListener("load", loaded);
    image.addEventListener("error", failed);
    signal?.addEventListener("abort", aborted, { once: true });
    if (source !== undefined) image.src = source;
    else if (image.complete) loaded();
  });
}

/** The caller owns the returned source and must clear it after drawing or disposal. */
export async function loadImageSource(
  source: string,
  signal?: AbortSignal,
): Promise<HTMLImageElement> {
  if (signal?.aborted) throw new DOMException("Image loading canceled", "AbortError");
  const image = new Image();
  image.decoding = "sync";
  const ready = waitForImage(image, { signal, source });
  try {
    await ready;
    return image;
  } catch (error) {
    image.removeAttribute("src");
    throw error;
  }
}
